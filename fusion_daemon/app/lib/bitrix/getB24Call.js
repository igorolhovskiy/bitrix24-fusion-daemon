
const log = require('../../init/logger')(module);

let getB24CallInfo = (callInfo, cache) => {

    log("Getting info for " + callInfo['callUuid']);

    if (typeof callInfo['callUuid'] === "undefined") {
        return new Promise((resolve, reject) => {
            reject("getB24CallInfo No Call UUID provided!");
        });
    }

    let b24CallInfo = [];

    let tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + "_1");
    if (tmpB24CallInfo) {
        log("Outbound call is exists in cache, adding...");
        b24CallInfo.push(tmpB24CallInfo);
    }

    tmpB24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + "_2");
    if (tmpB24CallInfo) {
        log("Inbound call is exists in cache, adding...");
        b24CallInfo.push(tmpB24CallInfo);
    }

    if (b24CallInfo.length === 0) {
        b24CallInfo.push(new Promise((resolve, reject) => {
            reject("getB24CallInfo No Bitrix info for call " + callInfo['callUuid']);
        }));
    }

    return b24CallInfo;
}

module.exports = getB24CallInfo;