FROM node:8
MAINTAINER Darshan Jain
WORKDIR /usr/src/app
COPY package.json ./
COPY index.js ./
COPY client ./
RUN npm install
EXPOSE 4000
CMD [ "node", "index.js"]
