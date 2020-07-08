const cache = require('memory-cache'),    
    express = require('express'),
    bodyParser = require('body-parser'),

    log = require('app/init/logger')(module),

    freeswitch = require('app/init/freeswitch'),
    checkRequest = require('app/lib/checkRequest'),
    
    callRinging = require('app/lib/calls/progress'),
    callAnswer = require('app/lib/calls/bridge'),
    callCreate = require('app/lib/calls/create'),
    callHangup = require('app/lib/calls/hangup'),

    bitrixConfig = require('app/config/bitrix'),
    restConfig = require('app/config/rest'),
    originateB24Call = require('app/lib/bitrix/originateB24Call');


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


    if (restConfig.entryPoint) {
        // Click 2 Call entrypoint is declared
        const restHTTPServer = express();

        restHTTPServer.set('x-powered-by', false);
        restHTTPServer.use(bodyParser.urlencoded({ extended: true }));

        restHTTPServer.post('/rest/1/' + restConfig.entryPoint, (req, res) => {

            originateB24Call(req.body, cache, (err, data) => {
                if (err) {
                    log(err);
                    res.json({
                        status: "500",
                        message: err
                    });
                    return;
                }

                log("Originate result: " + data);
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

        restHTTPServer.listen(restConfig.port, () => {
            log("restHTTPServer service listening on /rest/1/" + restConfig.entryPoint + ":" + restConfig.port);
        });
    }

    log('Bitrix24 - Freeswitch daemon started');
} else {
    log('Bitrix24 URL is not specified, exiting');
}