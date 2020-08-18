const log = require('app/init/logger')(module),
    fusionConfig = require('app/config/fusion'),
    restConfig = require('app/config/rest'),
    getB24EmployeeList = require('app/lib/bitrix/getB24EmployeeList'),
    freeswitchOriginate = require('app/lib/calls/originate');

let originateB24Call = (requestBody, cache, callback) => {

    if (requestBody.event !== 'ONEXTERNALCALLSTART') {
        callback('originateB24Call Request event is not ONEXTERNALCALLSTART', null);
        log(JSON.stringify(requestBody));
        return;
    }

    if (requestBody.auth.domain !== restConfig.requestDomain) {
        log('originateB24Call Domain ' + requestBody.auth.domain + ' is not authorized');
    //    return;
    }

    if (requestBody.auth.application_token !== restConfig.token) {
        callback('originateB24Call Auth token ' + requestBody.auth.application_token + ' is invalid');
        return;
    }

    if (!fusionConfig.domain) {
        callback('originateB24Call Fusion domain name is not specified');
        return;
    }

    // Get user extension
    let userID = requestBody.data['USER_ID'];

    if (!userID) {
        callback('originateB24Call USER_ID is missing');
        return;
    }

    getB24EmployeeList(cache)
        .then(res => {
            let employeeList = res['IdToPhone'];

            if (!employeeList[userID]) {
                callback('originateB24Call user ' + userID + ' does not have extension');
                return;
            }

            let caller = employeeList[userID];
            let callee =requestBody.data['PHONE_NUMBER'] || requestBody.data['PHONE_NUMBER_INTERNATIONAL'];

            log('Making a call ' + caller + '@' + fusionConfig.domain + ' -> ' + callee);

            let originateInfo = {
                src: caller,
                domain: fusionConfig.domain,
                dst: callee,
                timeout: '25',
                autoAnswer: true,
            }

            freeswitchOriginate(originateInfo, (err, res) => {
                if (err) {
                    callback('originateB24Call ' + err);
                    return;
                }
                callback('originateB24Call ' + res);
            });
        })
        .catch(err => callback(err));
}

module.exports = originateB24Call;