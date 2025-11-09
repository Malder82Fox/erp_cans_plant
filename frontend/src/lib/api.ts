import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onLogout: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false
});

function performRefresh(): Promise<string | null> {
  if (!refreshToken) {
    return Promise.resolve(null);
  }
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post("/auth/refresh", { refresh_token: refreshToken })
      .then((response) => {
        const data = response.data as { access_token: string; refresh_token?: string };
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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      refreshToken &&
      original &&
      !original._retry &&
      !original.url?.endsWith("/auth/login")
    ) {
      original._retry = true;
      try {
        const newAccess = await performRefresh();
        if (!newAccess) {
          throw error;
        }
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newAccess}`;
        } else {
          original.headers = { Authorization: `Bearer ${newAccess}` };
        }
        return apiClient(original);
      } catch (refreshError) {
        if (onLogout) {
          onLogout();
        }
        throw refreshError;
      }
    }
    return Promise.reject(error);
  }
);

export function setAuthTokens(tokens: { accessToken: string | null; refreshToken: string | null }): void {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}

export function setLogoutHandler(handler: (() => void) | null): void {
  onLogout = handler;
}

export function clearAuthTokens(): void {
  accessToken = null;
  refreshToken = null;
}

export function buildPaginationQuery(params: { page?: number; pageSize?: number; q?: string | null }): URLSearchParams {
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
