
const request = require('urllib'),
    log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    fusionConfig = require('app/config/fusion');

let createB24CallInfo = (callInfo, cache) => {

    if (!callInfo['callUuid']) {
        return new Promise((resolve, reject) => {
            reject('createB24callInfo No UUID provided!');
            return;
        });
    }

    let b24CallInfo = cache.get('uuid_' + callInfo['callUuid'] + '_' + callInfo['type']);
    if (b24CallInfo) {
        log('Call exists in cache, returning...');
        return b24CallInfo;
    }

    let bitrix24Callnfo = new Promise((resolve, reject) => {
        if (!callInfo['userID']) {
            reject('createB24callInfo No UserID provided!');
            return;
        }

        if (!callInfo['callerid']) {
            reject('createB24callInfo No callerID provided!');
            return;
        }

        let crmCreate = bitrixConfig.createContact ? "1" : "0";

        if (bitrixConfig.createContact && !bitrixConfig.createLocalContact) {
            // Check if call is local.
            if (    callInfo['callerid']
                    && callInfo['calleeid']
                    && callInfo['callerid'].length <= fusionConfig.localNumberLength
                    && callInfo['calleeid'].length <= fusionConfig.localNumberLength) {

                crmCreate = '0';
                log('Not creating CRM entity as call ' + callInfo['callerid'] + ' -> ' + callInfo['calleeid'] + ' considered local');
            }
        }

        let requestURL = bitrixConfig.url + '/telephony.externalcall.register.json?'
            + 'USER_ID=' + callInfo['userID']
            + '&PHONE_NUMBER=' + callInfo['callerid']
            + '&TYPE=' + callInfo['type']
            + '&CRM_CREATE=' + crmCreate
            + '&SHOW=0';

        request.request(requestURL, (err, data, res) => {

            if (err) {
                reject(err);
                return;
            }

            if (res.statusCode !== 200) {
                reject('createB24callInfo Server failed to answer with ' + res.statusCode + ' code');
                return;
            }

            if (!Buffer.isBuffer(data)) {
                reject('createB24callInfo data is not Buffer!');
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
                reject('createB24callInfo Missing result section in answer');
                return;
            }

            registeredCall = registeredCall.result;

            if (!registeredCall.hasOwnProperty('CALL_ID')) {
                reject('createB24callInfo Call ID is missing in answer');
                return;
            }

            resolve({
                uuid: registeredCall['CALL_ID'],
                type: callInfo['type'],
                userID: callInfo['userID'],
                phone: callInfo['callerid']
            });
        });
    });

    cache.put('uuid_' + callInfo['callUuid'] + '_' + callInfo['type'], bitrix24Callnfo, 3 * 60 * 60 * 1000); // Store for 3h

    return bitrix24Callnfo;
}

module.exports = createB24CallInfo;