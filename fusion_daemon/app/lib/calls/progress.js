const log = require('app/init/logger')(module),
      getB24CallInfo = require('app/lib/bitrix/getB24CallInfo'),
      getB24EmployeeList = require('app/lib/bitrix/getB24EmployeeList'),
      showB24CallScreen = require('app/lib/bitrix/showB24CallScreen'),
      notifyB24User = require('app/lib/bitrix/notifyB24Users'),
      updateB24CallInfo = require('app/lib/bitrix/updateB24CallInfo'),
      getB24ContactInfo = require('app/lib/bitrix/getB24ContactInfo'),
      bitrixConfig = require('app/config/bitrix');

let progress = (headers, cache) => {

    let dialedUser =  headers['variable_callee_id_number'] || headers['variable_dialed_user'] || headers['Caller-Destination-Number'];

    getB24EmployeeList(cache)
        .then(res => {
            let employeeList = res['phoneToId'];

            if (employeeList[dialedUser] === undefined) {
                log('User with extension ' + dialedUser + ' not found');
                return;
            }

            let bitrix24Info = {
                userID: employeeList[dialedUser],
                callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
            }

            updateB24CallInfo(bitrix24Info, cache);

            // Call function 500 ms after to make sure cache is populated
            setTimeout(() => {
                getB24CallInfo(bitrix24Info, cache).forEach(legInfo => {
                    legInfo
                        .then(b24callInfo => {
                            if (b24callInfo['type'] === 2) { // Show popups and notifications only for incoming calls

                                log('Showing screen to ' + dialedUser + '/' + employeeList[dialedUser]);

                                bitrix24Info['b24uuid'] = b24callInfo['uuid'];
                                showB24CallScreen(bitrix24Info, cache, (err) => {
                                    if (err) {
                                        log('showB24CallScreen failed with ' + err);
                                    }
                                });

                                if (bitrixConfig.showIMNotification) {

                                    let legANumber = headers['Caller-Orig-Caller-ID-Number'] || headers['Caller-Caller-ID-Number'];

                                    getB24ContactInfo({
                                            callerid: legANumber,
                                            calleeid: dialedUser
                                            }, cache)
                                        .then(contactInfo => {

                                            bitrix24Info['message'] = 'Incoming call from ' + contactInfo['NAME'] + ' ' + contactInfo['LAST_NAME'] + ' <' + legANumber + '>';

                                            notifyB24User(bitrix24Info, cache, (err) => {
                                                if (err) {
                                                    log('notifyB24User failed with ' + err);
                                                }
                                            });
                                        })
                                        .catch(err => {
                                            log(err);

                                            let legAName = headers.hasOwnProperty('variable_caller_id_name') ? headers['variable_caller_id_name'] : '';
                                            bitrix24Info['message'] = 'Incoming call from ' + legAName + ' <' + legANumber + '>';

                                            notifyB24User(bitrix24Info, cache, (err) => {
                                                if (err) {
                                                    log('notifyB24User failed with ' + err);
                                                }
                                            });
                                    });
                                }
                            }
                        }).catch(err => {
                            // If we can't get call UUID - do nothing. Really
                            log('getB24CallInfo failed with ' + err);
                        });
                });
            }, 500);
        })
        .catch(err => {
            log('Cannot get employeeList: ' + err);
        });
}

module.exports = progress;