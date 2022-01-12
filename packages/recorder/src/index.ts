import { getDevices, AudioIO, SampleFormat16Bit, IoStreamRead } from '@radist2s/naudiodon';
import { Converter } from 'ffmpeg-stream';
import * as fs from 'fs';
import * as path from 'path';
import AudioRecorder from 'node-audiorecorder';
import { config } from 'dotenv';
import SerialPort from 'serialport';
import debugDefault from 'debug';
// import readline from 'readline';

const debug = debugDefault('scream-box:recorder');

config();

const main = async () => {
  let audioRecorder: ReturnType<typeof startSoXAudioRecorder> | undefined;

  const buttonPressHandler = {
    onActivate() {
      if (audioRecorder) audioRecorder.stop();
      audioRecorder = startSoXAudioRecorder();
    },
    onDeactivate() {
      audioRecorder?.stop();
      audioRecorder = undefined;
    },
  };

  getSerialPortButtonToggle(buttonPressHandler);

  /*
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on(
    'keypress',
    (
      str,
      key?: { sequence: string; name: string; ctrl: boolean; meta: boolean; shift: boolean }
    ) => {
      if (key?.shift && key.name === 'r') {
        buttonPressHandler.onActivate();
      } else if (key?.shift && key.name === 's') {
        buttonPressHandler.onDeactivate();
      }
    }
  );*/

  // Keep process alive.
  // process.stdin.resume();

  // console.warn('Press Ctrl + C to exit.');
  // console.warn('Press Shift + R to start record.');
  // console.warn('Press Shift + S to stop recording.');
  return new Promise(() => {});
};

const startSoXAudioRecorder = () => {
  const fileType = 'mp3';

  let defaultDevice: ReturnType<typeof getDefaultDevice> | undefined;

  // try {
  //   defaultDevice = getDefaultDevice();
  // } catch (e) {
  //   console.error('Unhandled error while reading list of devices', e);
  // }

  const deviceConfig = ((): { device: null | string; driver: null | string } => {
    if (!defaultDevice?.hostAPIName || !defaultDevice?.name) return { device: null, driver: null };

    const { name: device, hostAPIName } = defaultDevice;

    if (hostAPIName?.match(/Core\s*Audio/i)) return { device, driver: 'coreaudio' };
    if (hostAPIName?.match(/alsa/i)) return { device, driver: 'alsa' };
    if (hostAPIName?.match(/(Wave\s*Audio|Direct\s*Sound|WDM|WASAPI|Windows)/i))
      return { device, driver: 'waveaudio' };

    return { device: null, driver: null };
  })();

  debug('Device config: ', deviceConfig);

  const audioRecorder = new AudioRecorder(
    {
      ...deviceConfig,
      program: 'sox',
      bits: 16,
      encoding: 'signed-integer',
      channels: CHANNEL_COUNT,
      rate: SAMPLE_RATE,
      type: fileType,

      silence: 0,
      thresholdStart: 0.1,
      thresholdStop: 0.2,
      keepSilence: true,
    },
    console
  );

  const { SCREAM_BOX_RECORDER_OUT_DIR } = process.env;
  const fileDirectory = SCREAM_BOX_RECORDER_OUT_DIR
    ? path.isAbsolute(SCREAM_BOX_RECORDER_OUT_DIR)
      ? SCREAM_BOX_RECORDER_OUT_DIR
      : path.resolve(process.cwd(), SCREAM_BOX_RECORDER_OUT_DIR)
    : process.cwd();

  if (!fs.existsSync(fileDirectory)) {
    fs.mkdirSync(fileDirectory, { recursive: true });
  }

  const filePath = path.join(fileDirectory, new Date().toISOString().concat(`.${fileType}`));

  debug('Writing new recording file at: ', filePath);

  const fileStream = fs.createWriteStream(filePath, { encoding: 'binary' });

  audioRecorder.start().stream()?.pipe(fileStream);

  audioRecorder.stream()?.on('close', function (code) {
    debug('Recording closed. Exit code: ', code);
  });
  audioRecorder.stream()?.on('end', function () {
    debug('Recording ended.');
  });
  audioRecorder.stream()?.on('error', function () {
    debug('Recording error.');
  });

  return audioRecorder;
};

const mainNaudiodonFFMPEG = async () => {
  const recordStream = getRecordNaudiodonAudioStream();

  const { converter } = getAudioStreamFFMPEGConverter(recordStream);
  converter.run();

  const streamSaver = saveStream(recordStream);
  debug('Stream record started');

  recordStream.start();
  debug('Stream started');
};

const saveStream = (stream: IoStreamRead, filepath = 'rawAudio.raw') => {
  // Create a write stream to write out to a raw audio file
  const ws = fs.createWriteStream(filepath);
  stream.pipe(ws);
  return ws;
};

const SAMPLE_RATE = 44100;
const CHANNEL_COUNT = 1;

const getRecordNaudiodonAudioStream = () => {
  const ai = AudioIO({
    inOptions: {
      channelCount: 2,
      framesPerBuffer: 8,
      sampleFormat: SampleFormat16Bit,
      sampleRate: SAMPLE_RATE,
      deviceId: getDefaultDevice()?.id ?? -1, // Use -1 to select the default device
      closeOnError: false, // Close the stream if an audio error is detected, if set false then just log the error
    },
  });

  return ai;
};

const getAudioStreamFFMPEGConverter = (stream: IoStreamRead) => {
  const converter = new Converter();

  stream.pipe(
    converter.createInputStream({
      // re: true,
      f: 's16le',
      ar: SAMPLE_RATE,
    })
  );

  converter.createOutputToFile(`${__dirname}/cat_full.mp3`, {
    // 'c:a': 'libvorbis',
    // 'b:a': '128k',
    'codec:a': 'libmp3lame',
    'qscale:a': 2,
  });

  return { converter };
};

const getSerialPortButtonToggle = ({
  onActivate,
  onDeactivate,
}: {
  onActivate: () => void;
  onDeactivate: () => void;
}) => {
  const { SCREAM_BOX_CONTROLLER_PORT, SCREAM_BOX_CONTROLLER_PORT_SPEED } = process.env;

  if (!SCREAM_BOX_CONTROLLER_PORT)
    throw new Error('No environment variable SCREAM_BOX_CONTROLLER_PORT specified');

  const serialPort = new SerialPort(SCREAM_BOX_CONTROLLER_PORT, {
    baudRate: SCREAM_BOX_CONTROLLER_PORT_SPEED ? Number(SCREAM_BOX_CONTROLLER_PORT_SPEED) : 115200,
  });

  const parser = serialPort.pipe(new SerialPort.parsers.Readline({ delimiter: '\r\n' }));

  let statusChangeTime = 0;
  let isRecordingButtonActive = false;

  const deactivate = () => {
    if (!isRecordingButtonActive) return;
    isRecordingButtonActive = false;
    debug('deactivate');
    onDeactivate();
  };

  const activate = () => {
    if (isRecordingButtonActive) return;
    isRecordingButtonActive = true;
    debug('activate');
    onActivate();
  };

  parser.on('data', (data: 'active' | 'inactive') => {
    if (data === 'inactive') {
      if (Date.now() - statusChangeTime > 1000) {
        deactivate();
        statusChangeTime = Date.now();
      }
    } else if (data === 'active') {
      statusChangeTime = Date.now();
      activate();
    }
  });

  return serialPort;
};

const getDefaultDevice = () => {
  return getDevices().find(
    ({ defaultSampleRate, maxInputChannels }) =>
      defaultSampleRate >= SAMPLE_RATE && maxInputChannels >= CHANNEL_COUNT
  );
};

main();
