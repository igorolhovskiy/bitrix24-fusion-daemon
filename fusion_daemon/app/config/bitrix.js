module.exports = {
    url: (typeof process.env.BITRIX_URL === 'undefined') ? false : process.env.BITRIX_URL,
    restEntryPoint: (typeof process.env.REST_ENTRYPOINT === 'undefined') ? false : process.env.REST_ENTRYPOINT,
    restPort:  (typeof process.env.REST_PORT === 'undefined') ? 3000 : process.env.REST_PORT,
    restToken: (typeof process.env.REST_TOKEN === 'undefined') ? process.env.REST_ENTRYPOINT : process.env.REST_TOKEN,
    restRequestDomain: (typeof process.env.REST_REQUESTDOMAIN === 'undefined') ? "" : process.env.REST_REQUESTDOMAIN,
};