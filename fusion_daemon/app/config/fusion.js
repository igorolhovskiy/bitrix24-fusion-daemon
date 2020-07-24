module.exports = {
    domain: (typeof process.env.FUSION_DOMAIN === 'undefined') ? false : process.env.FUSION_DOMAIN,
    localNumberLength: (typeof process.env.FUSION_LOCALNUMBERLENGHT === 'undefined') ? 4 : parseInt(process.env.FUSION_LOCALNUMBERLENGHT),
    localRecordingPath: (typeof process.env.FUSION_LOCALRECORDINGPATH === 'undefined') ? '/var/lib/freeswitch/recordings' : process.env.FUSION_LOCALRECORDINGPATH,
    recordingPath: (typeof process.env.FUSION_RECORDINGPATH === 'undefined') ? false : process.env.FUSION_RECORDINGPATH
};