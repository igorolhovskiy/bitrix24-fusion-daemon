
const request = require('urllib'),
    log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    fusionConfig = require('app/config/fusion');

let getB24ContactInfo = (callInfo, cache) => {

    if (!callInfo['callerid'] || !callInfo['calleeid']) {
        return new Promise((resolve, reject) => {
            reject('No CallerID and CalleeID provided');
        });
    }

    // Get first callerID/calleeID with length > local
    let contactPhoneNum =  callInfo['callerid'].length > fusionConfig.localNumberLength ? callInfo['callerid'] : callInfo['calleeid'];

    if (contactPhoneNum.length <= fusionConfig.localNumberLength) {
        return new Promise((resolve, reject) => {
            reject('getB24ContactInfo is local. Not processing');
        });
    }


    let b24Contact = cache.get('contact_' + contactPhoneNum);
    if (b24Contact) {
        log('Contact exists in cache, returning...');
        return b24Contact;
    }

    let bitrix24ContactInfo = new Promise((resolve, reject) => {


        let requestURL = bitrixConfig.url + '/crm.contact.list.json';
        let requestOptions = {
            method: 'POST',
            data: {
                filter: {
                    PHONE: contactPhoneNum
                },
                order: {
                    DATE_MODIFY: 'DESC'
                },
                select: ['NAME', 'LAST_NAME', 'TYPE_ID', 'ASSIGNED_BY_ID']
            },
            contentType: 'json',
            dataType: 'json',
            fixJSONCtlChars: true,
            followRedirect: true,
            gzip: true,
            timeout: [2000, 3000]
        };


        request.request(requestURL, requestOptions, (err, data, res) => {

            if (err) {
                reject(err);
                return;
            }

            if (res.statusCode !== 200) {
                reject('getB24ContactInfo Server failed to answer with ' + res.statusCode + ' code');
                return;
            }

            if (data['total'] === 0 || !data['result'][0]) {
                reject('getB24ContactInfo No info on number ' + contactPhoneNum);
                return;
            }

            // Taking first appearance
            resolve(data['result'][0]);

        });
    });

    cache.put('contact_' + contactPhoneNum, bitrix24ContactInfo, 3 * 60 * 1000); // Store for 5 min

    return bitrix24ContactInfo;
}

module.exports = getB24ContactInfo;