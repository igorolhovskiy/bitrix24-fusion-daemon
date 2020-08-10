const log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    request = require('urllib');

let commentB24Timeline = (contact24Info, cache, callback) => {

    if (!contact24Info['contactId'] || !contact24Info['message']) {
        log('Mandatofy info missing');
        log(contact24Info);
        return;
    }

    if (cache.get('timeline_' + contact24Info['contactId']) === contact24Info['message']) {
        return;
    }

    let requestURL = bitrixConfig.url + '/crm.timeline.comment.add';

    let requestOptions = {
        method: 'POST',
        data:  {
            fields: {
                ENTITY_ID: contact24Info['contactId'],
                ENTITY_TYPE: 'contact',
                COMMENT: contact24Info['message']
                }
        },
        contentType: 'json',
        fixJSONCtlChars: true,
        followRedirect: true,
        gzip: true,
        timeout: [2000, 3000]
    };

    log('Adding timelime message notification: <' + contact24Info['message'] + '> to contact ' + contact24Info['contactId']);
    
    cache.put('timeline_' + contact24Info['contactId'], contact24Info['message'], 10 * 1000); // 10 seconds to store

    request.request(requestURL, requestOptions, (err, data, res) => {
        if (err) {
            callback(err);
            return;
        }
        if (res['status'] !== 200) {
            callback(JSON.stringify(data.toString()));
            return;
        }
        callback(null);
    });

}

module.exports = commentB24Timeline;