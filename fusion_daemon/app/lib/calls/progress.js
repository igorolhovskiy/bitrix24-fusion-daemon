const log = require('../../init/logger')(module),
      request = require('urllib'),
      getB24CallInfo = require('../cache/getB24Call'),
      getEmployeeList = require('../cache/getEmployeeList');

function showCallScreen(bitrix24Info, cache, callback) {

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
        cache.put('showscreen_' + bitrix24Info['b24uuid'], JSON.stringify(usersWatchingScreen), 3 * 60 * 60 * 1000); // Store for 3h
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

let progress = (headers, cache) => {

    let dialedUser = headers['variable_dialed_user'] || headers['Caller-Destination-Number'];
    let bitrix24Url = headers['variable_bitrix24_url'];

    getEmployeeList(bitrix24Url, cache, (err, employeeList) => {

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
            userID: employeeList[dialedUser],
            callUuid: headers['variable_call_uuid'] || headers['variable_uuid'],
        }
        // Call function 500 ms after to make sure cache is populated
        setTimeout(() => {
            getB24CallInfo(bitrix24Info, cache)
                .then((b24callInfo) => {
                    if (b24callInfo['type'] === 2) { // Show popup only for incoming calls

                        log("Showing screen to " + dialedUser + "/" + employeeList[dialedUser]);

                        bitrix24Info['b24uuid'] = b24callInfo['uuid'];
                        showCallScreen(bitrix24Info, cache, (err) => {
                            if (err) {
                                log("showCallScreen failed with " + err);
                            }
                        });
                    }
                }).catch((err) => {
                    // If we can't get call UUID - do nothing. Really
                    log("getB24CallInfo failed with " + err);
                });
        }, 500);
    });
}

module.exports = progress;