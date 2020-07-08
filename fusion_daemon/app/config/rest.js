module.exports = {
    entryPoint: (typeof process.env.REST_ENTRYPOINT === 'undefined') ? false : process.env.REST_ENTRYPOINT,
    port:  (typeof process.env.REST_PORT === 'undefined') ? 3000 : process.env.REST_PORT,
    token: (typeof process.env.REST_TOKEN === 'undefined') ? process.env.REST_ENTRYPOINT : process.env.REST_TOKEN,
    requestDomain: (typeof process.env.REST_REQUESTDOMAIN === 'undefined') ? false : process.env.REST_REQUESTDOMAIN,
};