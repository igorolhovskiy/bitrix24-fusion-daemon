const log = require('app/init/logger')(module),
    createB24Call = require('app/lib/bitrix/createB24Call'),
    getB24EmployeeList = require('app/lib/bitrix/getB24EmployeeList'),
    getB24ContactInfo = require('app/lib/bitrix/getB24ContactInfo'),
    commentB24Timeline = require('app/lib/bitrix/commentB24Timeline'),
    fusionConfig = require('app/config/fusion'),
    bitrixConfig = require('app/config/bitrix');

let create = (headers, cache) => {

    // Get correct LegA/LegB numbers
    let legBNumber = headers['variable_callee_id_number'] || headers['variable_dialed_user'] || headers['Caller-Destination-Number'];
    let legANumber = headers['Caller-Orig-Caller-ID-Number'] || headers['Caller-Caller-ID-Number'];

    // Adjust click2call case
    if (headers['Caller-RDNIS'] && headers['Caller-Source'] === 'src/switch_ivr_originate.c') {
        log('Click2Call initiated call, adjusting legA/B numbers...');
        legBNumber = legANumber;
        legANumber = headers['Caller-RDNIS'] || headers['Caller-Caller-ID-Number'];
    }

    log('Processing call ' + legANumber + ' -> ' + legBNumber);

    getB24EmployeeList(cache)
        .then(getB24EmployeeListResult => {

            let employeeList = getB24EmployeeListResult['phoneToId'],
                isCallRegistered = false,
                bitrix24Info = {
                    callUuid: headers['variable_call_uuid'] || headers['variable_uuid']
                };

            if (employeeList[legBNumber]) {

                isCallRegistered = true;
                log('Created inbound call to extension ' + legBNumber);

                bitrix24Info['callerid'] = legANumber;
                bitrix24Info['calleeid'] = legBNumber;
                bitrix24Info['userID'] = employeeList[legBNumber];
                bitrix24Info['did'] = headers['Caller-RDNIS'] || headers['Other-Leg-RDNIS'] || headers['variable_outbound_caller_id_number'];
                bitrix24Info['type'] = 2;

                createB24Call(bitrix24Info, cache)
                    .then(b24callInfo => log('Created inbound call ' + bitrix24Info['callUuid'] + '_' + bitrix24Info['type'] + ' -> ' + b24callInfo['uuid']))
                    // If we can't get call UUID - do nothing. Really
                    .catch(err => log('ERROR creation of inbound call ' + bitrix24Info['callUuid'] + ': ' + err));
            }

            if (employeeList[legANumber]) {

                isCallRegistered = true;
                log('Created outbound call from extension ' + legANumber);

                bitrix24Info['callerid'] = legBNumber;
                bitrix24Info['calleeid'] = legANumber;
                bitrix24Info['userID'] = employeeList[legANumber];
                bitrix24Info['type'] = 1;

                createB24Call(bitrix24Info, cache)
                    .then(b24callInfo => log('Created outbound call ' + bitrix24Info['callUuid'] + '_' + bitrix24Info['type'] + ' -> ' + b24callInfo['uuid']))
                    // If we can't get call UUID - do nothing. Really
                    .catch(err => log('ERROR creation of outbound call ' + bitrix24Info['callUuid'] + ': ' + err));
            }

            if (!isCallRegistered) {

                log('Registering call to default user');

                // Set default settings
                bitrix24Info['callerid'] = legANumber;
                bitrix24Info['calleeid'] = legBNumber;
                bitrix24Info['userID'] = bitrixConfig.defaultUserID;
                bitrix24Info['type'] = 1;

                // Check if legA lenght > localNumber lenght and adjust call type to inbound
                if (legANumber.length > fusionConfig.localNumberLength) {
                    bitrix24Info['type'] = 2;
                    bitrix24Info['did'] = headers['Caller-RDNIS'] || headers['Other-Leg-RDNIS'] || headers['variable_outbound_caller_id_number'];
                }

                createB24Call(bitrix24Info, cache)
                    .then(b24callInfo => log('Created generic call '  + bitrix24Info['callUuid'] + '_' + bitrix24Info['type'] + ' -> ' + b24callInfo['uuid']))
                    // If we can't get call UUID - do nothing. Really
                    .catch(err => log('Created generic call ' + bitrix24Info['callUuid'] + ' failed: ' + err));
            }

            // Additional processing of call in a case if call was done not to dediacated manager (DID)
            if (bitrix24Info['did'] && bitrixConfig.showIMNotification && bitrixConfig.showNotAssignedCallToManager) {
                log('Additional processing of call required ' + legANumber + ' -> ' + bitrix24Info['did'] + ' -> ' + legBNumber);
                
                let didEmployeeMap = getB24EmployeeListResult['DidToId'];
                let didCalled = bitrix24Info['did'];

                if (didEmployeeMap[didCalled]) {
                    let didUserID = didEmployeeMap[didCalled];
                    log('DID ' + didCalled + ' is identified with user ' + didUserID);
                    getB24ContactInfo({
                                callerid: legANumber
                            }, cache)
                        .then(contactInfo => {
                            if (contactInfo['ASSIGNED_BY_ID'] != didUserID) {

                                let responsibleUserId = contactInfo['ASSIGNED_BY_ID'];
                                let idToManagerId = getB24EmployeeListResult['IdToManager'];
                                let calledExtension = getB24EmployeeListResult['IdToPhone'][responsibleUserId] || "";

                                log('DID ' + didCalled + ' is not accosiated with dialed user ' + calledExtension + ' (' + responsibleUserId + ') but ' + didUserID);

                                if (idToManagerId[responsibleUserId]) {
                                    let responsibleManagersID = idToManagerId[responsibleUserId];
                                    log('We are notifying manager(s) ' + JSON.stringify(responsibleManagersID) + ' about this call');
                                    for (let responsibleManagerID of responsibleManagersID) {
                                        let contact24Info = {
                                            contactId: responsibleManagerID,
                                            message: 'Call to DID ' + didCalled + ' is not accosiated with dialed user ' + calledExtension + ' (' + responsibleUserId + ') but ' + didUserID
                                        }
                                        commentB24Timeline(contact24Info, cache, (err, res) => {
                                            if (err) {
                                                log(err);
                                            }
                                        });
                                    }
                                }
                            }
                        })
                        .catch(err => log(err));

                }
            }
        })
        .catch(err => log('create Cannot get employeeList: ' + err));
}

module.exports = create;