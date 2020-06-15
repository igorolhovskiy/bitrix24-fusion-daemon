let commonBody = (headers) => {

    let event_timestamp = headers['Event-Date-Timestamp'];
    // Adjust timestamp, remove microseconds part.
    event_timestamp = event_timestamp.substring(0, event_timestamp.length - 6);

    let requestBody = {
        'timestamp' : event_timestamp,
        'uuid': headers['variable_vtiger_call_uuid'] || headers['variable_call_uuid'],
    }

    // Add vtigersignature
    if (typeof(headers['variable_vtiger_api_key']) !== 'undefined') {
        let vtiger_api_key_buff = new Buffer.from(headers['variable_vtiger_api_key'], 'base64');
        requestBody['vtigersignature'] = vtiger_api_key_buff.toString('ascii');
    }

    if (typeof(headers['variable_call_direction']) !== 'undefined') {
        requestBody['direction'] = headers['variable_call_direction'];
    } else {
        requestBody['direction'] = headers['variable_direction'];
    }

    return requestBody;
}

module.exports = commonBody;