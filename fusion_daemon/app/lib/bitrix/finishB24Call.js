
const request = require('urllib'),
    log = require('app/init/logger')(module),
    fusionConfig = require('app/config/fusion'),
    bitrixConfig = require('app/config/bitrix');

let finishB24Call = (callInfo, cache) => {

    if (!callInfo['b24uuid']) {
        log('No Bitrix24 UUID provided!');
        return;
    }

    if (cache.get('finishedCall_' + callInfo['b24uuid']) === 'true') {
        log('Call ' + callInfo['b24uuid'] + ' is already finished on Bitrix, exiting');
        return;
    }

    log('Registering finished call ' + callInfo['b24uuid'] + ' to userID: ' + callInfo['userID']);

    cache.put('finishedCall_' +  callInfo['b24uuid'], 'true', 3 * 60 * 60 * 1000);

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

        if (res.statusCode !== 200) {
            log('Server failed to answer with ' + res.statusCode + ' code');
            log(requestURL + ' -> ' + data.toString());
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