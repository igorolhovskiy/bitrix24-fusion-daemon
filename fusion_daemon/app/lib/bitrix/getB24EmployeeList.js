const log = require('app/init/logger')(module),
    request = require('urllib');


// Returning format
// [{extension_1: userid_1}, {extension_2: userid_2}, ... , {extension_n: userid_n}]
//

function getB24EmployeeList(bitrixURL, cache) {

    let employeeList = cache.get('employeeList');
    
    if (employeeList) {
        return employeeList;
    }

    employeeList = new Promise((resolve, reject) => {

        let employeeList = cache.get('employeeList');

        if (employeeList) {
            //log("Got data from cache!");
            resolve(employeeList);
            return;
        }

        log("Cache is empty, getting data from server...");

        let requestURL = bitrixURL + "/user.get.json?"
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

            employeeList = {
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
                employeeList['phone_to_id'][userList[user].UF_PHONE_INNER] = userList[user].ID;
                employeeList['id_to_phone'][userList[user].ID] = userList[user].UF_PHONE_INNER;
            }

            //log("Saving employeeList to cache");
            //cache.put('employeeList', employeeList, 1000); // Store for 1 sec

            resolve(employeeList);
        });
    });

    cache.put('employeeList', employeeList, 10 * 60 * 1000); // Store for 10 min
    
    return employeeList;
}   

module.exports = getB24EmployeeList;