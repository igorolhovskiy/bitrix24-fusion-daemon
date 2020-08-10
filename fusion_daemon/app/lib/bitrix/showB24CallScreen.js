const log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    request = require('urllib');

let showB24CallScreen = (bitrix24Info, cache, callback) => {

    // Save all showCallScreens to database

    let usersWatchingScreen = cache.get('callsubscription_' + bitrix24Info['b24uuid'])
    try {
        if (!usersWatchingScreen) {
            log('Init showCallScreen cache callsubscription_' + bitrix24Info['b24uuid']);
            usersWatchingScreen = [bitrix24Info['userID']];
        } else {
            log('Using existing showCallScreen cache callsubscription_' + bitrix24Info['b24uuid']);
            usersWatchingScreen = JSON.parse(usersWatchingScreen);
            usersWatchingScreen.push(bitrix24Info['userID']);
        }
        cache.put('callsubscription_' + bitrix24Info['b24uuid'], JSON.stringify(usersWatchingScreen), 3 * 60 * 60 * 1000); // Store for 3h
    } catch (e) {
        callback(e);
        return;
    }

    let requestURL = bitrixConfig.url + '/telephony.externalcall.show?'
        + 'USER_ID=' + bitrix24Info['userID']
        + '&CALL_ID=' + bitrix24Info['b24uuid'];
    
    request.request(requestURL, (err) => {
        if (err) {
            callback(err);
        }
    });
}

module.exports = showB24CallScreen;