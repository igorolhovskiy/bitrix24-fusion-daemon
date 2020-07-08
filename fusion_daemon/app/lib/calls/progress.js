const log = require('app/init/logger')(module),
      getB24CallInfo = require('app/lib/bitrix/getB24CallInfo'),
      getB24EmployeeList = require('app/lib/bitrix/getB24EmployeeList'),
      showB24CallScreen = require('app/lib/bitrix/showB24CallScreen'),
      notifyB24User = require('app/lib/bitrix/notifyB24Users'),
      bitrix24Config = require('app/config/bitrix');


let progress = (headers, cache) => {

    let dialedUser =  headers['variable_callee_id_number'] || headers['variable_dialed_user'] || headers['Caller-Destination-Number'];
    let bitrix24Url = headers['variable_bitrix24_url'];

    getB24EmployeeList(bitrix24Url, cache)
        .then(res => {
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
                                showB24CallScreen(bitrix24Info, cache, (err) => {
                                    if (err) {
                                        log("showB24CallScreen failed with " + err);
                                    }
                                });

                                if (bitrix24Config.showIMNotification) {
                                    let legANumber = headers['Caller-Orig-Caller-ID-Number'] || headers['Caller-Caller-ID-Number'];

                                    bitrix24Info['message'] = "Incoming call from " + headers['variable_caller_id_name'] || "" + "<" + legANumber + ">";
                                    
                                    notifyB24User(bitrix24Info, cache, (err) => {
                                        if (err) {
                                            log("notifyB24User failed with " + err);
                                        }
                                    });
                                }
                            }
                        }).catch(err => {
                            // If we can't get call UUID - do nothing. Really
                            log("getB24CallInfo failed with " + err);
                        });
                });  
            }, 500);
        })
        .catch(err => {
            log("Cannot get employeeList: " + err);
        });
}

module.exports = progress;