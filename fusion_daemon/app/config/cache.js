module.exports = {
    timeout: (typeof process.env.CACHE_TIMEOUT === 'undefined') ? 3600 : (isNaN(parseInt(process.env.CACHE_TIMEOUT, 10)) ? 3600 : parseInt(process.env.CACHE_TIMEOUT, 10))
}