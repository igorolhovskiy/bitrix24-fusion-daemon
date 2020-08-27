const request = require('urllib'),
    log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    fusionConfig = require('app/config/fusion');

let registerOrphanedCall = (callInfo) => {

    if (!callInfo
        || !callInfo['userID']
        || !callInfo['callerid']
        || !callInfo['type']) {
            log("Mandatory data missing: " + JSON.stringify(callInfo));
            return;
        }

    let requestURL = bitrixConfig.url + '/telephony.externalcall.register.json?'
        + 'USER_ID=' + callInfo['userID']
        + '&PHONE_NUMBER=' + callInfo['callerid']
        + '&TYPE=' + callInfo['type']
        + '&CRM_CREATE=0'
        + '&SHOW=0';

    request.request(requestURL, (err, data, res) => {

        if (err) {
            log(err);
            return;
        }

        if (res.statusCode !== 200) {
            log('Server failed to answer with ' + res.statusCode + ' code');
            return;
        }

        if (!Buffer.isBuffer(data)) {
            log('data is not Buffer!');
            return;
        }

        let registeredCall = data.toString();

        try {
            registeredCall = JSON.parse(registeredCall);
        } catch (e) {
            reject(e);
            return;
        }

        if (!registeredCall || !registeredCall.hasOwnProperty('result')) {
            log('Missing result section in answer');
            return;
        }

        registeredCall = registeredCall.result;

        if (!registeredCall.hasOwnProperty('CALL_ID')) {
            log('Call ID is missing in answer');
            return;
        }

        // Wait before register call
        setTimeout(() => {

            requestURL = bitrixConfig.url + '/telephony.externalcall.finish.json?'
                + 'CALL_ID=' + registeredCall['CALL_ID']
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
        }, 1500);
    });
}

module.exports = registerOrphanedCall;