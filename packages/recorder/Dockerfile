FROM node:16-alpine3.14
RUN apk add --no-cache python3
RUN apk add --no-cache make gcc g++ linux-headers udev libexecinfo-dev libexecinfo
RUN apk add alsa-utils alsa-utils-doc alsa-lib alsaconf alsa-ucm-conf
RUN apk add sox
WORKDIR /app
COPY ./package.json ./
RUN yarn install
COPY ./ ./
RUN yarn build
CMD ["yarn", "start:production"]