module.exports = {
    domain: (typeof process.env.FUSION_DOMAIN === 'undefined') ? false : process.env.FUSION_DOMAIN,
    transport: (typeof process.env.FUSION_TRANSPORT === 'undefined') ? 'https' : process.env.FUSION_TRANSPORT,
    c2cPath: (typeof process.env.FUSION_C2CPATH === 'undefined') ? '/app/click_to_call/click_to_call.php' : process.env.FUSION_C2CPATH,
    apiKey:  (typeof process.env.FUSION_APIKEY === 'undefined') ? false : process.env.FUSION_APIKEY,
    localNumberLength: (typeof process.env.FUSION_LOCALNUMBERLENGHT === 'undefined') ? 4 : parseInt(process.env.FUSION_LOCALNUMBERLENGHT),
    localRecordingPath: (typeof process.env.FUSION_LOCALRECORDINGPATH === 'undefined') ? '/var/lib/freeswitch/recordings' : process.env.FUSION_LOCALRECORDINGPATH,
    recordingPath: (typeof process.env.FUSION_RECORDINGPATH === 'undefined') ? false : process.env.FUSION_RECORDINGPATH
};