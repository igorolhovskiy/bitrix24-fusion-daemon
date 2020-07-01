const log = require('app/init/logger')(module),
    request = require('urllib');

let showCallScreen = (bitrix24Info, cache, callback) => {

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

    let requestURL = bitrix24Info['url'] + "/telephony.externalcall.show?"
        + "USER_ID=" + bitrix24Info['userID']
        + "&CALL_ID=" + bitrix24Info['b24uuid'];
    
    request.request(requestURL, (err) => {
        if (err) {
            callback(err);
        }
    });
}

module.exports = showCallScreen;