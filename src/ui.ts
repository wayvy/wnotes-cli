import {
  initUiState,
  unicode,
  colors,
  NEW_LINE,
  SPACE,
  ENCODING,
  PLUS_KEY,
} from './config';
import { WNotes } from './wnotes-cli';
import { XY, XYObj, UIState, ModeEnum, Groups } from './types';
import { isNameKey, hasNumber } from './utils';

const getTerminalSize = (): XY => [process.stdout.columns, process.stdout.rows];

export class UI {
  app: WNotes;

  state: UIState = initUiState;

  terminalSize: XY;
  filledPosition: XY;
  heapUsed: number;
  debug: string | Buffer = '_';

  start = (app: WNotes): void => {
    this.app = app;
    this.initStdin();
    this.screen();
  };

  initStdin = (): void => {
    process.stdout.on('resize', this.screen);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding(ENCODING);
    process.stdin.on('data', async (key) => {
      this.debug = key;
      await this.navigation(key.toString());
      this.screen();
    });
  };

  screen = (): void => {
    this.clear();

    if (this.state.mode === ModeEnum.note) {
      this.printNoteScreen();
      return;
    }

    this.printGroupsList();
    this.printNotesList();
    this.printStatus();
  };

  clear = (): void => {
    this.setSize();
    this.clearPosition();
    this.heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;

    // eslint-disable-next-line no-console
    console.clear();
  };

  printNoteScreen = (): void => {
    this.printText(this.state.input);
  };

  printGroupsList = (): void => {
    this.groupsKeys.forEach(this.printGroupListItem);
    this.nl();
  };

  printGroupListItem = (group: string, index: number): void => {
    if (this.groupsKeys.length - 1 === index) {
      this.setColor(colors.fg.yellow);
      this.setColor(colors.bg.black);
    }

    if (this.state.group.index === index) {
      this.setColor(colors.fg.red);
      this.setColor(colors.bg.blue);
    }

    this.print(group);
    this.setColor();
    this.groupsKeys.length - 1 !== index && this.separator();
  };

  printNotesList = (): void => {
    this.nl();
    this.activeGroupNotes?.forEach(this.printNotesListItem);
  };

  printNotesListItem = (note: string, index: number): void => {
    if (this.state.notes.index === index) {
      this.setColor(colors.fg.red);
      this.setColor(colors.bg.blue);
    }
    this.print(note);
    this.setColor();
    this.activeGroupNotes.length - 1 !== index && this.nl();
  };

  get groups(): Groups {
    return this.app.config.groups;
  }

  get groupsKeys(): string[] {
    return Object.keys(this.groups);
  }
  get activeGroupKey(): string {
    return this.groupsKeys[this.state.group.index];
  }
  get activeNoteKey(): string {
    return this.groups[this.activeGroupKey][this.activeNoteIndex];
  }
  get activeGroupNotes(): string[] {
    return this.groups[this.groupsKeys[this.state.group.index]];
  }
  set activeGroupNotes(notes: string[]) {
    this.groups[this.groupsKeys[this.state.group.index]] = notes;
  }
  get activeNote(): string {
    return this.groups[this.activeGroupKey][this.activeNoteIndex];
  }
  get activeNoteIndex(): number {
    return this.state.notes.index;
  }

  get size(): XYObj {
    return {
      x: this.terminalSize[0],
      y: this.terminalSize[1],
    };
  }

  get position(): XYObj {
    return {
      x: this.filledPosition[0],
      y: this.filledPosition[1],
    };
  }

  setSize = (): XY => (this.terminalSize = getTerminalSize());
  clearPosition = (): XY => (this.filledPosition = [0, 0]);

