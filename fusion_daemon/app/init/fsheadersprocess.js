module.exports = headers => {
    let headersArray = {};

    headers.forEach(function (header) {
        headersArray[header.name] = header.value;
    });

    return headersArray;
};