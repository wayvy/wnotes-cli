import fs from 'fs/promises';

import { initConfig, ENCODING, PLUS_KEY } from './config';
import { WNotes } from './wnotes-cli';

const WNOTE_PATH = `${process.env.HOME}/.wnotes`;
const CONFIG_PATH = `${WNOTE_PATH}/config.json`;
const NOTES_PATH = `${WNOTE_PATH}/notes`;

export class FS {
  app: WNotes;

  init = async (app: WNotes): Promise<void> => {
    this.app = app;
    await this.initAppDir();
    await this.initAppConfig();

    await this.initGroupsDirs();

    await this.initNotesDir();
  };

  initAppDir = async (): Promise<void> => {
    try {
      await fs.readdir(WNOTE_PATH);
    } catch (error) {
      await this.createAppDir();
    }
  };

  createAppDir = async (): Promise<void> => {
    await fs.mkdir(WNOTE_PATH);
  };

  initAppConfig = async (): Promise<void> => {
    try {
      const rawConfig = await fs.readFile(CONFIG_PATH, ENCODING);
      this.app.config = JSON.parse(rawConfig);
    } catch (error) {
      await this.createAppConfig();
    }
  };

  createAppConfig = async (): Promise<void> => {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(initConfig));
    this.app.config = initConfig;
  };

  initNotesDir = async (): Promise<void> => {
    try {
      await fs.readdir(NOTES_PATH);
    } catch (error) {
      await this.createNotesDir();
    }
  };

  createNotesDir = async (): Promise<void> => {
    await fs.mkdir(NOTES_PATH);
  };

  initGroupsDirs = async (): Promise<void> => {
    Object.keys(this.app.config.groups).forEach(async (key) => {
      await this.initGroupDir(key);
    });
  };

  initGroupDir = async (key: string): Promise<void> => {
    try {
      await fs.readdir(`${NOTES_PATH}/${key}`);
    } catch (error) {
      await this.createGroupDir(key);
    }
  };

  createGroupDir = async (key: string): Promise<void> => {
    if (key === PLUS_KEY) {
      return;
    }
    await fs.mkdir(`${NOTES_PATH}/${key}`);
  };

  updateGroups = async (): Promise<void> => {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(this.app.config));
    await this.initGroupsDirs();
    this.app.ui.debug = 'updateGroups';
  };

  saveNote = async (): Promise<void> => {
    await fs.writeFile(
      `${NOTES_PATH}/${this.app.ui.activeGroupKey}/${this.app.ui.activeNoteKey}.txt`,
      this.app.ui.state.input
    );
    this.app.ui.state.input = '';
    this.app.ui.debug = 'saveNote';
  };

  createNote = async (): Promise<void> => {
    await fs.writeFile(
      `${NOTES_PATH}/${this.app.ui.activeGroupKey}/${this.app.ui.activeNoteKey}.txt`,
      ''
    );
    this.app.ui.debug = 'createNote';
  };

  openNote = async (): Promise<string> => {
    const note = await fs.readFile(
      `${NOTES_PATH}/${this.app.ui.activeGroupKey}/${this.app.ui.activeNoteKey}.txt`,
      ENCODING
    );
    return note;
  };

  removeGroup = async (): Promise<void> => {
    await fs.rmdir(`${NOTES_PATH}/${this.app.ui.activeGroupKey}`, {
      recursive: true,
    });
  };

  removeNote = async (): Promise<void> => {
    await fs.unlink(
      `${NOTES_PATH}/${this.app.ui.activeGroupKey}/${this.app.ui.activeNoteKey}.txt`
    );
  };
}
