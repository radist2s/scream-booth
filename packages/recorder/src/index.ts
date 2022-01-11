import { getDevices, AudioIO, SampleFormat16Bit, IoStreamRead } from 'naudiodon';
import { Converter } from 'ffmpeg-stream';
import * as fs from 'fs';
import * as path from 'path';
import AudioRecorder from 'node-audiorecorder';

const mainSox = async () => {
  for (let i = 0; i <= 3; i++) {
    const audioRecorder = startSoXAudioRecorder();
    const p = new Promise(resolve => setTimeout(resolve, 3000));
    await p;
    audioRecorder.stop();
  }
};

const startSoXAudioRecorder = () => {
  const DIRECTORY = __dirname;
  const fileType = 'mp3';
  // Initialize recorder and file stream.
  const audioRecorder = new AudioRecorder(
    {
      program: 'sox',
      bits: 16,
      encoding: 'signed-integer',
      device: null,
      channels: 1,
      rate: SAMPLE_RATE,
      type: fileType,

      silence: 2,
      thresholdStart: 0.5,
      thresholdStop: 0.5,
      keepSilence: true,
    },
    console
  );

  // Create path to write recordings to.
  if (!fs.existsSync(DIRECTORY)) {
    fs.mkdirSync(DIRECTORY);
  }
  // Create file path with random name.
  const fileName = path.join(DIRECTORY, new Date().toISOString().concat(`.${fileType}`));

  console.log('Writing new recording file at: ', fileName);

  // Create write stream.
  const fileStream = fs.createWriteStream(fileName, { encoding: 'binary' });
  // Start and write to the file.
  audioRecorder.start().stream()?.pipe(fileStream);

  // Log information on the following events
  audioRecorder.stream()?.on('close', function (code) {
    console.warn('Recording closed. Exit code: ', code);
  });
  audioRecorder.stream()?.on('end', function () {
    console.warn('Recording ended.');
    // process.stdin.end();
  });
  audioRecorder.stream()?.on('error', function () {
    console.warn('Recording error.');
  });
  /*/ Write incoming data out the console.
  audioRecorder.stream().on('data', function(chunk) {
    console.log(chunk);
  });*/

  // Keep process alive.
  // process.stdin.resume();

  // setTimeout(() => audioRecorder.stop(), 3000);

  // console.warn('Press ctrl+c to exit.');

  return audioRecorder;
};

const mainNaudiodonFFMPEG = async () => {
  const recordStream = getRecordNaudiodonAudioStream();

  const { converter } = getAudioStreamFFMPEGConverter(recordStream);
  converter.run();
  // console.log('Converter run');

  const streamSaver = saveStream(recordStream);
  console.log('Stream record started');

  recordStream.start();
  console.log('Stream started');

  // setTimeout(
  //   () =>
  //     recordStream.quit(() => {
  //       // converter.kill();
  //       // streamSaver.close();
  //       console.log('quit stream');
  //     }),
  //   3000
  // );
};

const saveStream = (stream: IoStreamRead, filepath = 'rawAudio.raw') => {
  // Create a write stream to write out to a raw audio file
  const ws = fs.createWriteStream(filepath);
  stream.pipe(ws);
  return ws;
};

const SAMPLE_RATE = 44100;
const CHANNEL_COUNT = 2;

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

const getDefaultDevice = () => {
  return getDevices().find(
    ({ defaultSampleRate, maxInputChannels }) =>
      defaultSampleRate >= SAMPLE_RATE && maxInputChannels >= CHANNEL_COUNT
  );
};

mainSox();
