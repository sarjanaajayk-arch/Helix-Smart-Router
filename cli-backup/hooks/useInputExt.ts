import { useEffect } from 'react';
import { useStdin } from 'ink';
import { parseKeypress, nonAlphanumericKeys } from './parseKeypress.js';

interface ExtendedKey {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  pageUp: boolean;
  pageDown: boolean;
  return: boolean;
  escape: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  home: boolean;
  end: boolean;
}

interface UseInputExtOptions {
  isActive?: boolean;
}

const useInputExt = (
  inputHandler: (input: string, key: ExtendedKey) => void,
  options: UseInputExtOptions = {}
) => {
  const { stdin, setRawMode, internal_exitOnCtrlC, internal_eventEmitter } = useStdin();

  useEffect(() => {
    if (options.isActive === false) {
      return;
    }

    setRawMode(true);

    return () => {
      setRawMode(false);
    };
  }, [options.isActive, setRawMode]);

  useEffect(() => {
    if (options.isActive === false) {
      return;
    }

    const handleData = (data: Buffer | string) => {
      const keypress = parseKeypress(data);

      const key: ExtendedKey = {
        upArrow: keypress.name === 'up',
        downArrow: keypress.name === 'down',
        leftArrow: keypress.name === 'left',
        rightArrow: keypress.name === 'right',
        pageDown: keypress.name === 'pagedown',
        pageUp: keypress.name === 'pageup',
        return: keypress.name === 'return',
        escape: keypress.name === 'escape',
        ctrl: keypress.ctrl,
        shift: keypress.shift,
        tab: keypress.name === 'tab',
        backspace: keypress.name === 'backspace',
        delete: keypress.name === 'delete',
        home:
          keypress.name === 'home' ||
          keypress.name === '[H' ||
          keypress.name === 'OH' ||
          keypress.name === '[1~' ||
          keypress.name === '[7~',
        end:
          keypress.name === 'end' ||
          keypress.name === '[F' ||
          keypress.name === 'OF' ||
          keypress.name === '[4~' ||
          keypress.name === '[8~',
        meta: keypress.meta || keypress.name === 'escape' || keypress.option,
      };

      let input = keypress.ctrl ? keypress.name : keypress.sequence;
      if (nonAlphanumericKeys.includes(keypress.name)) {
        input = '';
      }

      if (!(input === 'c' && key.ctrl) || !internal_exitOnCtrlC) {
        inputHandler(input, key);
      }
    };

    internal_eventEmitter?.on('input', handleData);

    return () => {
      internal_eventEmitter?.removeListener('input', handleData);
    };
  }, [options.isActive, stdin, internal_exitOnCtrlC, inputHandler]);
};

export { useInputExt };
export type { ExtendedKey };