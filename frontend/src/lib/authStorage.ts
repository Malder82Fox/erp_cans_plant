const STORAGE_KEY = "erp.auth";

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export function saveTokens(tokens: StoredTokens): void {
  if (tokens.accessToken && tokens.refreshToken) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function loadTokens(): StoredTokens {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { accessToken: null, refreshToken: null };
    }
    const parsed = JSON.parse(raw) as StoredTokens;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

export function clearTokensStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
