// Module to update userID of existing call

const log = require('app/init/logger')(module);

let updateB24CallInfo = (callInfo, cache) => {

    //log('Getting info for ' + callInfo['callUuid']);

    if (callInfo === undefined || !callInfo.hasOwnProperty('callUuid')) {
        log('callUuid is not provided!');
        return;
    }

    let tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + '_1');

    if (tmpB24CallInfo) {
        tmpB24CallInfo
            .then(b24CallInfo => {
                log('Outbound (1) call ' + callInfo['callUuid'] + ' exists in cache, updating ' + b24CallInfo['userID'] + ' -> ' + callInfo['userID']);
                b24CallInfo['userID'] = callInfo['userID'];
                let updatedB24CallInfo = new Promise((resolve, reject) => {
                    resolve(b24CallInfo);
                });
                cache.put('uuid_' + callInfo['callUuid'] + '_1', updatedB24CallInfo);
            })
            .catch(err => {
                let updatedB24CallInfo = new Promise((resolve, reject) => {
                    reject(err);
                });
                cache.put('uuid_' + callInfo['callUuid'] + '_1', updatedB24CallInfo);
            });
    }

    tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + '_2');

    if (tmpB24CallInfo) {
        tmpB24CallInfo
            .then(b24CallInfo => {
                log('Inbound (2) call ' + callInfo['callUuid'] + ' exists in cache, updating ' + b24CallInfo['userID'] + ' -> ' + callInfo['userID']);
                b24CallInfo['userID'] = callInfo['userID'];
                let updatedB24CallInfo = new Promise((resolve, reject) => {
                    resolve(b24CallInfo);
                });
                cache.put('uuid_' + callInfo['callUuid'] + '_2', updatedB24CallInfo);
            })
            .catch(err => {
                let updatedB24CallInfo = new Promise((resolve, reject) => {
                    reject(err);
                });
                cache.put('uuid_' + callInfo['callUuid'] + '_2', updatedB24CallInfo);
            });
    }
}

module.exports = updateB24CallInfo;