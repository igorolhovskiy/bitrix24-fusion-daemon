
const request = require('urllib'),
log = require('app/init/logger')(module),
fusionConfig = require('app/config/fusion'),
bitrix24Config = require('app/config/bitrix');

let finishB24Call = (callInfo, cache) => {

if (!callInfo['b24uuid']) {
    log("No Bitrix24 UUID provided!");
    return;
}

cache.del("uuid_" + callInfo['callUuid'] + "_1");
cache.del("uuid_" + callInfo['callUuid'] + "_2");

let requestURL = callInfo['url'] + "/telephony.externalcall.finish.json?"
    + "CALL_ID=" + callInfo['b24uuid']
    + "&USER_ID=" + callInfo['userID']
    + "&DURATION=" + callInfo['duration']
    + "&STATUS_CODE=" + callInfo['sip_code']
    + "&ADD_TO_CHAT=0";

if (bitrix24Config.appendRecording && callInfo['rec_file'] && fusionConfig.recordingPath) {

    let recordingPath = callInfo['rec_path'].replace(fusionConfig.localRecordingPath, '');
    recordingPath = fusionConfig.recordingPath + recordingPath + "/" + callInfo['rec_file'];

    requestURL = requestURL + "&RECORD_URL=" + recordingPath;
}

request.request(requestURL, (err, data, res) => {

    if (err) {
        log(err);
        return;
    }

    if (res.statusCode !== 200) {
        log("Server failed to answer with " + res.statusCode + " code");
        log(requestURL + " -> " + data.toString());
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