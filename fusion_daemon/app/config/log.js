module.exports = {
    debug: (process.env.DEBUG === undefined) ? false : (process.env.DEBUG.toLowerCase() === 'true'),
};