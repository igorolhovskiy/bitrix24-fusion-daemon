const log = require('../../init/logger')(module),
    request = require('urllib');

function getB24EmployeeList(bitrixURL, cache, callback) {
    
    let employeeList = cache.get('employeeList');

    if (employeeList) {
        log("Got data from cache!");
        callback(null, employeeList);
        return;
    }

    log("Cache is empty, getting data from server...");

    let requestURL = bitrixURL + "/user.get.json?USER_TYPE=employee";

    request.request(requestURL, (err, data, res) => {

        if (err) {
            callback(err);
            return;
        }

        if (res.statusCode !== 200) {
            callback(true, "getB24EmployeeList Server failed to answer with " + res.statusCode + " code");
        }

        let userList = data.toString();

        try {
            userList = JSON.parse(userList);
        } catch (e) {
            callback(true, "getB24EmployeeList Answer from server is not JSON");
            return;
        }

        if (typeof userList.result === 'undefined') {
            callback(true, "getB24EmployeeList Missing result section in answer");
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

        log("Saving employeeList to cache");
        cache.put('employeeList', employeeList, 60 * 60 * 1000); // Store for 1h

        callback(null, employeeList);
    });
}   

module.exports = getB24EmployeeList;