const freeswitch = require('./init/freeswitch'),
    headersProcess = require('./init/fsheadersprocess'),
    log = require('./init/logger')(module),
    cache = require('memory-cache'),
    callRinging = require('./lib/calls/progress'),
    callAnswer = require('./lib/calls/bridge'),
    callCreate = require('./lib/calls/create');
    //callHangup = require('./lib/hangup');

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
        //log("CHANNEL_BRIDGE " + JSON.stringify(headers, null, 2));
        callAnswer(headers, cache);
    })
    .on('esl::event::CHANNEL_DESTROY::*', function(e) {
        let headers = headersProcess(e.headers);
        if (typeof(headers['variable_bitrix24_url']) === 'undefined' || headers['variable_bitrix24_url'] === '') {
            return;
        }
        //callHangup(headers);
    })
    .on('esl::event::CHANNEL_CREATE::*', function(e) {
        let headers = headersProcess(e.headers);
        if (typeof(headers['variable_bitrix24_url']) === 'undefined' || headers['variable_bitrix24_url'] === '') {
            return;
        }
        //log("CHANNEL_CREATE " + JSON.stringify(headers, null, 2));
        callCreate(headers, cache);
    });

log('VFusion daemon started');