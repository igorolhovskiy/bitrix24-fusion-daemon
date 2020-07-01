const bitrixConfig = require('app/config/bitrix'),
    headersProcess = require('app/init/fsheadersprocess');


let checkRequest = (rawHeaders) => {
    let headers = headersProcess(rawHeaders);

    if (headers['variable_bitrix24_enabled'] !== 'true') {
        return false;
    }
    if (headers['variable_bitrix24_token'] !== bitrixConfig.restEntryPoint) {
        return false;
    }
    headers['variable_bitrix24_url'] = bitrixConfig.url;

    return headers;
}

module.exports = checkRequest;