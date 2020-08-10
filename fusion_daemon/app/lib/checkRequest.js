const log = require('app/init/logger')(module),
      headersProcess = require('app/init/fsheadersprocess'),
      restConfig = require('app/config/rest');


let checkRequest = (rawHeaders) => {
    let headers = headersProcess(rawHeaders);

    if (headers['variable_bitrix24_enabled'] !== 'true') {
        return false;
    }
    if (headers['variable_bitrix24_token'] !== restConfig.entryPoint) {
        return false;
    }

    if (headers['variable_bitrix24_channel'] === 'caller') {
        log('Processing CALLER channel');
        return headers;
    }

    if (headers['variable_bitrix24_channel'] === 'callee') {
        log('Processing CALLEE channel');
        return headers;
    }

    log('Processing ZOMBIE channel: ' + JSON.stringify(headers, null, 2));
    return headers;
}

module.exports = checkRequest;