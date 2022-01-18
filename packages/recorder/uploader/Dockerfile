FROM i386/alpine
RUN apk add --no-cache openssh
RUN apk add --no-cache rsync
RUN apk add --no-cache inotify-tools
WORKDIR /root
COPY ./uploader/ssh-config ./.ssh/config
RUN chmod 700 .ssh && chmod 644 .ssh/config
WORKDIR /app
COPY ./uploader/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]