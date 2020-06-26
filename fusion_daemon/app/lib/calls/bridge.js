const log = require('../../init/logger')(module),
    getB24CallInfo = require('../bitrix/getB24Call'),
    getEmployeeList = require('../bitrix/getEmployeeList'),
    hideCallScreen = require('../bitrix/hideCallScreen');

let bridge = (headers, cache) => {

    if (typeof(headers['Other-Leg-Destination-Number']) == 'undefined') {
        log("Other-Leg-Destination-Number is not set!");
        log(JSON.stringify(headers, null, 2));
        return;
    }

    let dialedUser = headers['Other-Leg-Destination-Number'];
    let bitrix24Url = headers['variable_bitrix24_url'];

    log("bridge Call was answered by " + dialedUser);

    getEmployeeList(bitrix24Url, cache, (err, employeeList) => {

        if (err) {
            log("bridge Cannot get employeeList: " + err);
            return;
        }

        if (typeof employeeList[dialedUser] === 'undefined') {
            log("bridge User with extension " + dialedUser + " not found");
            return;
        }

        let bitrix24Info = {
            url: bitrix24Url,
            userID: employeeList[dialedUser],
            callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
        }
        
        // Call function 500 ms after to make sure cache is populated
        setTimeout(() => {
            getB24CallInfo(bitrix24Info, cache).forEach(legInfo => {
                legInfo
                    .then((b24callInfo) => {

                        bitrix24Info['b24uuid'] = b24callInfo['uuid'];
                        if (b24callInfo['type'] === 2) { // Processing screens only for inbound calls

                            log("bridge Hiding call screens...");

                            hideCallScreen(bitrix24Info, cache, (err) => {
                                if (err) {
                                    log("bridge" + err);
                                }
                            });
                        }
                    }).catch((err) => {
                        // If we can't get call UUID - do nothing. Really
                        log("bridge " + err);
                    });
            })
        }, 500);

    });
}

module.exports = bridge;