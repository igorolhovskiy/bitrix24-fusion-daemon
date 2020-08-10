const log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    restConfig = require('app/config/rest');

if (bitrixConfig.url) {

    const freeswitch = require('app/init/freeswitch'),
        cache = require('memory-cache'),

        checkRequest = require('app/lib/checkRequest'),
        callRinging = require('app/lib/calls/progress'),
        callAnswer = require('app/lib/calls/bridge'),
        callCreate = require('app/lib/calls/create'),
        callHangup = require('app/lib/calls/hangup');

    // FreeSwitch listener part
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
        .on('esl::event::CHANNEL_HANGUP_COMPLETE::*', function(e) {
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

    // Click2Call server part
    if (restConfig.entryPoint) {

        const express = require('express'),
            restHTTPServer = express(),
            bodyParser = require('body-parser'),
            originateB24Call = require('app/lib/bitrix/originateB24Call');

        restHTTPServer.set('x-powered-by', false);
        restHTTPServer.use(bodyParser.urlencoded({ extended: true }));

        restHTTPServer.post('/rest/1/' + restConfig.entryPoint, (req, res) => {

            originateB24Call(req.body, cache, (err, data) => {
                if (err) {
                    log(err);
                    res.json({
                        status: '500',
                        message: err
                    });
                    return;
                }

                log('Originate result: ' + data);
                res.json({
                    status: '200',
                    message: data
                });
            });
        });

        restHTTPServer.all('/*', (req, res) => {
            res.json({
                status: '200',
                message: 'PONG'
            });
        });

        restHTTPServer.use(function(err, req, res, next) {
            log('restHTTPServer Error: ' + err);
            res.json({
                status: '500',
                message: err && err.message
            });
        });

        restHTTPServer.listen(restConfig.port, () => {
            log('Click2Call service listening on /rest/1/' + restConfig.entryPoint + ':' + restConfig.port);
        });
    }

    log('Bitrix24 - Freeswitch daemon started');
} else {
    log('Bitrix24 URL is not specified, exiting');
}