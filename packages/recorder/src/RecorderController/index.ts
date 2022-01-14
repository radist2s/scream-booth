import SerialPort from 'serialport';
import Firmata from 'firmata';
import { config } from 'dotenv';
import Board from 'firmata';
import debugDefault from 'debug';
import { debounce } from 'lodash';

const debug = debugDefault('scream-booth:controller');

config();

const initController = () => {
  const { SCREAM_BOX_CONTROLLER_PORT, SCREAM_BOX_CONTROLLER_PORT_SPEED } = process.env;

  if (!SCREAM_BOX_CONTROLLER_PORT)
    throw new Error('No environment variable SCREAM_BOX_CONTROLLER_PORT specified');

  debug('Serial setup', { SCREAM_BOX_CONTROLLER_PORT_SPEED, SCREAM_BOX_CONTROLLER_PORT });

  const serialPort = new SerialPort(SCREAM_BOX_CONTROLLER_PORT, {
    baudRate: SCREAM_BOX_CONTROLLER_PORT_SPEED ? Number(SCREAM_BOX_CONTROLLER_PORT_SPEED) : 115200,
  });

  return new Promise<Firmata>((resolve, reject) => {
    const firmata = new Firmata(serialPort, error => {
      if (error) {
        reject(error);
      } else {
        resolve(firmata);
      }
    });
  });
};

export const getSerialPortButton = async ({
  onActivate,
  onDeactivate,
}: {
  onActivate: () => void;
  onDeactivate: () => void;
}) => {
  const board = await initController();

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

  const { SCREAM_BOX_CONTROLLER_BUTTON_READ_PIN } = process.env;
  const BUTTON_READ_PIN = SCREAM_BOX_CONTROLLER_BUTTON_READ_PIN
    ? Number(SCREAM_BOX_CONTROLLER_BUTTON_READ_PIN)
    : 9;

  board.pinMode(BUTTON_READ_PIN, Board.PIN_MODE.PULLUP);

  const { SCREAM_BOX_CONTROLLER_BUTTON_DEBOUNCE_TIME } = process.env;
  const buttonDebounceTime = SCREAM_BOX_CONTROLLER_BUTTON_DEBOUNCE_TIME
    ? Number(SCREAM_BOX_CONTROLLER_BUTTON_DEBOUNCE_TIME)
    : 3000;

  const debounceChange = debounce(
    (data: number) => {
      const state = data ? 'inactive' : 'active';
      debug({ state });
      if (state === 'active') {
        activate();
      } else {
        deactivate();
      }
    },
    buttonDebounceTime,
    { leading: true }
  );

  board.digitalRead(BUTTON_READ_PIN, debounceChange);

  const { SCREAM_BOX_CONTROLLER_BUTTON_LIGHT_PIN } = process.env;
  const BUTTON_LIGHT_PIN = SCREAM_BOX_CONTROLLER_BUTTON_LIGHT_PIN
    ? Number(SCREAM_BOX_CONTROLLER_BUTTON_LIGHT_PIN)
    : 13;

  board.pinMode(BUTTON_LIGHT_PIN, Board.PIN_MODE.OUTPUT);
  board.digitalWrite(BUTTON_LIGHT_PIN, Board.PIN_STATE.LOW);

  return {
    buttonLightOn() {
      board.digitalWrite(BUTTON_LIGHT_PIN, Board.PIN_STATE.HIGH);
    },
    buttonLightOff() {
      board.digitalWrite(BUTTON_LIGHT_PIN, Board.PIN_STATE.LOW);
    },
  } as const;
};
