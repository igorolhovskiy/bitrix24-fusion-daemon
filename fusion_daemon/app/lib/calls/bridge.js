const log = require('../../init/logger')(module),
    request = require('urllib'),
    getB24callUuid = require('../cache/getB24CallUuid'),
    getEmployeeList = require('../cache/getEmployeeList');


function hideCallScreen(bitrix24Info, cache, callback) {

    // Save all showCallScreens to database

    let usersWatchingScreen = cache.get('showscreen_' + bitrix24Info['b24uuid']);

    if (!usersWatchingScreen) {
        log('hideCallScreen No users are watching this call, skipping...');
        callback(null);
        return;
    }
    try {
        usersWatchingScreen = JSON.parse(usersWatchingScreen);
    } catch (e) {
        callback(e);
        return;
    }

    usersWatchingScreen.forEach((user) => {
        if (user !== bitrix24Info['userID']) {

            let requestURL = bitrix24Info['url'] + "/telephony.externalcall.hide?";
                requestURL += "USER_ID=" + user;
                requestURL += "&CALL_ID=" + bitrix24Info['b24uuid'];
            
            request.request(requestURL, (err) => {
                if (err) {
                    log("hideCallScreen " + err);
                }
            });
        }
    });

    callback(null);
}

let bridge = (headers, cache) => {

    if (typeof(headers['Other-Leg-Destination-Number']) == 'undefined') {
        log("Other-Leg-Destination-Number is not set!");
        log(JSON.stringify(headers, null, 2));
        return;
    }

    let dialedUser = headers['Other-Leg-Destination-Number'];
    let bitrix24Url = headers['variable_bitrix24_url'];

    log("Call was answered by " + dialedUser);

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

        getB24callUuid(bitrix24Info, cache)
            .then((b24callUuid) => {
                bitrix24Info['b24uuid'] = b24callUuid;
                log("Hiding call screens...");
                hideCallScreen(bitrix24Info, cache, (err) => {
                    if (err) {
                        log("bridge" + err);
                    }
                });
            }).catch((err) => {
                // If we can't get call UUID - do nothing. Really
                log("bridge " + err);
            });

    });
}

module.exports = bridge;