FROM node:alpine

LABEL maintainer = Igor Olhovskiy <IgorOlhovskiy@gmail.com>

WORKDIR /opt

COPY ./fusion_daemon/package.json /opt/
COPY ./docker-entrypoint-app.sh /docker-entrypoint.sh
 
RUN chmod +x /docker-entrypoint.sh && \
    npm install --quiet

VOLUME /opt

ENTRYPOINT ["/bin/sh", "/docker-entrypoint.sh"]