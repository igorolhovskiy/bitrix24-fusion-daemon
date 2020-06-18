const log = require('../../init/logger')(module),
      request = require('urllib'),
      commonBody = require('./common'),
      getEmployeeList = require('../cache/getEmployeeList');

function showCallScreen(bitrix24Info, cache, callback) {

    // Save all showCallScreens to database

    let usersWatchingScreen = cache.get('showscreen_' +bitrix24Info['b24uuid'])
    try {
        if (!usersWatchingScreen) {
            usersWatchingScreen = [bitrix24Info['userID']];
        } else {
            usersWatchingScreen = JSON.parse(usersWatchingScreen);
            usersWatchingScreen.push(bitrix24Info['userID']);
        }
        cache.put('showscreen_' +bitrix24Info['b24uuid'], JSON.stringify(usersWatchingScreen));
    } catch (e) {
        callback(e, null);
        return;
    }
}

function registerCall(bitrix24Info, cache, callback) {

}

let progress = (headers, cache) => {

    if (typeof(headers['variable_dialed_user']) == 'undefined') {
        log("variable_dialed_user is not set!");
        return;
    }

    let dialedUser = headers['variable_dialed_user'];

    let bitrix24Url = headers['variable_bitrix24_url']

    getEmployeeList(bitrix24Url, (err, employeeList) => {

        if (err) {
            log("Cannot get employeeList: " + err);
            return;
        }

        if (typeof employeeList[dialedUser] === 'undefined') {
            log("User with " + dialedUser + " extension not found");
            return;
        }

        let bitrix24Info = {
            url: bitrix24Url,
            callerid: headers['Caller-ID-Number'],
            userID: employeeList[dialedUser]
        }

        let uuid = headers['variable_call_uuid'] || headers['variable_uuid'];
        let b24uuid = cache.get('callinfo_' + uuid);

        if (b24uuid) {
            // We aware of this call
            if (b24uuid === 'none') {
                // We're waiting here for update
            } else {
                // We're aware of bitrix24uuid
                bitrix24Info['b24uuid'] = b24uuid;

                showCallScreen(bitrix24Info, cache, (err, res) => {
                    if (err) {
                        log("Cannot show callScreen: " + err);
                    }
                });
            }
            return;
        }

        cache.put('callinfo_' + uuid, 'none', 3600);

        registerCall(bitrix24Info, (err, b24info) => {
            if (err) {
                log("Cannot register call with Bitrix24:" + err);
                return;
            }
            cache.put('callinfo_' + uuid, b24info.uuid, 3600);

            bitrix24Info['b24uuid'] = b24info.uuid;

            showCallScreen(bitrix24Info, cache, (err, res) => {
                if (err) {
                    log("Cannot show call screen:" + err);
                }
            });
        });
    });

    
}

module.exports = progress;