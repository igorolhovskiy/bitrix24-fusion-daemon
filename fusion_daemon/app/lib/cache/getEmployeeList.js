const log = require('../../init/logger')(module),
    request = require('urllib');

function getEmployeeList(bitrixURL, cache, callback) {
    
    let employeeList = cache.get('employeeList');

    if (employeeList) {
        log("getEmployeeList Got data from cache!");
        callback(null, employeeList);
        return;
    }

    log("getEmployeeList Cache is empty, getting data from server...");

    let requestURL = bitrixURL + "/user.get.json?USER_TYPE=employee";

    request.request(requestURL, (err, data, res) => {

        if (err) {
            callback(err);
            return;
        }

        if (res.statusCode !== 200) {
            callback(true, "Server failed to answer with " + res.statusCode + " code");
        }

        let userList = data.toString();

        try {
            userList = JSON.parse(userList);
        } catch (e) {
            callback(true, "Answer from server is not JSON");
            return;
        }

        if (typeof userList.result === 'undefined') {
            callback(true, "Missing result section in answer");
            return;
        }

        userList = userList.result;

        employeeList = {};

        for (let user in userList) {

            if (typeof userList[user].UF_PHONE_INNER === 'undefined' || userList[user].UF_PHONE_INNER === null) {
                continue;
            }

            if (typeof userList[user].ID === 'undefined') {
                log("Strange, we have a user without ID: " + JSON.stringify(user));
                continue;
            }
            employeeList[userList[user].UF_PHONE_INNER] = userList[user].ID;
        }

        cache.put('employeeList', employeeList, 3600);

        callback(null, employeeList);
    });
}   

module.exports = getEmployeeList;