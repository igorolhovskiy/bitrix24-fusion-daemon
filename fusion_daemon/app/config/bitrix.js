module.exports = {
    url: (typeof process.env.BITRIX_URL === 'undefined') ? false : process.env.BITRIX_URL,
    createLocalContact: (typeof process.env.BITRIX_CREATELOCALCONTACT === 'undefined') ? false : (process.env.BITRIX_CREATELOCALCONTACT.toLowerCase() === 'true'),
    createContact: (typeof process.env.BITRIX_CREATECONTACT === 'undefined') ? true : (process.env.BITRIX_CREATECONTACT.toLowerCase() === 'true'),
    appendRecording: (typeof process.env.BITRIX_APPENDRECORDING === 'undefined') ? true : (process.env.BITRIX_APPENDRECORDING.toLowerCase() !== 'false'),
    showIMNotification: (typeof process.env.BITRIX_SHOWIMNOTIFICATION === 'undefined') ? false : (process.env.BITRIX_SHOWIMNOTIFICATION.toLowerCase() === 'true'),
    defaultUserID: (typeof process.env.BITRIX_DEFAULTUSERID === 'undefined') ? '1' : process.env.BITRIX_DEFAULTUSERID,
    showNotAssignedCallToManager: (typeof process.env.BITRIX_SHOWNOTASSIGNEDCALLTOMANAGER === 'undefined') ? false : (process.env.BITRIX_SHOWNOTASSIGNEDCALLTOMANAGER.toLowerCase() === 'true')
};