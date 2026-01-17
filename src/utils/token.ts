// src/utils/token.ts
let memoryAccess: string | null = null;
let memoryRefresh: string | null = null;
let memoryUser: unknown | null = null;

const ACCESS_KEY = "lms_access_token";
const REFRESH_KEY = "lms_refresh_token";
const USER_KEY = "lms_user";

const isBrowser = () => typeof window !== "undefined";

function safeParse<T = unknown>(raw: string | null): T | null {
  if (!raw) return null;
  // Guard against common bad writes
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "undefined" || trimmed === "null")
    return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Corrupted value – purge it to prevent infinite crashes
    if (isBrowser()) localStorage.removeItem(USER_KEY);
    return null;
  }
}

export const setAccessToken = (token: string | null) => {
  memoryAccess = token;
  if (!isBrowser()) return;
  if (token) localStorage.setItem(ACCESS_KEY, token);
  else localStorage.removeItem(ACCESS_KEY);
};

export const getAccessToken = (): string | null => {
  if (memoryAccess) return memoryAccess;
  if (!isBrowser()) return null;
  const t = localStorage.getItem(ACCESS_KEY);
  memoryAccess = t;
  return t;
};

export const setRefreshToken = (token: string | null) => {
  memoryRefresh = token;
  if (!isBrowser()) return;
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
};

export const getRefreshToken = (): string | null => {
  if (memoryRefresh) return memoryRefresh;
  if (!isBrowser()) return null;
  const t = localStorage.getItem(REFRESH_KEY);
  memoryRefresh = t;
  return t;
};

export const clearTokens = () => {
  memoryAccess = null;
  memoryRefresh = null;
  memoryUser = null;
  if (isBrowser()) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export const setUser = (user: unknown | null | undefined) => {
  memoryUser = user ?? null;
  if (!isBrowser()) return;
  // Don’t serialize undefined/null – remove instead
  if (user === undefined || user === null) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getCurrentUser = <T = any>(): T | null => {
  if (memoryUser !== undefined && memoryUser !== null) return memoryUser as T;
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(USER_KEY);
  const parsed = safeParse<T>(raw);
  memoryUser = parsed;
  return parsed;
};
