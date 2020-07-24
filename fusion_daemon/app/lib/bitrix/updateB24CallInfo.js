// Module to update userID of existing call

const log = require('app/init/logger')(module);

let updateB24CallInfo = (callInfo, cache) => {

    //log('Getting info for ' + callInfo['callUuid']);

    if (typeof callInfo['callUuid'] === 'undefined') {
        log("callUuid is not provided!");
        return;
    }

    let tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + '_1');
    if (tmpB24CallInfo) {
        log('Outbound (1) call ' + callInfo['callUuid'] + ' exists in cache, updating ' + tmpB24CallInfo['userID'] + ' -> ' + callInfo['userID']);
        tmpB24CallInfo['userID'] = callInfo['userID'];
        cache.put('uuid_' + callInfo['callUuid'] + '_1', tmpB24CallInfo);
    }

    tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + '_2');
    if (tmpB24CallInfo) {
        log('Inbound (2) call ' + callInfo['callUuid'] + ' exists in cache, updating ' + tmpB24CallInfo['userID'] + ' -> ' + callInfo['userID']);
        tmpB24CallInfo['userID'] = callInfo['userID'];
        cache.put('uuid_' + callInfo['callUuid'] + '_2', tmpB24CallInfo);
    }
}

module.exports = updateB24CallInfo;