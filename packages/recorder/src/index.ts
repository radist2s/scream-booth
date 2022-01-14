import * as fs from 'fs';
import * as path from 'path';
import AudioRecorder from 'node-audiorecorder';
import { config } from 'dotenv';
import debugDefault from 'debug';
import { getSerialPortButton } from './RecorderController';

const SAMPLE_RATE = 44100;
const CHANNEL_COUNT = 1;

const debug = debugDefault('scream-booth:recorder');

config();

const main = async () => {
  debug('Main starts...');
  let audioRecorder: ReturnType<typeof startSoXAudioRecorder> | undefined;

  const buttonHandlers = await getSerialPortButton({
    onActivate() {
      if (audioRecorder) audioRecorder.stop();
      audioRecorder = startSoXAudioRecorder();

      audioRecorder.stream()?.on('close', function (code) {
        buttonHandlers.buttonLightOff();
      });

      buttonHandlers.buttonLightOn();
    },
    onDeactivate() {
      audioRecorder?.stop();
      audioRecorder = undefined;
      buttonHandlers.buttonLightOff();
    },
  });

  console.warn('Press Ctrl + C to exit.');
  return new Promise(() => {});
};

const startSoXAudioRecorder = () => {
  const fileType = 'mp3';

  const deviceConfig = ((): { device: null | string; driver: null | string } => {
    if (process.env.SOX_AUDIODEV && process.env.SOX_AUDIODRIVER) {
      return {
        device: process.env.SOX_AUDIODEV,
        driver: process.env.SOX_AUDIODRIVER,
      };
    }

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

main();
