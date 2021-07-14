#!/usr/bin/env node

import { AppConfig } from './types';
import { APP_TITLE } from './config';
import { UI } from './ui';
import { FS } from './fs';

export class WNotes {
  config: AppConfig;

  fs: FS;
  ui: UI;

  init = async (): Promise<void> => {
    this.setAppTitle(APP_TITLE);

    this.fs = new FS();
    await this.fs.init(this);

    this.ui = new UI();
    await this.ui.start(this);
  };

  setAppTitle = (title: string): boolean =>
    process.stdout.write(
      String.fromCharCode(27) + ']0;' + title + String.fromCharCode(7)
    );
}

const wnotes = new WNotes();
wnotes.init();
