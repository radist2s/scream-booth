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
