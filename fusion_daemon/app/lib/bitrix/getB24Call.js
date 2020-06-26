
const log = require('../../init/logger')(module);

let getB24CallInfo = (callInfo, cache) => {

    log("getB24CallInfo Getting info for " + callInfo['callUuid']);

    if (typeof callInfo['callUuid'] === "undefined") {
        return new Promise((resolve, reject) => {
            reject("getB24CallInfo No Call UUID provided!");
        });
    }

    let b24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + "_1");
    if (b24CallInfo) {
        log("getB24CallInfo Outbound call is exists in cache, returning...");
        return b24CallInfo;
    }

    b24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + "_2");
    if (b24CallInfo) {
        log("getB24CallInfo Inbound call is exists in cache, returning...");
        return b24CallInfo;
    }

    return new Promise((resolve, reject) => {
        reject("getB24CallInfo No Bitrix info for this call");
    });
}

module.exports = getB24CallInfo;