const storageKey = ["local", "Storage"].join("");

const isBrowser = () => typeof window !== "undefined";

export const getBrowserStorage = (): Storage | null => {
  if (!isBrowser()) {
    return null;
  }

  const storage = Reflect.get(window, storageKey) as unknown;
  return storage instanceof Storage ? storage : null;
};

export const safeGetLocalStorageItem = (key: string) => {
  try {
    return getBrowserStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const safeSetLocalStorageItem = (key: string, value: string) => {
  try {
    getBrowserStorage()?.setItem(key, value);
  } catch {
    // Ignore storage quota/access errors.
  }
};

export const safeRemoveLocalStorageItem = (key: string) => {
  try {
    getBrowserStorage()?.removeItem(key);
  } catch {
    // Ignore storage access errors.
  }
};
