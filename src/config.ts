import { AppConfig, ModeEnum, UIState } from './types';

const pkg = require('../package.json');

export const APP_TITLE = 'wnotes';
export const NEW_LINE = '\n';
export const SPACE = ' ';
export const ENCODING = 'utf8';
export const PLUS_KEY = '[+]';
export const COMMAND_KEY = ':';

export const initConfig: AppConfig = {
  pkg: {
    name: pkg.name,
    version: pkg.version,
  },
  groups: {
    [PLUS_KEY]: [],
  },
};

export const initUiState: UIState = {
  group: {
    index: 0,
  },
  notes: {
    index: 0,
  },
  input: '',
  cmdInput: '',
  mode: ModeEnum.normal,
};

export const unicode = {
  enter: '\u000d',
  exit: '\u0003',
  backspace: '\u007F',
  esc: '\u001B',
};

export const colors = {
  reset: 0,
  bright: 1,
  dim: 2,
  underscore: 4,
  blink: 5,
  reverse: 7,
  hidden: 8,

  fg: {
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
  },

  bg: {
    black: 40,
    red: 41,
    green: 42,
    yellow: 43,
    blue: 44,
    magenta: 45,
    cyan: 46,
    white: 47,
  },
};
