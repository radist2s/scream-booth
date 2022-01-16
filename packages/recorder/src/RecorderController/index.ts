import SerialPort from 'serialport';
import Firmata from 'firmata';
import { config } from 'dotenv';
import Board from 'firmata';
import debugDefault from 'debug';
import { debounce } from 'lodash';

const debug = debugDefault('scream-booth:controller');

config();

const initController = () => {
  const { SCREAM_BOOTH_CONTROLLER_PORT, SCREAM_BOOTH_CONTROLLER_PORT_SPEED } = process.env;

  if (!SCREAM_BOOTH_CONTROLLER_PORT)
    throw new Error('No environment variable SCREAM_BOOTH_CONTROLLER_PORT specified');

  debug('Serial setup', { SCREAM_BOOTH_CONTROLLER_PORT_SPEED, SCREAM_BOOTH_CONTROLLER_PORT });

  const serialPort = new SerialPort(SCREAM_BOOTH_CONTROLLER_PORT, {
    baudRate: SCREAM_BOOTH_CONTROLLER_PORT_SPEED
      ? Number(SCREAM_BOOTH_CONTROLLER_PORT_SPEED)
      : 115200,
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

  const { SCREAM_BOOTH_CONTROLLER_BUTTON_READ_PIN } = process.env;
  const BUTTON_READ_PIN = SCREAM_BOOTH_CONTROLLER_BUTTON_READ_PIN
    ? Number(SCREAM_BOOTH_CONTROLLER_BUTTON_READ_PIN)
    : 9;

  board.pinMode(BUTTON_READ_PIN, Board.PIN_MODE.PULLUP);

  const { SCREAM_BOOTH_CONTROLLER_BUTTON_DEBOUNCE_TIME } = process.env;
  const buttonDebounceTime = SCREAM_BOOTH_CONTROLLER_BUTTON_DEBOUNCE_TIME
    ? Number(SCREAM_BOOTH_CONTROLLER_BUTTON_DEBOUNCE_TIME)
    : 3000;

  const debounceDeactivate = debounce(deactivate, buttonDebounceTime, { leading: false });

  board.digitalRead(BUTTON_READ_PIN, (data: number) => {
    const state = data ? 'inactive' : 'active';
    debug(`Button state is [${state}]`);
    if (state === 'active') {
      debounceDeactivate.cancel();
      activate();
    } else {
      debounceDeactivate();
    }
  });

  return initButtonLight(board);
};

const initButtonLight = (board: Firmata) => {
  const {
    SCREAM_BOOTH_CONTROLLER_BUTTON_LIGHT_PIN,
    SCREAM_BOOTH_CONTROLLER_BUTTON_INVERTED_LIGHT_PIN,
  } = process.env;
  const lightPin = SCREAM_BOOTH_CONTROLLER_BUTTON_LIGHT_PIN
    ? Number(SCREAM_BOOTH_CONTROLLER_BUTTON_LIGHT_PIN)
    : 12;

  const lightInvertedPin = SCREAM_BOOTH_CONTROLLER_BUTTON_INVERTED_LIGHT_PIN
    ? Number(SCREAM_BOOTH_CONTROLLER_BUTTON_INVERTED_LIGHT_PIN)
    : 11;

  const lightHelperPin = 13;

  board.pinMode(lightPin, Board.PIN_MODE.OUTPUT);
  board.pinMode(lightHelperPin, Board.PIN_MODE.OUTPUT);
  board.pinMode(lightInvertedPin, Board.PIN_MODE.OUTPUT);

  const handlers = {
    buttonLightOn() {
      debug('buttonLightOn');
      board.digitalWrite(lightPin, Board.PIN_STATE.LOW);
      board.digitalWrite(lightHelperPin, Board.PIN_STATE.HIGH);
      board.digitalWrite(lightInvertedPin, Board.PIN_STATE.HIGH);
    },
    buttonLightOff() {
      debug('buttonLightOff');
      board.digitalWrite(lightPin, Board.PIN_STATE.HIGH);
      board.digitalWrite(lightHelperPin, Board.PIN_STATE.LOW);
      board.digitalWrite(lightInvertedPin, Board.PIN_STATE.LOW);
    },
  } as const;

  handlers.buttonLightOff();

  return handlers;
};
