#!/bin/sh

make_sync() {
  rsync -avz $UPLOAD_SOURCE_DIR $UPLOAD_DEST
}

cat /ssh/id_rsa >> /root/.ssh/id_rsa && chmod 600 /root/.ssh/id_rsa
mkdir -p $UPLOAD_SOURCE_DIR

make_sync

while inotifywait -r -e modify,create,delete,move $UPLOAD_SOURCE_DIR; do
    make_sync
done

#yarn start:recorder:uploader