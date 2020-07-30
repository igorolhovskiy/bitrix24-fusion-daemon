const log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    request = require('urllib');
    
// Returning format - Promise
// [{extension_1: userid_1}, {extension_2: userid_2}, ... , {extension_n: userid_n}]
//

function getB24EmployeeList(cache) {

    if (typeof cache === 'undefined') {
        return new Promise((resolve, reject) => {
            reject("getB24EmployeeList: Cache is undefined!");
        });
    }

    let employeeList = cache.get('employeeList');
    
    if (employeeList) {
        return employeeList;
    }

    employeeList = new Promise((resolve, reject) => {

        log("Cache is empty, getting data from server...");

        let requestURL = bitrixConfig.url + "/user.get.json?"
            + "USER_TYPE=employee";

        request.request(requestURL, (err, data, res) => {

            if (err) {
                reject(err);
                return;
            }

            if (res.statusCode !== 200) {
                reject("getB24EmployeeList Server failed to answer with " + res.statusCode + " code");
            }

            let userList = data.toString();

            try {
                userList = JSON.parse(userList);
            } catch (e) {
                reject("getB24EmployeeList Answer from server is not JSON");
                return;
            }

            if (typeof userList.result === 'undefined') {
                reject("getB24EmployeeList Missing result section in answer");
                return;
            }

            userList = userList.result;

            let employeeListResult = {
                'phone_to_id': {},
                'id_to_phone' : {}
            };

            for (let user in userList) {

                if (typeof userList[user].UF_PHONE_INNER === 'undefined' || userList[user].UF_PHONE_INNER === null) {
                    continue;
                }

                if (typeof userList[user].ID === 'undefined') {
                    log("Strange, we have a user without ID: " + JSON.stringify(user));
                    continue;
                }
                employeeListResult['phone_to_id'][userList[user].UF_PHONE_INNER] = userList[user].ID;
                employeeListResult['id_to_phone'][userList[user].ID] = userList[user].UF_PHONE_INNER;
            }

            //log("Saving employeeList to cache");
            //cache.put('employeeList', employeeList, 1000); // Store for 1 sec

            resolve(employeeListResult);
        });
    });

    cache.put('employeeList', employeeList, 10 * 60 * 1000); // Store for 10 min

    return employeeList;
}   

module.exports = getB24EmployeeList;