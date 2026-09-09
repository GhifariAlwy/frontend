import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export interface FieldError {
  field?: string;
  message: string;
}
export interface Envelope<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: FieldError[];
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<Envelope<{ access_token: string }>>(
        `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/auth/refresh`,
        undefined,
        { withCredentials: true },
      )
      .then((response) => {
        const token = response.data.data?.access_token ?? null;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
  if (
    error.response?.status !== 401 ||
    !request ||
    request._retry ||
    request.url?.includes('/auth/refresh')
  )
    return Promise.reject(error);
  request._retry = true;
  const token = await refreshAccessToken();
  if (!token) return Promise.reject(error);
  request.headers.Authorization = `Bearer ${token}`;
  return apiClient(request);
});

export async function apiRequest<T>(config: Parameters<AxiosInstance['request']>[0]): Promise<T> {
  const response = await apiClient.request<Envelope<T>>(config);
  if (!response.data.success || response.data.data === null)
    throw new Error(response.data.message || 'Permintaan gagal');
  return response.data.data;
}
