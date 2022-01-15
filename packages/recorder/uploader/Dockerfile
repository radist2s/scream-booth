FROM node:16-alpine3.14
RUN apk add --no-cache python3
RUN apk add --no-cache make gcc g++ linux-headers udev libexecinfo-dev libexecinfo
RUN apk add --no-cache openssh
RUN apk add --no-cache rsync
RUN apk add --no-cache inotify-tools
WORKDIR /root
COPY ./uploader/ssh-config ./.ssh/config
RUN chmod 700 .ssh && chmod 644 .ssh/config
WORKDIR /app
#COPY ./package.json ./
COPY ./uploader/entrypoint.sh ./entrypoint.sh
RUN #yarn install
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]