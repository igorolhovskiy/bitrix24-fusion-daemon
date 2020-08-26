
const log = require('app/init/logger')(module);

let getB24CallInfo = (callInfo, cache) => {

    if (callInfo === undefined || !callInfo.hasOwnProperty('callUuid')) {
        return new Promise((resolve, reject) => {
            reject('getB24CallInfo No Call UUID provided!');
        });
    }

    let b24CallInfo = [];

    let tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + '_1');
    if (tmpB24CallInfo) {
        log('Outbound (1) call ' + callInfo['callUuid'] + ' call exists in cache adding...');
        b24CallInfo.push(tmpB24CallInfo);
    }

    tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + '_2');
    if (tmpB24CallInfo) {
        log('Inbound (2) ' + callInfo['callUuid'] + ' call exists in cache adding...');
        b24CallInfo.push(tmpB24CallInfo);
    }

    if (b24CallInfo.length === 0) {
        b24CallInfo.push(new Promise((resolve, reject) => {
            reject('getB24CallInfo No Bitrix info for call ' + callInfo['callUuid']);
        }));
    }

    return b24CallInfo;
}

module.exports = getB24CallInfo;