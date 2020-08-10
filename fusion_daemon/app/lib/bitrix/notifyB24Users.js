const log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    request = require('urllib');

let notifyB24Users = (bitrix24Info, cache, callback) => {

    // Get all showCallScreens from cache

    let usersWatchingScreen = cache.get('callsubscription_' + bitrix24Info['b24uuid']);

    if (!usersWatchingScreen) {
        log('No users are watching this call, skipping...');
        callback(null);
        return;
    }

    if (!bitrix24Info['message']) {
        callback('notifyB24Users no message is specified!');
        return;
    }

    try {
        usersWatchingScreen = JSON.parse(usersWatchingScreen);
    } catch (e) {
        callback(e);
        return;
    }

    usersWatchingScreen.forEach((user) => {
        let requestURL = bitrixConfig.url + '/im.notify.json?'
            + 'to=' + user
            + '&message=' + bitrix24Info['message']
            + '&type=SYSTEM'

        let currentTS = Math.floor(Date.now() / 1000);

        if (cache.get('notify_' + currentTS) === requestURL) {
            return;
        }

        log('Showing notification: <' + bitrix24Info['message'] + '> to user ' + user);
        
        cache.put('notify_' + currentTS, requestURL, 2 * 1000); // 2 sec for overlap

        request.request(requestURL, (err) => {
            if (err) {
                callback(err);
            }
        });
    });

    callback(null);
}

module.exports = notifyB24Users;