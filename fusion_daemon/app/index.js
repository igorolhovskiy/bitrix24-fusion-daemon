const cache = require('memory-cache'),    
    express = require('express'),

    log = require('./init/logger')(module),

    freeswitch = require('./init/freeswitch'),
    headersProcess = require('./init/fsheadersprocess'),
    
    callRinging = require('./lib/calls/progress'),
    callAnswer = require('./lib/calls/bridge'),
    callCreate = require('./lib/calls/create'),
    callHangup = require('./lib/calls/hangup'),

    bitrixConfig = require('./config/bitrix');

    

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
        callHangup(headers, cache);
    })
    .on('esl::event::CHANNEL_CREATE::*', function(e) {
        let headers = headersProcess(e.headers);
        if (typeof(headers['variable_bitrix24_url']) === 'undefined' || headers['variable_bitrix24_url'] === '') {
            return;
        }
        callCreate(headers, cache);
    });


if (bitrixConfig.entryPoint) {
    // Click 2 call entrypoint is declared
    const restEntryPoint = express();

    restEntryPoint.set('x-powered-by', false);

    restEntryPoint.post('/rest/1/' + bitrixConfig.entryPoint, (req, res) => {
        log("Got data on webEntryPoint " + JSON.stringify(req.query));
    
        res.json({
            status: "200",
            message: "Failsafe answer"
        });
    });

    restEntryPoint.use(function(err, req, res, next) {
        log("Error: " + req);
        res.json({
            status: "500",
            message: err && err.message
        });
    });

    restEntryPoint.listen(bitrixConfig.port, () => {
        log("REST service listening on /rest/1/" + bitrixConfig.entryPoint + ":" + bitrixConfig.port);
    });
}

log('VFusion daemon started');