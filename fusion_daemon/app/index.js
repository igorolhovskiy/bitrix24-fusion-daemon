const freeswitch = require('./init/freeswitch'),
    headersProcess = require('./init/fsheadersprocess'),
    log = require('./init/logger')(module),
    cache = require('memory-cache'),
    callRinging = require('./lib/calls/progress'),
    callAnswer = require('./lib/calls/bridge');
    //callHangup = require('./lib/hangup');

const request = require('urllib');

freeswitch
    .on('esl::event::CHANNEL_PROGRESS::*', function(e) {
        let headers = headersProcess(e.headers);
        if (typeof(headers['variable_bitrix24_url']) === 'undefined' || headers['variable_bitrix24_url'] === '') {
            return;
        }
        callRinging(headers, cache);
    })
    .on('esl::event::CHANNEL_BRIDGE::*', function(e) {
        let headers = headersProcess(e.headers);
        if (typeof(headers['variable_bitrix24_url']) === 'undefined' || headers['variable_bitrix24_url'] === '') {
            return;
        }
        callAnswer(headers, cache);
    })
    .on('esl::event::CHANNEL_DESTROY::*', function(e) {
        let headers = headersProcess(e.headers);
        if (typeof(headers['variable_bitrix24_url']) === 'undefined' || headers['variable_bitrix24_url'] === '') {
            return;
        }
        //log("CHANNEL_DESTROY " + JSON.stringify(headers));
        //callHangup(headers);
    });

log('VFusion daemon started');