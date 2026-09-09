import { apiRequest, setAccessToken } from './client';
import type { AuthData, Menu, User } from '../types/api';
export interface RegisterInput {
  nik: string;
  nama: string;
  email: string;
}
export interface LoginInput {
  identifier: string;
  password: string;
  channel: 'PUBLIK' | 'INTERNAL';
  remember_me?: boolean;
}
export const register = (data: RegisterInput) =>
  apiRequest<{ user_id: number; email: string }>({ method: 'POST', url: '/auth/register', data });
export async function login(data: LoginInput): Promise<AuthData> {
  const result = await apiRequest<AuthData>({ method: 'POST', url: '/auth/login', data });
  setAccessToken(result.access_token);
  return result;
}
export const me = () => apiRequest<User>({ method: 'GET', url: '/auth/me' });
export const menus = () => apiRequest<Menu[]>({ method: 'GET', url: '/auth/my-menus' });
export const verifyEmail = (token: string) =>
  apiRequest<null>({ method: 'GET', url: '/auth/verify-email', params: { token } });
