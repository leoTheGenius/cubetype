const lzString = globalThis.LZString;

if (!lzString) {
  throw new Error("lz-string script did not load before the module graph started.");
}

export const decompressFromEncodedURIComponent = lzString.decompressFromEncodedURIComponent.bind(lzString);
export default lzString;
