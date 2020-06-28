const cache = require('memory-cache'),    
    express = require('express'),
    bodyParser = require('body-parser'),

    log = require('./init/logger')(module),

    freeswitch = require('./init/freeswitch'),
    checkRequest = require('./lib/checkRequest'),
    
    callRinging = require('./lib/calls/progress'),
    callAnswer = require('./lib/calls/bridge'),
    callCreate = require('./lib/calls/create'),
    callHangup = require('./lib/calls/hangup'),

    bitrixConfig = require('./config/bitrix'),
    fusionConfig = require('./config/fusion'),
    originateB24Call = require('./lib/bitrix/originateB24Call');


if (bitrixConfig.url) {

    freeswitch
        .on('esl::event::CHANNEL_PROGRESS::*', function(e) {
            let headers = checkRequest(e.headers);
            if (headers) {
                callRinging(headers, cache);
            }
        })
        .on('esl::event::CHANNEL_BRIDGE::*', function(e) {
            let headers = checkRequest(e.headers);
            if (headers) {
                callAnswer(headers, cache);
            }
        })
        .on('esl::event::CHANNEL_DESTROY::*', function(e) {
            let headers = checkRequest(e.headers);
            if (headers) {
                callHangup(headers, cache);
            }
        })
        .on('esl::event::CHANNEL_CREATE::*', function(e) {
            let headers = checkRequest(e.headers);
            if (headers) {
                callCreate(headers, cache);
            }
        });


    if (bitrixConfig.restEntryPoint) {
        // Click 2 Call entrypoint is declared
        const restHTTPServer = express();

        restHTTPServer.set('x-powered-by', false);
        restHTTPServer.use(bodyParser.urlencoded({ extended: true }));

        restHTTPServer.post('/rest/1/' + bitrixConfig.restEntryPoint, (req, res) => {

            originateB24Call(req.body, cache, (err, data) => {
                if (err) {
                    res.json({
                        status: "500",
                        message: err
                    });
                    return;
                }

                res.json({
                    status: "200",
                    message: data
                });
            });
        });

        restHTTPServer.all("/*", (req, res) => {
            res.json({
                status: "200",
                message: "PONG"
            });
        });

        restHTTPServer.use(function(err, req, res, next) {
            log("restHTTPServer Error: " + err);
            res.json({
                status: "500",
                message: err && err.message
            });
        });

        restHTTPServer.listen(bitrixConfig.restPort, () => {
            log("restHTTPServer service listening on /rest/1/" + bitrixConfig.restEntryPoint + ":" + bitrixConfig.restPort);
        });
    }

    log('Bitrix24 - Freeswitch daemon started');
} else {
    log('Bitrix24 URL is not specified, exiting');
}