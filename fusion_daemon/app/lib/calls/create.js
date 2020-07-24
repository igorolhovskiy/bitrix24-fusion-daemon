const log = require('app/init/logger')(module),
      bitrixConfig = require('app/config/bitrix'),
      createB24Call = require('app/lib/bitrix/createB24Call'),
      getB24EmployeeList = require('app/lib/bitrix/getB24EmployeeList');

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

            if (employeeList[legBNumber]) {
                log("Registering inbound call to extension " + legBNumber);
                let bitrix24Info = {
                    url: bitrixConfig.url,
                    callerid: legANumber,
                    calleeid: legBNumber,
                    userID: employeeList[legBNumber],
                    callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
                    type: 2 // 1 - outbound, 2 - inbound.
                }

                createB24Call(bitrix24Info, cache)
                    .then((b24callInfo) => {                    
                        log("Registered inbound call " + bitrix24Info['callUuid'] + " -> " + b24callInfo['uuid']);
                    }).catch((err) => {
                        // If we can't get call UUID - do nothing. Really
                        log("Registering inbound call " + bitrix24Info['callUuid'] + " failed: " + err);
                    });
            }

            if (employeeList[legANumber]) {
                log("Registering outbound call from extension " + legANumber);
                let bitrix24Info = {
                    url: bitrixConfig.url,
                    callerid: legBNumber,
                    calleeid: legANumber,
                    userID: employeeList[legANumber],
                    callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
                    type: 1 // 1 - outbound, 2 - inbound.
                }

                createB24Call(bitrix24Info, cache)
                    .then(b24callInfo => {                    
                        log("Registered outbound call " + bitrix24Info['callUuid'] + " -> " + b24callInfo['uuid']);
                    }).catch(err => {
                        // If we can't get call UUID - do nothing. Really
                        log("Registering outbound call " + bitrix24Info['callUuid'] + " failed: " + err);
                    });
            }
        })
        .catch(err => {
            log("create Cannot get employeeList: " + err);
        });
}

module.exports = create;