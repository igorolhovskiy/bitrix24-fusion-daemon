Variables to specify on FusionPBX:

bitrix24_enabled = true
bitrix24_token = ${REST_ENTRYPOINT} = path part (token) you for from Bitrix24 when declaring inbound webhook

Requests from Bitrix:

ONEXTERNALCALLSTART
http://<server_address>/rest/1/${REST_ENTRYPOINT}:${REST_PORT}
Token - ${REST_TOKEN} or ${REST_ENTRYPOINT}
Bitrix Domain - ${REST_REQUESTDOMAIN}