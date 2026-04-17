const rxjsGlobal = globalThis.rxjs;

if (!rxjsGlobal) {
  throw new Error("rxjs UMD bundle did not load before the module graph started.");
}

export const Observable = rxjsGlobal.Observable;
export const Subject = rxjsGlobal.Subject;
export const TimeoutError = rxjsGlobal.TimeoutError;
export const filter = rxjsGlobal.filter;
export const take = rxjsGlobal.take;
export const Subscription = rxjsGlobal.Subscription;
export default rxjsGlobal;
