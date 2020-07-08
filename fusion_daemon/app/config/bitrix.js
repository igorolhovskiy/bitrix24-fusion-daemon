module.exports = {
    url: (typeof process.env.BITRIX_URL === 'undefined') ? false : process.env.BITRIX_URL,
    createLocalContact: (typeof process.env.BITRIX_CREATELOCALCONTACT === 'undefined') ? false : (process.env.BITRIX_CREATELOCALCONTACT.toLowerCase() === 'true'),
    appendRecording: (typeof process.env.BITRIX_APPENDRECORDING === 'undefined') ? true : (process.env.BITRIX_APPENDRECORDING.toLowerCase() !== 'false'),
};