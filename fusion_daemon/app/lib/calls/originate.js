const log = require('app/init/logger')(module),
    freeswitch = require('app/init/freeswitch');

let originate = (originateInfo, callback) => {
    
    let extension = originateInfo['src'];
    let domainName = originateInfo['domain'];

    // First - get if user is exists
    freeswitch.api('user_exists' , 'id ' + extension + ' ' + domainName, userExists => {
        
        if(!userExists || !userExists.body || userExists.body.substr(0,4) === '-ERR') {
            callback('originate user_exists failed');
            return;
        }

        if (userExists.body !== 'true') {
            log('originate user ' + extension + ' not found at ' + domainName);
            return;
        }

        // Get if user is registered
        freeswitch.api('sofia_contact' , '*/' + extension + '@' + domainName, sofiaContact => {
            if(!sofiaContact || !sofiaContact.body || sofiaContact.body.substr(0,4) === '-ERR') {
                callback('originate sofia_contact failed');
                return;
            }

            if (sofiaContact.body === 'error/user_not_registered') {
                callback('originate sofia_contact user not registered');
                return;
            }

            let srcUserContact = sofiaContact.body;
            let dst = originateInfo['dst'];

            let sourceCommon = '{'
                + 'click_to_call=true'
                + ',origination_caller_id_name=' + dst
                + ',origination_caller_id_number=' + dst
                + ',instant_ringback=true'
                + ',domain_name=' + domainName
            
            if (originateInfo['autoAnswer']) {
                sourceCommon += ',sip_auto_answer=true'
            }

            sourceCommon = sourceCommon + '}' + srcUserContact;
            
            let dstCommon = dst + ' XML ' + domainName + ' ' + dst + ' ' + dst;

            if (originateInfo['timeout']) {
                dstCommon += ' ' + originateInfo['timeout'];
            }

            // Fire up the call!
            freeswitch.api('originate', sourceCommon + ' ' + dstCommon, originateResult => {
                if(!originateResult || !originateResult.body || originateResult.body.substr(0,4) === '-ERR') {
                    callback('originate ' + sourceCommon + ' ' + dstCommon + ' failed');
                    return;
                }
                callback(null, 'originate: ' + originateResult.body);
            });

        });

    });
}

module.exports = originate;