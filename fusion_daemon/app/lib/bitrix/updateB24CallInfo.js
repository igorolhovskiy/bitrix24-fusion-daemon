// Module to update userID of existing call

const log = require('app/init/logger')(module);

let updateB24CallInfo = (callInfo, cache) => {

    //log('Getting info for ' + callInfo['callUuid']);

    if (typeof callInfo['callUuid'] === 'undefined') {
        return new Promise((resolve, reject) => {
            reject('getB24CallInfo No Call UUID provided!');
        });
    }

    let tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + '_1');
    if (tmpB24CallInfo) {
        log('Outbound call ' + callInfo['callUuid'] + ' is exists in cache, updating...');
        tmpB24CallInfo['userID'] = callInfo['userID'];
        cache.put('uuid_' + callInfo['callUuid'] + '_1', tmpB24CallInfo);
    }

    tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + '_2');
    if (tmpB24CallInfo) {
        log('Inbound call ' + callInfo['callUuid'] + ' is exists in cache, updating...');
        tmpB24CallInfo['userID'] = callInfo['userID'];
        cache.put('uuid_' + callInfo['callUuid'] + '_2', tmpB24CallInfo);
    }
}

module.exports = updateB24CallInfo;