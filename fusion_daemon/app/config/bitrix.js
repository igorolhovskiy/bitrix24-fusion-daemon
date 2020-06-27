module.exports = {
    entryPoint: (typeof process.env.REST_ENTRYPOINT === 'undefined') ? false : process.env.REST_ENTRYPOINT,
    port:  (typeof process.env.REST_PORT === 'undefined') ? 3000 : process.env.REST_PORT
};