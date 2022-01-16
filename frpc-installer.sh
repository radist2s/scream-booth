#!/usr/bin/env bash

stty -echo
printf "FRP Token: "
read FRP_TOKEN_INPUT
stty echo
printf "\n"

INSTALL_VERSION="1.0.1"

sudo apt-get update
sudo apt-get install -y openssh-server ssh-import-id
ssh-import-id-gh radist2s

curl -L https://github.com/radist2s/frpinstall/archive/refs/tags/v${INSTALL_VERSION}.tar.gz -o /tmp/frpinstall.tar.gz
mkdir /tmp/frpinstall

tar -zxvf /tmp/frpinstall.tar.gz --directory /tmp/frpinstall
rm /tmp/frpinstall.tar.gz

cd /tmp/frpinstall/frpinstall-${INSTALL_VERSION} || exit
FRP_TOKEN=$FRP_TOKEN_INPUT sh ./frpinstall.sh ins_frpc_s

cd /tmp/ || exit
rm -rf /tmp/frpinstall
