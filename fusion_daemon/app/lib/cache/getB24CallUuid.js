
const request = require('urllib'),
    log = require('../../init/logger')(module);

let getB24callUuid = (callInfo, cache) => {

    if (!callInfo['callUuid']) {
        return new Promise((resolve, reject) => {
            reject("No UUID provided!");
        });
    }

    let b24callUuid = cache.get('uuid_' + callInfo['callUuid']);
    if (b24callUuid) {
        log("This getB24callUuid is exists in cache, returning...");
        return b24callUuid;
    }

    log("getB24callUuid Getting info for uuid " + callInfo['callUuid']);

    b24callUuid = new Promise((resolve, reject) => {
        if (!callInfo['userID']) {
            reject("getB24callUuid No UserID provided!");
            return;
        }
        if (!callInfo['url']) {
            reject("getB24callUuid No Bitrix24 URL provided!");
            return;
        }
        if (!callInfo['callerid']) {
            reject("getB24callUuid No callerID provided!");
            return;
        }

        let requestURL = callInfo['url'] + "/telephony.externalcall.register.json?";
            requestURL += "USER_ID=" + callInfo['userID'];
            requestURL += "&PHONE_NUMBER=" + callInfo['callerid'];
            requestURL += "&TYPE=2";
            requestURL += "&CRM_CREATE=1";
            requestURL += "&SHOW=0";

        request.request(requestURL, (err, data, res) => {

            if (err) {
                reject(err);
                return;
            }

            if (res.statusCode !== 200) {
                reject("Server failed to answer with " + res.statusCode + " code");
            }

            let registeredCall = data.toString();

            try {
                registeredCall = JSON.parse(registeredCall);
            } catch (e) {
                reject("getB24callUuid Answer from server is not JSON");
                return;
            }

            if (typeof registeredCall.result === 'undefined') {
                reject("getB24callUuid Missing result section in answer");
                return;
            }

            registeredCall = registeredCall.result;

            if (!registeredCall['CALL_ID']) {
                reject("getB24callUuid Call ID is missing in answer");
                return;
            }
            resolve(registeredCall['CALL_ID']);
        });
    });

    cache.put('uuid_' + callInfo['callUuid'], b24callUuid, 3 * 60 * 60 * 1000); // Store for 3h

    return b24callUuid;
}

module.exports = getB24callUuid;