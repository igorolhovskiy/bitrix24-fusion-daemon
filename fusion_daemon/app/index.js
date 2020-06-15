const freeswitch = require('./init/freeswitch'),
    headersProcess = require('./init/fsheadersprocess'),
    log = require('./init/logger')(module),
    callRinging = require('./lib/calls/progress'),
    callAnswer = require('./lib/calls/bridge');
    //callHangup = require('./lib/hangup');

freeswitch
    .on('esl::event::CHANNEL_PROGRESS::*', function(e) {
        let headers = headersProcess(e.headers);
        if (typeof(headers['variable_bitrix24_url']) === 'undefined') {
            return;
        }
        callRinging(headers);
    })
    .on('esl::event::CHANNEL_BRIDGE::*', function(e) {
        let headers = headersProcess(e.headers);
        if (typeof(headers['variable_bitrix24_url']) === 'undefined') {
            return;
        }
        callAnswer(headers);
    })
    .on('esl::event::CHANNEL_DESTROY::*', function(e) {
        let headers = headersProcess(e.headers);
        if (typeof(headers['variable_bitrix24_url']) === 'undefined') {
            return;
        }
        //log("CHANNEL_DESTROY " + JSON.stringify(headers));
        //callHangup(headers);
    });

log('VFusion daemon started');

const cache = require('./lib/cache/userlist');

cache('XXXXX', (err, res) => {
    if (err) {
        log(err);
        return;
    }
    log(res);
});