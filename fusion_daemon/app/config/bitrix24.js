module.exports = {
    c2c_token: (typeof process.env.C2C_TOKEN === 'undefined') ? false : process.env.C2C_TOKEN
}