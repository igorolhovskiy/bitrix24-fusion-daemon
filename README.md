### Daemon to listen FreeSWITCH Events and send em to Bitrix24 (box) via webHooks

For all questions, pls fork and explore.  
DEV version, might will develop in the future.  
Designed to work with this version of [FusionPBX](https://github.com/igorolhovskiy/fusionpbx)


Variables to specify on FusionPBX:

bitrix24_enabled = true  
bitrix24_token = `${REST_ENTRYPOINT}` = last path part (token) you for from Bitrix24 click2call path

Requests from Bitrix:  

ONEXTERNALCALLSTART  
http://<server_address>/rest/1/`${REST_ENTRYPOINT}`:`${REST_PORT}`  
Token - `${REST_TOKEN}` or `${REST_ENTRYPOINT}`  
Bitrix Domain - `${REST_REQUESTDOMAIN}`  

Some env variables description  


`BITRIX_URL` - Where to send Bitrix24 webhook requests. Full path like `https://crm.mycompany.com/rest/1/this_is_my_secret_token`  
`REST_PORT` - Port on which to listen for Click2Call requests. 3000 by default  
`REST_ENTRYPOINT` - Outbound webhook for click2call should be like `http://fusion_server:REST_PORT/rest/1/REST_ENTRYPOINT`  
`REST_REQUESTDOMAIN` - Domain to verify in outbound webhook from Bitrix in `body.auth.domain`  
`REST_TOKEN` - Token to verify in outbound webhook in `body.auth.application_token`  
`FUSION_APIKEY` - API Key of user in Fusion with `click_to_call_call` permission  
`FUSION_DOMAIN` - On which domain we're sending a request for Click2Call.  
`FUSION_RECORDINGPATH` - Actually path to get recording files. For example - `https://fusion_server:8443`   
    See nginx example below for port 8443 and default Fusion recording path  


nginx site example for getting recordings.
```
server {
    listen 8080;
    server_name _;
    return 302 https://$host:8443$request_uri;
}

server {
    listen 8443;

    ssl                     on;
    ssl_certificate         /etc/ssl/wildcard.com.crt;
    ssl_certificate_key     /etc/ssl/wildcard.com.key;
    ssl_protocols           TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers             HIGH:!ADH:!MD5:!aNULL;

    access_log /var/log/nginx/access_rec.log;
    error_log /var/log/nginx/error_rec.log;

    client_max_body_size 10M;
    client_body_buffer_size 128k;

    location / {
        root /var/lib/freeswitch/recordings/;
        add_header Access-Control-Allow-Origin *;
        autoindex off;
    }

    # Disable viewing .htaccess & .htpassword & .db
    location ~ .htaccess {
            deny all;
    }
    location ~ .htpassword {
            deny all;
    }
    location ~^.+.(db)$ {
            deny all;
    }
}
```


More vars are in `fusion_daemon/app/config`