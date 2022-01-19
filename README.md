# How to use

## Via Yarn

* ### Start recorder
    ```
    yarn recorder
    ```
* ### Stop recorder
    ```
    yarn recorder:stop
    ```
## Via Docker

* ### Start recorder
    ```
    docker-compose --project-directory packages/recorder up -d
    ```
* ### Stop recorder
    ```
    docker-compose --project-directory packages/recorder down
    ```
# Project structure

* `packages/recorder` - **Scream Booth Recorder** *(`recorder`)*.
  Records audio and uploads them to the `radio`

* `packages/radio` - **Scream Booth Radio** *(`radio`)*
  * `OpenSSH Server` - receives recordings over ssh from `recorder`
  * `File Browser` app - helps to manage recordings
  * `icecase2` - radio audio stream (`http://your-server-name:8000/mpd`)
  * `mpd` - radio player
  * `ympd` - web UI for mpd