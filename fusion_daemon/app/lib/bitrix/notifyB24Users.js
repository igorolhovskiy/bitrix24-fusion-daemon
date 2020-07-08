const log = require('app/init/logger')(module),
    request = require('urllib');

let notifyB24Users = (bitrix24Info, cache ,callback) => {

    // Get all showCallScreens from cache

    let usersWatchingScreen = cache.get('callsubscription_' + bitrix24Info['b24uuid']);

    if (!usersWatchingScreen) {
        log('No users are watching this call, skipping...');
        callback(null);
        return;
    }

    if (!bitrix24Info['message']) {
        callback("notifyB24Users no message is specified!");
        return;
    }

    try {
        usersWatchingScreen = JSON.parse(usersWatchingScreen);
    } catch (e) {
        callback(e);
        return;
    }

    usersWatchingScreen.forEach((user) => {
        let requestURL = bitrix24Info['url'] + "/im.notify.json?"
            + "to=" + user
            + "&message=" + message
            + "&type=SYSTEM"
        
        request.request(requestURL, (err) => {
            if (err) {
                callback(err);
            }
        });
    });

    callback(null);
}

module.exports = notifyB24Users;