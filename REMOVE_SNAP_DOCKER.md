# Remove Docker snap
```bash
sudo snap remove docker
```
Package 'docker-ce' is not installed, so not removed
```bash
sudo rm -rf /var/lib/docker /etc/docker
sudo rm /etc/apparmor.d/docker
sudo groupdel docker
sudo rm -rf /var/run/docker.sock
dpkg -l | grep -i docker
sudo rm -rf /snap/docker
```
Logout to refresh PATHs

# Install Docker
https://docs.docker.com/engine/install/ubuntu/
# Install Docker Compose
https://docs.docker.com/compose/install/


### Resolving Docker Compose `line 1: Not: command not found` error
`/usr/local/bin/docker-compose: line 1: Not: command not found`
In case if error occurred, replace `docker-compose` by pip version.

```
sudo apt update
sudo apt install -y python3-pip libffi-dev
sudo rm /usr/local/bin/docker-compose
sudo pip3 install docker-compose
```
