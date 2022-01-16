import * as fs from 'fs';
import * as path from 'path';
import AudioRecorder from 'node-audiorecorder';
import { config } from 'dotenv';
import debugDefault from 'debug';
import { getSerialPortButton } from './RecorderController';
import { intervalToDuration, formatDuration } from 'date-fns';

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

  const {
    SCREAM_BOOTH_RECORDER_OUT_DIR: recorderOutDir,
    SCREAM_BOOTH_RECORDER_OUT_TMP_DIR: recorderOutTmpDir,
  } = process.env;

  const fileOutDirectory = recorderOutDir
    ? path.isAbsolute(recorderOutDir)
      ? recorderOutDir
      : path.resolve(process.cwd(), recorderOutDir)
    : process.cwd();

  const fileDirectoryTmp = recorderOutTmpDir
    ? path.isAbsolute(recorderOutTmpDir)
      ? recorderOutTmpDir
      : path.resolve(process.cwd(), recorderOutTmpDir)
    : path.join(process.cwd(), 'tmp');

  if (!fs.existsSync(fileOutDirectory)) {
    fs.mkdirSync(fileOutDirectory, { recursive: true });
  }

  if (!fs.existsSync(fileDirectoryTmp)) {
    fs.mkdirSync(fileDirectoryTmp, { recursive: true });
  }

  const fileName = new Date().toISOString().concat(`.${fileType}`);
  const fileTmpPath = path.join(fileDirectoryTmp, fileName);
  const fileOutPath = path.join(fileOutDirectory, fileName);

  debug('Writing new recording file at: ', fileTmpPath);

  const fileStream = fs.createWriteStream(fileTmpPath, { encoding: 'binary' });

  fileStream.on('finish', () => {
    const recordingEndTime = new Date();

    const duration = recordingStartTime
      ? formatDuration(intervalToDuration({ start: recordingStartTime, end: recordingEndTime }))
      : 'ZERO';

    fs.stat(fileTmpPath, (error, stat) => {
      if (error)
        return console.error(`Error while reading stats of the file: ${fileTmpPath}`, error);
      if (!stat.size) return console.error(`Recording is empty: ${fileTmpPath}`);

      fs.rename(fileTmpPath, fileOutPath, error => {
        if (error) {
          console.error(error);
        }

        debug(`Recording moved to out directory: ${fileOutPath}`);
        debug(`Recording duration: ${duration}`);
      });
    });
  });

  const recordingStartTime = new Date();

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