  navigation = async (key: string): Promise<void> => {
    if (this.state.mode === ModeEnum.createGroup) {
      if (key === unicode.enter) {
        this.endCreateGroup();
        return;
      }
      this.inputCreateGroup(key);
      return;
    }

    if (this.state.mode === ModeEnum.createNote) {
      if (key === unicode.enter) {
        this.endCreateNote();
        return;
      }
      this.inputCreateNote(key);
      return;
    }

    if (this.state.mode === ModeEnum.command) {
      if (key === unicode.enter) {
        this.endCommand();
        return;
      }
      this.inputCommand(key);
      return;
    }

    if (this.state.mode === ModeEnum.note) {
      if (key === unicode.enter) {
        this.nlNote();
        return;
      }
      if (key === unicode.esc) {
        this.handleEsc();
        return;
      }
      this.inputNote(key);
      return;
    }

    switch (key) {
      case unicode.enter:
        this.debug = 'enter';
        await this.handleEnter();
        break;
      case unicode.esc:
        this.debug = 'ESC';
        this.handleEsc();
        break;
      case '\u001B\u005B\u0041':
        this.debug = 'up';
        this.navigateY(-1);
        break;
      case '\u001B\u005B\u0043':
        this.debug = 'right';
        this.navigateX(1);
        break;
      case '\u001B\u005B\u0042':
        this.debug = 'down';
        this.navigateY(1);
        break;
      case '\u001B\u005B\u0044':
        this.debug = 'left';
        this.navigateX(-1);
        break;
      case '\u003A':
        this.debug = ':';
        this.startCommand();
        break;
      case '\u0020':
        this.debug = 'space';
        break;
      case '\u0009':
        this.debug = 'tab';
        break;
      case unicode.backspace:
        this.debug = 'backspace';
        break;
      case unicode.exit:
        process.exit();
        break;
      default:
        break;
    }
  };

  moveIndex = (direction: number, index: number, length: number): number =>
    direction < 0
      ? index > 0
        ? --index
        : length - 1
      : index < length - 1
      ? ++index
      : 0;

  navigateX = (direction = 0): void => {
    if (this.state.mode === ModeEnum.note) {
      return;
    }
    this.state.group.index = this.moveIndex(
      direction,
      this.state.group.index,
      this.groupsKeys.length
    );
    this.state.notes.index = 0;
  };

  navigateY = (direction = 0): void => {
    if (this.state.mode === ModeEnum.note) {
      return;
    }
    this.state.notes.index = this.moveIndex(
      direction,
      this.state.notes.index,
      this.activeGroupNotes.length
    );
  };

  handleEnter = async (): Promise<void> => {
    if (this.activeGroupKey === PLUS_KEY) {
      this.debug = this.activeGroupKey;
      this.startCreateGroup();
      return;
    }

    if (this.activeNote === PLUS_KEY) {
      this.startCreateNote();
      return;
    }

    await this.startNote();
    this.debug = this.state.mode.toString();
  };

  handleEsc = async (): Promise<void> => {
    if (this.state.mode === ModeEnum.note) {
      this.state.mode = ModeEnum.normal;
      await this.app.fs.saveNote();
    }
  };

  startCreateGroup = (): void => {
    this.state.mode = ModeEnum.createGroup;
    this.debug = this.state.mode.toString();
    delete this.groups[PLUS_KEY];
    this.groups[this.state.input + '_'] = [PLUS_KEY];
  };

  inputCreateGroup = (key: string): void => {
    if (!isNameKey(key)) {
      return;
    }
    if (!this.state.input && hasNumber(key)) {
      return;
    }
    delete this.groups[this.state.input + '_'];
    this.state.input += key;
    this.groups[this.state.input + '_'] = [PLUS_KEY];
  };

  endCreateGroup = async (): Promise<void> => {
    delete this.groups[this.state.input + '_'];
    if (!this.state.input) {
      this.groups[PLUS_KEY] = [];
      this.state.input = '';
      this.state.mode = ModeEnum.normal;
      return;
    }
    this.groups[this.state.input] = [PLUS_KEY];
    this.groups[PLUS_KEY] = [];
    this.state.input = '';
    this.state.mode = ModeEnum.normal;

    this.debug = JSON.stringify(this.groups);
    await this.app.fs.updateGroups();
  };

  startCommand = (): void => {
    if (this.state.mode !== ModeEnum.normal) {
      return;
    }
    this.state.mode = ModeEnum.command;
  };

  inputCommand = (key: string): void => {
    if (key === unicode.backspace) {
      this.inputBackspace();
      return;
    }
    if (!isNameKey(key)) {
      return;
    }
    this.state.input += key;
  };

