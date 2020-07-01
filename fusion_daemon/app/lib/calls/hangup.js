const log = require('app/init/logger')(module),
    getB24CallInfo = require('app/lib/bitrix/getB24CallInfo'),
    getB24EmployeeList = require('app/lib/bitrix/getB24EmployeeList'),
    finishB24Call = require('app/lib/bitrix/finishB24Call'),
    hangupCauseTable = require('app/config/freeswitch').hangupCause;

let hangup = (headers, cache) => {

    let bitrix24Info = {
        callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
        url: headers['variable_bitrix24_url']
    }

    getB24CallInfo(bitrix24Info, cache).forEach(legInfo => {
        legInfo
            .then(b24callInfo => {

                bitrix24Info['b24uuid'] = b24callInfo['uuid'];
                bitrix24Info['userID'] = b24callInfo['user'];

                bitrix24Info['sip_code'] = headers['variable_sip_term_status'] 
                    || headers['variable_proto_specific_hangup_cause'] 
                    || headers['variable_sip_invite_failure_status']
                    || headers['variable_last_bridge_proto_specific_hangup_cause'];

                if (!bitrix24Info['sip_code'] || bitrix24Info['sip_code'] === '') {
                    log("Cannot get correct hangup code, using 486");
                    bitrix24Info['sip_code'] = "486";
                }
                bitrix24Info['sip_code'] = bitrix24Info['sip_code'].replace('sip:', '');

                // Adjust Click2Call hangup code
                if (headers['variable_click_to_call'] === 'true') {
                    bitrix24Info['sip_code'] = hangupCauseTable[headers['variable_bridge_hangup_cause']] || "486";

                }
                bitrix24Info['duration'] = headers['variable_billsec'] || "0";

                let dialedUser = headers['Caller-Orig-Caller-ID-Number'] || headers['Caller-Caller-ID-Number'];

                if (b24callInfo['type'] === 2)  {// Get user for inbound call
                    dialedUser = headers['last_sent_callee_id_number'] 
                        || headers['Other-Leg-Destination-Number'] 
                        || headers['variable_dialed_user'];
                }

                getB24EmployeeList(bitrix24Info['url'], cache, (err, res) => {
                    
                    let employeeList = res['phone_to_id'];

                    // We did get user from request.
                    if (employeeList[dialedUser]) {
                        log("User with extension " + dialedUser + " found, using it");
                        bitrix24Info['userID'] = employeeList[dialedUser];
                    }

                    finishB24Call(bitrix24Info, cache);
                });
            })
            .catch(err => {
                log(err);
            });
    });
}

module.exports = hangup;