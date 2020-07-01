const options = require('app/config/freeswitch');

module.exports = module => {
    return function() {
        if (options.debug === 'true') {
            let currentDate = new Date().toISOString();
            currentDate = currentDate.slice(0,10) + " " + currentDate.slice(11,19);
            let args = ["[" + currentDate +  "]" ,"[" + module.filename + "]"].concat([].slice.call(arguments));
            console.log.apply(console, args)
        }
    }
}