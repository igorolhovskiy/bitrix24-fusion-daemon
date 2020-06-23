const log = require('../../init/logger')(module),
      request = require('urllib'),
      getB24callUuid = require('../cache/getB24CallUuid'),
      getEmployeeList = require('../cache/getEmployeeList');

function showCallScreen(bitrix24Info, callback) {

    // Save all showCallScreens to database

    let usersWatchingScreen = cache.get('showscreen_' + bitrix24Info['b24uuid'])
    try {
        if (!usersWatchingScreen) {
            log('Init showCallScreen cache showscreen_' + bitrix24Info['b24uuid']);
            usersWatchingScreen = [bitrix24Info['userID']];
        } else {
            log('Using existing showCallScreen cache showscreen_' + bitrix24Info['b24uuid']);
            usersWatchingScreen = JSON.parse(usersWatchingScreen);
            usersWatchingScreen.push(bitrix24Info['userID']);
        }
        cache.put('showscreen_' + bitrix24Info['b24uuid'], JSON.stringify(usersWatchingScreen), 10800);
    } catch (e) {
        callback(e);
        return;
    }

    let requestURL = bitrix24Info['url'] + "/telephony.externalcall.show?";
        requestURL += "USER_ID=" + bitrix24Info['userID'];
        requestURL += "&CALL_ID=" + bitrix24Info['b24uuid'];
    
    request.request(requestURL, (err) => {
        if (err) {
            callback(err);
        }
    });
}

let progress = (headers) => {

    if (typeof(headers['variable_dialed_user']) == 'undefined') {
        log("variable_dialed_user is not set!");
        return;
    }

    let dialedUser = headers['variable_dialed_user'];
    let bitrix24Url = headers['variable_bitrix24_url'];

    getEmployeeList(bitrix24Url, (err, employeeList) => {

        if (err) {
            log("Cannot get employeeList: " + err);
            return;
        }

        if (typeof employeeList[dialedUser] === 'undefined') {
            log("User with extension " + dialedUser + " not found");
            return;
        }

        let bitrix24Info = {
            url: bitrix24Url,
            callerid: headers['Caller-Caller-ID-Number'],
            userID: employeeList[dialedUser],
            callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
        }

        getB24callUuid(bitrix24Info)
            .then((b24callUuid) => {
                bitrix24Info['b24uuid'] = b24callUuid;

                log("Showing screen to " + dialedUser + "/" + employeeList[dialedUser]);

                showCallScreen(bitrix24Info, (err) => {
                    if (err) {
                        log("showCallScreen failed with " + err);
                        log(bitrix24Info);
                    }
                });
            }).catch((err) => {
                // If we can't get call UUID - do nothing. Really
                log("getB24callUuid failed with " + err);
            });
    });
}

module.exports = progress;