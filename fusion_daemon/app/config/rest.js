module.exports = {
    entryPoint: (process.env.REST_ENTRYPOINT === undefined) ? false : process.env.REST_ENTRYPOINT,
    port:  (process.env.REST_PORT === undefined) ? 3000 : process.env.REST_PORT,
    token: (process.env.REST_TOKEN === undefined) ? process.env.REST_ENTRYPOINT : process.env.REST_TOKEN,
    requestDomain: (process.env.REST_REQUESTDOMAIN === undefined) ? false : process.env.REST_REQUESTDOMAIN,
};