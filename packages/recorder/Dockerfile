FROM node:16-alpine3.14
RUN apk add --no-cache python3
RUN apk add --no-cache make gcc g++ linux-headers udev libexecinfo-dev libexecinfo
RUN apk add sox
WORKDIR /app
COPY . .
RUN yarn install --production
RUN yarn build
CMD ["yarn", "run:production"]