const log = require('app/init/logger')(module),
      createB24Call = require('app/lib/bitrix/createB24Call'),
      getB24EmployeeList = require('app/lib/bitrix/getB24EmployeeList'),
      fusionConfig = require('app/config/fusion'),
      bitrixConfig = require('app/config/bitrix');

let create = (headers, cache) => {

    // Get correct LegA/LegB numbers

    let legBNumber = headers['variable_callee_id_number'] || headers['variable_dialed_user'] || headers['Caller-Destination-Number'];
    let legANumber = headers['Caller-Orig-Caller-ID-Number'] || headers['Caller-Caller-ID-Number'];

    if (headers['Caller-RDNIS'] && headers['Caller-Source'] === 'src/switch_ivr_originate.c') {
        log("Click2Call initiated call, adjusting legA/B numbers...");
        legBNumber = legANumber;
        legANumber = headers['Caller-RDNIS'] || headers['Caller-Caller-ID-Number'];
    }

    log("Processing call " + legANumber + " -> " + legBNumber);

    getB24EmployeeList(cache)
        .then(res => {

            let employeeList = res['phone_to_id'];
            let isCallRegistered = false;

            if (employeeList[legBNumber]) {

                isCallRegistered = true;
                log("Created inbound call to extension " + legBNumber);

                let bitrix24Info = {
                    callerid: legANumber,
                    calleeid: legBNumber,
                    userID: employeeList[legBNumber],
                    callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
                    type: 2 // 1 - outbound, 2 - inbound.
                }

                createB24Call(bitrix24Info, cache)
                    .then((b24callInfo) => {                    
                        log("Created inbound call " + bitrix24Info['callUuid'] + "_" + bitrix24Info['type'] + " -> " + b24callInfo['uuid']);
                    }).catch((err) => {
                        // If we can't get call UUID - do nothing. Really
                        log("ERROR creation of inbound call " + bitrix24Info['callUuid'] + ": " + err);
                    });
            }

            if (employeeList[legANumber]) {

                isCallRegistered = true;
                log("Created outbound call from extension " + legANumber);

                let bitrix24Info = {
                    callerid: legBNumber,
                    calleeid: legANumber,
                    userID: employeeList[legANumber],
                    callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
                    type: 1 // 1 - outbound, 2 - inbound.
                }

                createB24Call(bitrix24Info, cache)
                    .then(b24callInfo => {                    
                        log("Created outbound call " + bitrix24Info['callUuid'] + "_" + bitrix24Info['type'] + " -> " + b24callInfo['uuid']);
                    }).catch(err => {
                        // If we can't get call UUID - do nothing. Really
                        log("ERROR creation of outbound call " + bitrix24Info['callUuid'] + ": " + err);
                    });
            }

            if (!isCallRegistered) {

                log("Registering call to default user");
                let callType = 1; // Assuming outbound call by default
                let callerID = legANumber;
                let calleeID = legBNumber;

                // Check if legA lenght > localNumber lenght and adjust call type to inbound
                if (legANumber.length > fusionConfig.localNumberLength) {
                    callType = 2;
                    callerID = legANumber;
                    calleeID = legBNumber;
                }

                let bitrix24Info = {
                    callerid: callerID,
                    calleeid: calleeID,
                    userID: bitrixConfig.defaultUserID,
                    callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
                    type: callType
                }

                createB24Call(bitrix24Info, cache)
                    .then(b24callInfo => {                    
                        log("Created generic call "  + bitrix24Info['callUuid'] + "_" + callType + " -> " + b24callInfo['uuid']);
                    }).catch(err => {
                        // If we can't get call UUID - do nothing. Really
                        log("Created generic call " + bitrix24Info['callUuid'] + " failed: " + err);
                    });
            }
        })
        .catch(err => {
            log("create Cannot get employeeList: " + err);
        });
}

module.exports = create;