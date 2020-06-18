
const request = require('urllib');

let getB24callUuid = (callInfo, cache) => {

    if (!callInfo['callUuid']) {
        return new Promise((resolve, reject) => {
            reject("No UUID provided!");
        });
    }

    let b24callUuid = cache.get('uuid_' + callInfo['callUuid']);
    if (b24callUuid) {
        return b24callUuid;
    }

    b24callUuid = new Promise((resolve, reject) => {
        if (!callInfo['userID']) {
            reject("No UserID provided!");
            return;
        }
        if (!callInfo['url']) {
            reject("No Bitrix24 URL provided!");
            return;
        }
        if (!callInfo['callerid']) {
            reject("No callerID provided!");
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
                reject("Answer from server is not JSON");
                return;
            }
    
            if (typeof registeredCall.result === 'undefined') {
                reject("Missing result section in answer");
                return;
            }
    
            registeredCall = registeredCall.result;

            if (!registeredCall['CALL_ID']) {
                reject("Call ID is missing in answer");
                return;
            }

            resolve(registeredCall['CALL_ID']);
        });
    });
    
    cache.put('uuid_' + callInfo['uuid'], b24callUuid, 10800); // Store for 3h
    
    return b24callUuid;
}

module.exports = getB24callUuid;