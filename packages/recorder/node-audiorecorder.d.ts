declare module 'node-audiorecorder' {
  import { EventEmitter } from 'events';

  class AudioRecorder extends EventEmitter {
    constructor(options?: ArecordOptions | SoxOptions, logger?: typeof console);

    start(...args: any[]): AudioRecorder;

    stop(...args: any[]): AudioRecorder;

    stream(...args: any[]): undefined | NodeJS.ReadableStream;
  }

  interface BaseOptions {
    device: null | string; // Recording device to use, e.g. `hw:1,0`
    driver: null | string; // Recording driver to use
    channels: number; // Channel count. (example: 1)
    rate: number; // Sample rate. (example: 16000)
    type: string; // Format type. (example: wav)
  }

  type SoxOptionsBase = BaseOptions & {
    program: `rec` | `sox`; // Which program to use, either `arecord`, `rec`, or `sox`.
    bits: number; // Sample size (example: 16). (only for `rec` and `sox`)
    encoding?: string; // Encoding type. (example: signed-integer) (only for `rec` and `sox`)
  };

  type SoxOptions =
    | SoxOptionsBase
    | (SoxOptionsBase & {
        silence: number; // Duration of silence in seconds before it stops recording. (example: 2)
        thresholdStart: number; // Silence threshold to start recording. (example: 0.5)
        thresholdStop: number; // Silence threshold to stop recording. (example: 0.5)
        keepSilence: boolean; // Keep the silence in the recording.
      });

  interface ArecordOptions extends BaseOptions {
    program: `arecord`;
    format: string; // Encoding type. (example: S16_LE) (only for `arecord`)
  }

  export default AudioRecorder;
}
