const nameKeyRegex = new RegExp(/^[0-9a-zA-Z ... ]+$/);
export const isNameKey = (text: string): boolean => nameKeyRegex.test(text);

const numberRegex = new RegExp(/\d/);
export const hasNumber = (text: string): boolean => numberRegex.test(text);
