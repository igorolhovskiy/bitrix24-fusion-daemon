FROM node:alpine

LABEL maintainer = Igor Olhovskiy <IgorOlhovskiy@gmail.com>

WORKDIR /opt

COPY ./package.json /opt/
 
RUN npm install --quiet

ENTRYPOINT ["npm", "run"]