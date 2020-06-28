// {
//     "event":"ONEXTERNALCALLSTART",
//     "data":{
//        "PHONE_NUMBER":"7863342521",
//        "PHONE_NUMBER_INTERNATIONAL":"+17863342521",
//        "EXTENSION":"",
//        "USER_ID":"1",
//        "CALL_LIST_ID":"0",
//        "LINE_NUMBER":"",
//        "IS_MOBILE":"0",
//        "CALL_ID":"externalCall.c81598a17f0ba1ee72c2565c2df9a830.1593271292",
//        "CRM_ENTITY_TYPE":"CONTACT",
//        "CRM_ENTITY_ID":"142"
    
//  },
//     "ts":"1593271628",
//     "auth":{
//        "domain":"crm.305plasticsurgery.com",
//        "client_endpoint":"https://crm.305plasticsurgery.com/rest/",
//        "server_endpoint":"https://oauth.bitrix.info/rest/",
//        "member_id":"959278128ab5e919e0ff8b9c66a553e3",
//        "application_token":"25kyj43oj9186r7lt1bcjhbakz9rlr8b"
    
//  }
//  }

const log = require('../../init/logger')(module),
    bitrixConfig = require('../../config/bitrix'),
    getB24EmployeeList = require('./getB24EmployeeList');

let originateB24Call = (requestBody, cache, freeswitch, callback) => {

    if (!requestBody.domain) {
        callback("originateB24Call Domain is not specified", null);
        return;
    }

    if (requestBody.event !== "ONEXTERNALCALLSTART") {
        callback("originateB24Call Request event is not ONEXTERNALCALLSTART", null);
        log(JSON.stringify(requestBody));
        return;
    }

    if (requestBody.auth.domain !== bitrixConfig.restRequestDomain) {
        callback("originateB24Call Domain is not authorized", null);
        return;
    }

    if (requestBody.auth.application_token !== bitrixConfig.restToken) {
        callback("originateB24Call Auth token is invalid", null);
        return;
    }

    // Get user extension
    let userID = requestBody.data['USER_ID'];

    if (!userID) {
        callback("originateB24Call USER_ID is missing", null);
        return;
    }

    getB24EmployeeList(bitrixConfig.url, cache, (err, res) => {
        if (err) {
            callback(err);
            return;
        }

        let employeeList = res['id_to_phone'];

        if (!employeeList[userID]) {}
    });
}

module.exports = originateB24Call;