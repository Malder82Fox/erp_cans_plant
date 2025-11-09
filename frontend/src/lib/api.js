import axios from "axios";
let accessToken = null;
let refreshToken = null;
let onLogout = null;
let refreshPromise = null;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
export const apiClient = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: false
});
function performRefresh() {
    if (!refreshToken) {
        return Promise.resolve(null);
    }
    if (!refreshPromise) {
        refreshPromise = apiClient
            .post("/auth/refresh", { refresh_token: refreshToken })
            .then((response) => {
            const data = response.data;
            accessToken = data.access_token;
            if (data.refresh_token) {
                refreshToken = data.refresh_token;
            }
            return accessToken;
        })
            .catch((error) => {
            accessToken = null;
            refreshToken = null;
            if (onLogout) {
                onLogout();
            }
            throw error;
        })
            .finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}
apiClient.interceptors.request.use((config) => {
    if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});
apiClient.interceptors.response.use((response) => response, async (error) => {
    const original = error.config;
    if (error.response?.status === 401 &&
        refreshToken &&
        original &&
        !original._retry &&
        !original.url?.endsWith("/auth/login")) {
        original._retry = true;
        try {
            const newAccess = await performRefresh();
            if (!newAccess) {
                throw error;
            }
            if (original.headers) {
                original.headers.Authorization = `Bearer ${newAccess}`;
            }
            else {
                original.headers = { Authorization: `Bearer ${newAccess}` };
            }
            return apiClient(original);
        }
        catch (refreshError) {
            if (onLogout) {
                onLogout();
            }
            throw refreshError;
        }
    }
    return Promise.reject(error);
});
export function setAuthTokens(tokens) {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
}
export function setLogoutHandler(handler) {
    onLogout = handler;
}
export function clearAuthTokens() {
    accessToken = null;
    refreshToken = null;
}
export function buildPaginationQuery(params) {
    const searchParams = new URLSearchParams();
    if (params.page) {
        searchParams.set("page", String(params.page));
    }
    if (params.pageSize) {
        searchParams.set("page_size", String(params.pageSize));
    }
    if (params.q) {
        searchParams.set("q", params.q);
    }
    return searchParams;
}
