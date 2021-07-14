export type XY = [number, number];
export type XYObj = {
  x: number;
  y: number;
};

export enum ModeEnum {
  normal,
  note,
  createGroup,
  createNote,
  command,
}

export type UIState = {
  group: {
    index: number;
  };
  notes: {
    index: number;
  };
  mode: ModeEnum;
  input: string;
  cmdInput: string;
};

export type Groups = {
  [key: string]: string[];
};

type PackageInfo = {
  name: string;
  version: string;
};

export type AppConfig = {
  pkg: PackageInfo;
  groups: Groups;
};
