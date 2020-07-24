const headersProcess = require('app/init/fsheadersprocess'),
    restConfig = require('app/config/rest');


let checkRequest = (rawHeaders) => {
    let headers = headersProcess(rawHeaders);

    if (headers['variable_bitrix24_enabled'] !== 'true') {
        return false;
    }
    if (headers['variable_bitrix24_token'] !== restConfig.entryPoint) {
        return false;
    }

    return headers;
}

module.exports = checkRequest;