const log = require('../../init/logger')(module),
      getB24CallInfo = require('../bitrix/getB24Call'),
      getB24EmployeeList = require('../bitrix/getB24EmployeeList'),
      showCallScreen = require('../bitrix/showCallScren');


let progress = (headers, cache) => {

    let dialedUser = headers['variable_dialed_user'] || headers['Caller-Destination-Number'];
    let bitrix24Url = headers['variable_bitrix24_url'];

    getB24EmployeeList(bitrix24Url, cache, (err, res) => {
        if (err) {
            log("Cannot get employeeList: " + err);
            return;
        }

        let employeeList = res['phone_to_id'];

        if (typeof employeeList[dialedUser] === 'undefined') {
            log("User with extension " + dialedUser + " not found");
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
                    .then(b24callInfo => {
                        if (b24callInfo['type'] === 2) { // Show popup only for incoming calls

                            log("Showing screen to " + dialedUser + "/" + employeeList[dialedUser]);

                            bitrix24Info['b24uuid'] = b24callInfo['uuid'];
                            showCallScreen(bitrix24Info, cache, (err) => {
                                if (err) {
                                    log("showCallScreen failed with " + err);
                                }
                            });
                        }
                    }).catch(err => {
                        // If we can't get call UUID - do nothing. Really
                        log("progress getB24CallInfo failed with " + err);
                    });
            });  
        }, 500);
    });
}

module.exports = progress;