  endCommand = (): void => {
    if (this.state.input === 'groupd') {
      this.app.fs.removeGroup();
      delete this.app.config.groups[this.activeGroupKey];
      this.app.fs.updateGroups();
      this.state.input = '';
      this.state.mode = ModeEnum.normal;
    }
    if (this.state.input === 'noted') {
      this.activeGroupNotes = this.activeGroupNotes.filter(
        (_, index) => index !== this.activeNoteIndex
      );
      this.app.fs.updateGroups();
      this.app.fs.removeNote();
      --this.state.notes.index;
      this.state.input = '';
      this.state.mode = ModeEnum.normal;
    }
    if (this.state.input === 'notes') {
      this.saveNote();
    }
  };

  deleteGroup = (): void => {
    delete this.app.config.groups[this.activeGroupKey];
    this.app.fs.updateGroups();
  };

  deleteNote = (): void => {
    this.activeGroupNotes = this.activeGroupNotes.filter(
      (_, index) => index !== this.activeNoteIndex
    );
    this.app.fs.updateGroups();
    --this.state.notes.index;
  };

  ttyColor = (c: number): string => `\x1b[${c}m`;
  setColor = (c: number = colors.reset): boolean =>
    process.stdout.write(this.ttyColor(c));

  nl = (): void => {
    this.filledPosition[0] = 0;
    process.stdout.write(NEW_LINE);
    this.filledPosition[1]++;
  };
  separator = (): void => this.print(' | ');

  print = (text: string | Buffer): void => {
    process.stdout.write(text);
    this.filledPosition[0] += text.length;
  };

  printText = (text: string): void => {
    for (let ch = 0; ch < text.length; ch++) {
      this.print(text[ch]);
    }
  };

  printSize = (): void =>
    this.print(`size: [${this.size.x.toString()},${this.size.y.toString()}]`);
  printFilledPosition = (): void =>
    this.print(
      `position: [${this.position.x.toString()},${this.position.y.toString()}]`
    );

  printStatus = (): void => {
    this.setColor(colors.bg.white);
    this.setColor(colors.fg.black);

    const fillRows = new Array(this.size.y - this.position.y - 1).join(
      NEW_LINE
    );
    process.stdout.write(fillRows);

    if (this.state.mode === ModeEnum.command) {
      this.print(':' + this.state.input + '_');
      this.fillLine();
      this.nl();
      this.print(this.debug);
      this.fillLine();
      this.setColor();
      return;
    }

    this.print(`${this.heapUsed.toFixed(2)}MB`);
    this.separator();
    this.printSize();
    this.separator();
    this.printFilledPosition();
    this.fillLine();
    this.nl();
    this.print(this.debug);
    this.fillLine();
    this.setColor();
  };

  fillLine = (): boolean =>
    process.stdout.write(new Array(this.size.x - this.position.x).join(SPACE));

  inputBackspace = (): string =>
    (this.state.input = this.state.input.substring(
      0,
      this.state.input.length - 1
    ));

  startCreateNote = (): void => {
    this.state.mode = ModeEnum.createNote;
    this.debug = this.state.mode.toString();
    this.groups[this.activeGroupKey][0] = this.state.input + '_';
  };

  inputCreateNote = (key: string): void => {
    if (key === unicode.backspace) {
      this.inputBackspace();
      return;
    }
    if (!isNameKey(key)) {
      return;
    }
    this.state.input += key;
    this.groups[this.activeGroupKey][0] = this.state.input + '_';
  };

  endCreateNote = async (): Promise<void> => {
    if (!this.state.input) {
      this.state.mode = ModeEnum.normal;
      this.groups[this.activeGroupKey][0] = PLUS_KEY;
      return;
    }
    this.groups[this.activeGroupKey][0] = this.state.input;
    this.groups[this.activeGroupKey] = [
      PLUS_KEY,
      ...this.groups[this.activeGroupKey],
    ];
    this.app.fs.updateGroups();
    this.state.input = '';
    ++this.state.notes.index;
    this.state.mode = ModeEnum.normal;

    await this.app.fs.createNote();
  };

  startNote = async (): Promise<void> => {
    this.state.input = await this.app.fs.openNote();
    this.state.mode = ModeEnum.note;
  };

  inputNote = (key: string): void => {
    this.state.input += key;
  };

  nlNote = (): void => {
    this.state.input += NEW_LINE;
  };

  saveNote = (): void => {
    this.state.input = '';
    this.state.mode = ModeEnum.normal;
  };
}
