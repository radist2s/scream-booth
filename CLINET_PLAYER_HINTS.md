## Mplayer
### Installation
* Windows: [install](http://oss.netfarm.it/mplayer-win32.php) [direct link for Core i3/i5/i7, Celeron/Pentium G](https://sourceforge.net/projects/mplayer-win32/files/MPlayer%20and%20MEncoder/r38328+g30322ebe3c/MPlayer-corei7-r38328+g30322ebe3c.7z/download)
* Mac: `brew install mplayer`
* Linux: `sudo apt-get install mplayer`

### Infinite loop
If errors occur, `mplayer` will crash with an error. It is necessary to run it in an infinite loop.

* #### Windows:
    `player.bat`:
    ```
    :loop
    mplayer http://localhost:8000/mpd
    ping 127.0.0.1 -n 6 > nul
    goto loop
    ```
* #### POSIX:
    `player.sh`:
    ```
    bash -c "while true; do mplayer http://localhost:8000/mpd; sleep 5s; done"
    ```
