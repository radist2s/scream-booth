To use ffplay with signed 16-bit little endian raw PCM, specify -f s16le:

```
ffplay -f s16le -ar 16k -ac 1 snake.raw
```
For a stereo, 32-bit floating-point, 48,000 file specify:

```
ffplay -f f32le -ar 48000 -ac 2 snake.raw
```
For a list of supported formats for the -f option, use ffplay -formats. -ar is the sample rate and -ac is the number of channels.

```
play -t raw -r 16k -e signed -b 16 -c 1 snake.raw 

-r = sampling rate
-b = sampling precision (bits)
-c = number of channels
--endian is also interesting
```

### List Alsa Recording devices
```bash
arecord -L
```

### Test alsa device for recording
```
AUDIODEV="hw:CARD=I82801AAICH,DEV=0" AUDIODRIVER=alsa rec -d
```

### List Devices

* Mac
    ```
    ffmpeg -list_devices true -f avfoundation -i dummy
    sox -V6 -n -t coreaudio junkname
    ```
* Windows 
    ```
    ffmpeg -list_devices true -f dshow -i dummy
    ```
  
### Record wia ffmpeg:

* Mac
    ```
    ffmpeg -f avfoundation -i ":2" -acodec libmp3lame -ab 32k -ac 1 -f mp3 goo.mp3
    ```
* Windows
    ```
    ffmpeg -f dshow -i audio="Device name" path-to-file\file-name.mp3
    ```

# Linux
```bash
sudo apt install alsa alsa-utils 
```

### Test SoX
```bash
play -n -c1 synth 3 sine 500
```

### Test alsa
With [speaker-test](http://manpages.ubuntu.com/manpages/impish/man1/speaker-test.1.html):
```bash
Produce stereo sound from one stereo jack:
 speaker-test -Dplug:front -c2

Produce 4 speaker sound from two stereo jacks:
 speaker-test -Dplug:surround40 -c4

Produce 5.1 speaker sound from three stereo jacks:
 speaker-test -Dplug:surround51 -c6

To send a nice low 75Hz tone to the Woofer  and  then  exit  without  touching  any  other
speakers:
 speaker-test -Dplug:surround51 -c6 -s1 -f75

To do a 2-speaker test using the spdif (coax or optical) output:
 speaker-test -Dplug:spdif -c2

Play in the order of front-right and front-left from the front PCM
 speaker-test -Dplug:front -c2 -mFR,FL
```

## SoX

SoX 14.4.2 for MS Windows has trouble identifying the default audio device. There are two possible solutions:

Replace -d with -t waveaudio 0. If you have multiple audio devices (e.g. a USB microphone next to the regular mic plug), then you may need to replace 0 with 1 or higher.
Uninstall SoX 14.4.2, install SoX 14.4.1 instead.
