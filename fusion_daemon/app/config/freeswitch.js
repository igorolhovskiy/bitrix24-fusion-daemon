module.exports = {
    host: (typeof process.env.ESL_HOST === 'undefined') ? '127.0.0.1' : process.env.ESL_HOST,
    port: (typeof process.env.ESL_PORT === 'undefined') ? 8021 : process.env.ESL_PORT,
    password: (typeof process.env.ESL_PASSWORD === 'undefined') ? 'ClueCon' : process.env.ESL_PASSWORD,
    debug: (typeof process.env.DEBUG === 'undefined') ? false : (process.env.DEBUG.toLowerCase() === 'true'),
    reconnect_seconds: 3,
    subscription: ['CHANNEL_ORIGINATE', 'CHANNEL_CREATE', 'CHANNEL_ANSWER', 'CHANNEL_HANGUP', 'CHANNEL_PROGRESS' ,'CHANNEL_BRIDGE', 'CHANNEL_DESTROY']
};