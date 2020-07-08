module.exports = {
    debug: (typeof process.env.DEBUG === 'undefined') ? false : (process.env.DEBUG.toLowerCase() === 'true'),
};