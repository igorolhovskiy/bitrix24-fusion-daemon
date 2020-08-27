const log = require('app/init/logger')(module),
    notifyB24User = require('app/lib/bitrix/notifyB24Users'),
    bitrixConfig = require('app/config/bitrix'),
    getB24CallInfo = require('app/lib/bitrix/getB24CallInfo'),
    getB24EmployeeList = require('app/lib/bitrix/getB24EmployeeList'),
    finishB24Call = require('app/lib/bitrix/finishB24Call'),
    getB24ContactInfo = require('app/lib/bitrix/getB24ContactInfo'),
    commentB24Timeline = require('app/lib/bitrix/commentB24Timeline'),
    hangupCauseTable = require('app/config/freeswitch').hangupCause;

let hangup = (headers, cache) => {

    if (headers['variable_bitrix24_channel'] === 'callee' && headers['Hangup-Cause'] === 'LOSE_RACE') {
        log('Not processing hangup for LOSE_RACE callee');
        return;
    }

    if (headers['variable_transfer_disposition'] === 'recv_replace') {
        log('Not processing hangup for transferred calls');
        return;
    }

    let bitrix24Info = {
        callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
    }

    getB24CallInfo(bitrix24Info, cache).forEach(legInfo => {
        legInfo
            .then(b24callInfo => {

                bitrix24Info['b24uuid'] = b24callInfo['uuid'];
                bitrix24Info['userID'] = b24callInfo['userID'];
                bitrix24Info['type'] = b24callInfo['type'];
                bitrix24Info['callerid'] = b24callInfo['phone'];

                bitrix24Info['sip_code'] = headers['variable_sip_term_status']
                    || headers['variable_proto_specific_hangup_cause']
                    || headers['variable_sip_invite_failure_status']
                    || headers['variable_last_bridge_proto_specific_hangup_cause'];

                if (headers['Hangup-Cause'] === 'LOSE_RACE') {
                    bitrix24Info['sip_code'] = '487';
                }

                // Known cases for adjusting sip_code
                if (!bitrix24Info['sip_code']
                    || bitrix24Info['sip_code'] === '') {

                    // Call is answered.
                    if (headers['variable_sip_hangup_phrase'] === 'OK'
                            && headers['variable_hangup_cause'] === 'NORMAL_CLEARING'
                            && headers.hasOwnProperty('variable_rtp_audio_in_raw_bytes')) {
                        bitrix24Info['sip_code'] = '200';
                    }

                    // AttXfer
                    if (headers['variable_transfer_disposition'] === 'replaced'
                            && headers['variable_hangup_cause'] === 'NORMAL_CLEARING'
                            && headers.hasOwnProperty('variable_rtp_audio_in_raw_bytes')) {
                        bitrix24Info['sip_code'] = '200';
                    }

                    // No Answer
                    if (headers['variable_DIALSTATUS'] === 'NOANSWER'
                            && headers['variable_originate_disposition'] === 'NO_ANSWER') {
                        bitrix24Info['sip_code'] = '480';
                    }

                    // Answered
                    if (headers.hasOwnProperty('variable_rtp_audio_in_raw_bytes')
                            && headers['variable_DIALSTATUS'] === 'SUCCESS'
                            && headers['variable_endpoint_disposition'] === 'ANSWER') {
                        bitrix24Info['sip_code'] = '200';
                    }
                }


                if (!bitrix24Info['sip_code'] || bitrix24Info['sip_code'] === '') {
                    log('Cannot get correct hangup code, using 486');
                    log(JSON.stringify(headers, null, 2));
                    bitrix24Info['sip_code'] = '486';
                }
                bitrix24Info['sip_code'] = bitrix24Info['sip_code'].replace('sip:', '');

                // Adjust Click2Call hangup code
                if (headers['variable_click_to_call'] === 'true') {
                    bitrix24Info['sip_code'] = hangupCauseTable[headers['variable_bridge_hangup_cause']] || '486';

                }
                bitrix24Info['duration'] = headers['variable_billsec'] || '0';

                let dialedUser = headers['Caller-Orig-Caller-ID-Number'] || headers['Caller-Caller-ID-Number'];

                if (b24callInfo['type'] === 2)  {// Get user for inbound call
                    dialedUser = headers['Caller-Callee-ID-Number']
                        || headers['variable_dialed_extension']
                        || headers['variable_dialed_user'];
                }

                if (headers['variable_record_path'] && headers['variable_record_name'] && bitrix24Info['sip_code'] === '200') {
                    // We have a record
                    bitrix24Info['rec_path'] = headers['variable_record_path'];
                    bitrix24Info['rec_file'] = headers['variable_record_name'];
                }

                getB24EmployeeList(cache)
                    .then(res => {
                        let employeeList = res['phoneToId'];

                        // We did get user from request.
                        if (employeeList[dialedUser]) {
                            log('User with extension ' + dialedUser + ' found, using userID: ' + employeeList[dialedUser]);
                            bitrix24Info['userID'] = employeeList[dialedUser];
                        }

                        if (!bitrix24Info.hasOwnProperty('userID')) {
                            log('Setting generic userID for this call. Actually, should not happen');
                            bitrix24Info['userID'] = bitrixConfig.defaultUserID;
                        }

                        // Wait for other CHANNEL_HANGUP_COMPLETE to arrive
                        let bitrix24InfoCached = cache.get('hangup_data_' + bitrix24Info['b24uuid']);
                        if (bitrix24InfoCached) {
                            log('Updating hangup data of ' + bitrix24Info['b24uuid']);
                            // We already have some data of this call. Let's merge.
                            if (bitrix24InfoCached['rec_path']) {
                                log('Updating hangup data of ' + bitrix24Info['b24uuid'] + " with record");
                                bitrix24Info['rec_path'] = bitrix24InfoCached['rec_path'];
                                bitrix24Info['rec_file'] = bitrix24InfoCached['rec_file'];
                            }
                            // Select non-default user if possible
                            if (bitrix24InfoCached['userID']) {
                                bitrix24Info['userID'] = (bitrix24InfoCached['userID'] == bitrixConfig.defaultUserID) ? bitrix24Info['userID'] : bitrix24InfoCached['userID'];
                                log('Updating hangup data of ' + bitrix24Info['b24uuid'] + " with userID " +  bitrix24Info['userID']);
                            }
                        }
                        cache.put('hangup_data_' + bitrix24Info['b24uuid'], bitrix24Info, 3500);

                        setTimeout(() => {
                            //log("Finishing call: " + JSON.stringify(headers, null, 2));
                            finishB24Call(bitrix24Info, cache);

                            let legANumber = headers['Caller-Orig-Caller-ID-Number']
                                    || headers['Caller-Caller-ID-Number'];

                            // Transferred calls situation
                            if (bitrixConfig.showIMNotification && headers['Caller-Transfer-Source']) {

                                let legBNumber = headers['variable_last_sent_callee_id_number']
                                    || headers['Caller-Callee-ID-Number']
                                    || headers['Other-Leg-Callee-ID-Number'];

                                getB24ContactInfo({
                                            callerid: legANumber,
                                            calleeid: legBNumber
                                        }, cache)
                                    .then(contactInfo => {

                                        let contact24Info = {
                                            message: 'Call was transferred to ' + legBNumber,
                                            contactId: contactInfo['ID']
                                        };

                                        commentB24Timeline(contact24Info, cache, (err) => {
                                            if (err) {
                                                log(err);
                                            }
                                        });
                                    })
                                    .catch(err => log(err));
                            }

                            if (bitrixConfig.showIMNotification && bitrix24Info['sip_code'] !== '200') {

                                getB24ContactInfo({
                                            callerid: legANumber,
                                            calleeid: dialedUser
                                        }, cache)
                                    .then(contactInfo => {

                                        bitrix24Info['message'] = 'Call from ' + contactInfo['NAME'] + ' ' + contactInfo['LAST_NAME'] + ' <' + legANumber + '> was missed!';

                                        notifyB24User(bitrix24Info, cache, (err) => {
                                            if (err) {
                                                log('notifyB24User failed with ' + err);
                                            }
                                        });
                                    })
                                    .catch(err => {
                                        log(err);

                                        let legAName = headers.hasOwnProperty('variable_caller_id_name') ? headers['variable_caller_id_name'] : '';
                                        bitrix24Info['message'] = 'Call from ' + legAName + ' <' + legANumber + '> was missed!';

                                        notifyB24User(bitrix24Info, cache, (err) => {
                                            if (err) {
                                                log('notifyB24User failed with ' + err);
                                            }
                                        });
                                });
                            }
                        }, 2500);
                    })
                    .catch(err => log('Hangup: ' + err));
            })
            .catch(err => log('Hangup: ' + err));
    });
}

module.exports = hangup;