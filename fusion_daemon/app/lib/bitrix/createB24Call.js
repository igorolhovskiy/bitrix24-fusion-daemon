
const request = require('urllib'),
log = require('app/init/logger')(module);

let createB24CallInfo = (callInfo, cache) => {

if (!callInfo['callUuid']) {
    return new Promise((resolve, reject) => {
        reject("createB24callInfo No UUID provided!");
    });
}

let b24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + "_" + callInfo['type']);
if (b24CallInfo) {
    log("Call is exists in cache, returning...");
    return b24CallInfo;
}

b24Callnfo = new Promise((resolve, reject) => {
    if (!callInfo['userID']) {
        reject("createB24callInfo No UserID provided!");
        return;
    }

    if (!callInfo['url']) {
        reject("createB24callInfo No Bitrix24 URL provided!");
        return;
    }

    if (!callInfo['callerid']) {
        reject("createB24callInfo No callerID provided!");
        return;
    }

    let requestURL = callInfo['url'] + "/telephony.externalcall.register.json?"
        + "USER_ID=" + callInfo['userID']
        + "&PHONE_NUMBER=" + callInfo['callerid']
        + "&TYPE=" + callInfo['type']
        + "&CRM_CREATE=1"
        + "&SHOW=0";

    request.request(requestURL, (err, data, res) => {

        if (err) {
            reject(err);
            return;
        }

        if (res.statusCode !== 200) {
            
            reject("createB24callInfo Server failed to answer with " + res.statusCode + " code");
            return;
        }

        let registeredCall = data.toString();

        try {
            registeredCall = JSON.parse(registeredCall);
        } catch (e) {
            reject("createB24callInfo Answer from server is not JSON");
            return;
        }

        if (typeof registeredCall.result === 'undefined') {
            reject("createB24callInfo Missing result section in answer");
            return;
        }

        registeredCall = registeredCall.result;

        if (!registeredCall['CALL_ID']) {
            
            reject("createB24callInfo Call ID is missing in answer");
            return;
        }

        resolve({
            uuid: registeredCall['CALL_ID'],
            type: callInfo['type'],
            user: callInfo['userID'],
            phone: callInfo['callerid']
        });
    });
});

cache.put('uuid_' + callInfo['callUuid'] + "_" + callInfo['type'], b24Callnfo, 3 * 60 * 60 * 1000); // Store for 3h

return b24Callnfo;
}

module.exports = createB24CallInfo;