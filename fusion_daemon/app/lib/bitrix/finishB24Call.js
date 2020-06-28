
const request = require('urllib'),
    log = require('../../init/logger')(module);

let finishB24Call = (callInfo, cache) => {

    if (!callInfo['b24uuid']) {
        log("No Bitrix24 UUID provided!");
        return;
    }

    cache.del("uuid_" + callInfo['callUuid'] + "_1");
    cache.del("uuid_" + callInfo['callUuid'] + "_2");

    let requestURL = callInfo['url'] + "/telephony.externalcall.finish.json?";
        requestURL += "CALL_ID=" + callInfo['b24uuid'];
        requestURL += "&USER_ID=" + callInfo['userID'];
        requestURL += "&DURATION=" + callInfo['duration'];
        requestURL += "&STATUS_CODE=" + callInfo['sip_code'];
        requestURL += "&ADD_TO_CHAT=0";

    request.request(requestURL, (err, data, res) => {

        if (err) {
            log(err);
            return;
        }

        if (res.statusCode !== 200) {
            log("Server failed to answer with " + res.statusCode + " code");
            return;
        }

        let finishCall = null;

        try {
            finishCall = JSON.parse(data.toString());
        } catch (e) {
            log("Answer from server is not JSON");
            return;
        }

        if (typeof finishCall.result === 'undefined') {
            log("Missing result section in answer");
            return;
        }

        if (finishCall.result['CALL_ID']) {
            log('Call ' + finishCall.result['CALL_ID'] + ' successfully registered');
            return;
        }

        log("Call registration failed with " + JSON.stringify(finishCall, null, 2));
    });
}

module.exports = finishB24Call;