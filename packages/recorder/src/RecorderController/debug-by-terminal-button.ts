import readline from 'readline';

export const debugByTerminalButton = ({
  onActivate,
  onDeactivate,
}: {
  onActivate: () => void;
  onDeactivate: () => void;
}) => {
  let isActivated = false;
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  } else {
    console.warn('Warning, impossible to read keypress due to not being in TTY mode');
  }

  process.stdin.on(
    'keypress',
    (
      str,
      key?: { sequence: string; name: string; ctrl: boolean; meta: boolean; shift: boolean }
    ) => {
      if (key?.shift && key.name === 'r') {
        if (isActivated) return;
        onActivate();
        isActivated = true;
      } else if (key?.shift && key.name === 's') {
        if (!isActivated) return;
        onDeactivate();
        isActivated = false;
      } else if (key?.ctrl && key.name === 'c') {
        console.log('Exiting...');
        onDeactivate();
        process.exit(0);
      }
    }
  );

  // Keep process alive.
  // process.stdin.resume();

  console.warn('Press Shift + R to start record.');
  console.warn('Press Shift + S to stop recording.');
};
