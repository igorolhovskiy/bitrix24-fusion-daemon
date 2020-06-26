const log = require('../../init/logger')(module),
    request = require('urllib');

let hideCallScreen = (bitrix24Info, cache, callback) => {

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

module.exports = hideCallScreen;