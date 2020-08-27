
const request = require('urllib'),
    log = require('app/init/logger')(module),
    registerOrphanedCall = require('app/lib/bitrix/registerOrphanedCall'),
    fusionConfig = require('app/config/fusion'),
    bitrixConfig = require('app/config/bitrix');

let finishB24Call = (callInfo, cache) => {

    if (!callInfo['b24uuid']) {
        log('No Bitrix24 UUID provided!');
        return;
    }

    callInfo = cache.get('hangup_data_' + callInfo['b24uuid']) || callInfo;

    if (cache.get('finishedCall_' + callInfo['b24uuid']) === 'true') {
        log('Call ' + callInfo['b24uuid'] + ' is already finished on Bitrix, exiting');
        return;
    }

    log('Registering finished call ' + callInfo['b24uuid'] + ' to userID: ' + callInfo['userID']);

    cache.put('finishedCall_' +  callInfo['b24uuid'], 'true', 1500);

    let requestURL = bitrixConfig.url + '/telephony.externalcall.finish.json?'
        + 'CALL_ID=' + callInfo['b24uuid']
        + '&USER_ID=' + callInfo['userID']
        + '&DURATION=' + callInfo['duration']
        + '&STATUS_CODE=' + callInfo['sip_code']
        + '&ADD_TO_CHAT=0';

    if (bitrixConfig.appendRecording && callInfo['rec_file'] && fusionConfig.recordingPath) {

        let recordingPath = callInfo['rec_path'].replace(fusionConfig.localRecordingPath, '');
        recordingPath = fusionConfig.recordingPath + recordingPath + '/' + callInfo['rec_file'];

        requestURL = requestURL + '&RECORD_URL=' + recordingPath;
    }

    request.request(requestURL, (err, data, res) => {

        if (err) {
            log(err);
            return;
        }

        if (res.statusCode === 400) {
            log('Registering orphaned call');
            registerOrphanedCall(callInfo);
            return;
        }

        if (res.statusCode !== 200) {
            log('URL ' + requestURL + ' failed with ' + res.statusCode + ' code');
            return;
        }

        let finishCall = null;

        try {
            finishCall = JSON.parse(data.toString());
        } catch (e) {
            log('Answer from server is not JSON');
            return;
        }

        if (finishCall.result === undefined || !finishCall.result.hasOwnProperty('CALL_ID')) {
            log('Missing result section in answer');
            return;
        }

        if (finishCall.result['CALL_ID']) {
            log('Call ' + JSON.stringify(callInfo) + ' successfully registered');
            return;
        }

        log('Call registration failed with ' + JSON.stringify(finishCall, null, 2));
    });
}

module.exports = finishB24Call;