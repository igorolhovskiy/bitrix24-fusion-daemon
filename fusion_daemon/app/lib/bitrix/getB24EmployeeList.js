const log = require('app/init/logger')(module),
    bitrixConfig = require('app/config/bitrix'),
    request = require('urllib');

// Returning format - Promise
// [{extension_1: userid_1}, {extension_2: userid_2}, ... , {extension_n: userid_n}]
//

function getB24EmployeeList(cache) {

    if (cache === undefined) {
        return new Promise((resolve, reject) => {
            reject('getB24EmployeeList: Cache is undefined!');
        });
    }

    let employeeList = cache.get('employeeList');

    if (employeeList) {
        return employeeList;
    }

    employeeList = new Promise((resolve, reject) => {

        log('Cache is empty, getting data from server...');

        let requestURL = bitrixConfig.url + '/user.get.json?'
            + 'USER_TYPE=employee';

        request.request(requestURL, (err, data, res) => {

            if (err) {
                reject(err);
                return;
            }

            if (res.statusCode !== 200) {
                reject('getB24EmployeeList Server failed to answer with ' + res.statusCode + ' code');
                return;
            }

            if (!Buffer.isBuffer(data)) {
                reject('getB24EmployeeList data is not Buffer!');
                return;
            }

            let userList = data.toString();

            try {
                userList = JSON.parse(userList);
            } catch (e) {
                reject('getB24EmployeeList Answer from server is not JSON');
                return;
            }

            if (userList.result === undefined) {
                reject('getB24EmployeeList Missing result section in answer');
                return;
            }

            userList = userList.result;

            let employeeListResult = {
                'phoneToId': {},
                'IdToPhone' : {},
                'DidToId' : {},
                'IdToDepartment': {},
            };

            let managerToDepartment = {};

            for (let user in userList) {
                if (userList[user].ID === undefined) {
                    log('Strange, we have a user without ID: ' + JSON.stringify(user));
                    continue;
                }

                // Check if user is active
                if (!userList[user].ACTIVE) {
                    continue;
                }

                if (userList[user].UF_PHONE_INNER === undefined || userList[user].UF_PHONE_INNER === null) {
                    continue;
                }

                employeeListResult['phoneToId'][userList[user].UF_PHONE_INNER] = userList[user].ID;
                employeeListResult['IdToPhone'][userList[user].ID] = userList[user].UF_PHONE_INNER;

                if (userList[user].WORK_PHONE && userList[user].WORK_PHONE !== null && userList[user].WORK_PHONE !== '') {
                    employeeListResult['DidToId'][userList[user].WORK_PHONE] = userList[user].ID;
                }

                if (userList[user].UF_DEPARTMENT && userList[user].UF_DEPARTMENT !== null && userList[user].UF_DEPARTMENT !== '') {

                    employeeListResult['IdToDepartment'][userList[user].ID] = userList[user].UF_DEPARTMENT;
                    //log('Adding user ' + userList[user].ID + ' department list ' + JSON.stringify(userList[user].UF_DEPARTMENT));

                    if (userList[user].WORK_POSITION === 'Manager') {
                        managerToDepartment[userList[user].ID] = userList[user].UF_DEPARTMENT;
                        //log('Adding manager ' + userList[user].ID + ' department list ' + JSON.stringify(userList[user].UF_DEPARTMENT));
                    }
                }
            }

            // Built Department - To - Manager map
            let departmentToManger = {};

            for (let manager in managerToDepartment) {
                //log('departmentToManger Processing manager ' + manager + ' -> ' + JSON.stringify(managerToDepartment[manager]));
                for (let department of managerToDepartment[manager]) {
                    //log('departmentToManger Processing department ' + department);
                    if (!departmentToManger[department]) {
                        //log('departmentToManger No active managers for department ' + department + ' creating with ' + manager);
                        // We don't have this link yet
                        departmentToManger[department] = [manager];
                        continue;
                    }
                    if (departmentToManger[department].includes(manager)) {
                        //log('departmentToManger Department ' + department + ' already includes manager ' + manager);
                        continue;
                    }
                    //log('departmentToManger Adding to department ' + department + ' manager ' + manager);
                    departmentToManger[department].push(manager);
                }
            }

            //log('departmentToManger -> ' + JSON.stringify(departmentToManger));

            // Creating User - To - Manager map
            let userToManager = {};

            for (let userID in employeeListResult['IdToDepartment']) {

                let currentUserToManager = new Set();
                let departmentsID = employeeListResult['IdToDepartment'][userID];

                //log('userToManager Processing user ' + userID + ' with department ' + departmentsID);
                for (let departmentID of departmentsID) {
                    if (departmentToManger[departmentID]) {
                        //log('userToManager we have manager(s) ' + JSON.stringify(departmentToManger[departmentID]) + ' for department ' + departmentID);
                        for (let managerID of departmentToManger[departmentID]) {
                            currentUserToManager.add(managerID);
                        }
                    }
                }
                if (currentUserToManager.size > 0) {
                    userToManager[userID] = Array.from(currentUserToManager);
                }
            }

            //log('userToManager -> ' + JSON.stringify(userToManager));

            employeeListResult['IdToManager'] = userToManager;

            //log('employeeListResult -> ' + JSON.stringify(employeeListResult));

            resolve(employeeListResult);
        });
    });

    cache.put('employeeList', employeeList, 10 * 60 * 1000); // Store for 10 min

    return employeeList;
}

module.exports = getB24EmployeeList;