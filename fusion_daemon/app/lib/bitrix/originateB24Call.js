const log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    fusionConfig = require('app/config/fusion'),
    getB24EmployeeList = require('app/lib/bitrix/getB24EmployeeList'),
    request = require('urllib');

let originateB24Call = (requestBody, cache, callback) => {

    if (requestBody.event !== "ONEXTERNALCALLSTART") {
        callback("originateB24Call Request event is not ONEXTERNALCALLSTART", null);
        log(JSON.stringify(requestBody));
        return;
    }

    if (requestBody.auth.domain !== bitrixConfig.restRequestDomain) {
        callback("originateB24Call Domain " + requestBody.auth.domain + " is not authorized");
        return;
    }

    if (requestBody.auth.application_token !== bitrixConfig.restToken) {
        callback("originateB24Call Auth token " + requestBody.auth.application_token + " is invalid");
        return;
    }

    if (!fusionConfig.apiKey) {
        callback("originateB24Call Fusion API key is not specified");
        return;
    }

    if (!fusionConfig.domain) {
        callback("originateB24Call Fusion domain name is not specified");
        return;
    }

    // Get user extension
    let userID = requestBody.data['USER_ID'];

    if (!userID) {
        callback("originateB24Call USER_ID is missing");
        return;
    }

    getB24EmployeeList(bitrixConfig.url, cache, (err, res) => {
        if (err) {
            callback("originateB24Call" + err);
            return;
        }

        let employeeList = res['id_to_phone'];

        if (!employeeList[userID]) {
            callback("originateB24Call user " + userID + " does not have extension");
            return;
        }

        let caller = employeeList[userID];
        let callee =requestBody.data['PHONE_NUMBER'] || requestBody.data['PHONE_NUMBER_INTERNATIONAL'];

        let requestURL = fusionConfig.transport 
                + "://" + fusionConfig.domain 
                + fusionConfig.c2cPath + "?"
                + "key=" + fusionConfig.apiKey
                + "&src=" +  caller
                + "&dest=" + callee;
        
        let requestOptions = {
            'method' : 'POST',
            'followRedirect' : true,
            'timeout' : [30000, 30000],
        }

        log("Making a call " + caller + "@" + fusionConfig.domain + " -> " + callee);
        request.request(requestURL, requestOptions, (err, data, res) => {
            if (err) {
                callback("originateB24Call " + err);
                return;
            }
            if (res.statusCode !== 200) {
                callback("originateB24Call Fusion failed to answer with " + res.statusCode + " code");
                return;
            }
            callback(null, "originateB24Call " + data.toString());
        });
    });
}

module.exports = originateB24Call;