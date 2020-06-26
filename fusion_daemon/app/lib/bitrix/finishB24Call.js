
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
            log("finishB24Call Server failed to answer with " + res.statusCode + " code");
            return;
        }
        log("Call registration finished with with " + data.toString());
    });
}

module.exports = finishB24Call;