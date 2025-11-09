const STORAGE_KEY = "erp.auth";
export function saveTokens(tokens) {
    if (tokens.accessToken && tokens.refreshToken) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    }
    else {
        localStorage.removeItem(STORAGE_KEY);
    }
}
export function loadTokens() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { accessToken: null, refreshToken: null };
        }
        const parsed = JSON.parse(raw);
        return {
            accessToken: parsed.accessToken ?? null,
            refreshToken: parsed.refreshToken ?? null
        };
    }
    catch {
        return { accessToken: null, refreshToken: null };
    }
}
export function clearTokensStorage() {
    localStorage.removeItem(STORAGE_KEY);
}
