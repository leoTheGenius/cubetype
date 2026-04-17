const aesjsGlobal = globalThis.aesjs;

if (!aesjsGlobal) {
  throw new Error("aes-js script did not load before the module graph started.");
}

export const AES = aesjsGlobal.AES;
export const Counter = aesjsGlobal.Counter;
export const ModeOfOperation = aesjsGlobal.ModeOfOperation;
export const utils = aesjsGlobal.utils;
export const padding = aesjsGlobal.padding;
export default aesjsGlobal;
