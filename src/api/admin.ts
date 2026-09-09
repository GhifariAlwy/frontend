import { apiClient, apiRequest } from './client';
import type { Beasiswa } from '../types/api';
type ListResult<T> = {
  items: T[];
  pagination?: { page: number; limit: number; total: number; total_pages: number };
};
export interface AdminRecord {
  id: number;
  [key: string]: unknown;
}
export const dashboard = () =>
  apiRequest<Record<string, number>>({ method: 'GET', url: '/dashboard/statistik' });
export const results = (params?: Record<string, string | number>) =>
  apiRequest<ListResult<AdminRecord>>({ method: 'GET', url: '/hasil-seleksi', params });
export const exportResults = () => apiClient.get('/hasil-seleksi/export', { responseType: 'blob' });
export const scholarships = (params?: Record<string, string | number>) =>
  apiRequest<ListResult<Beasiswa>>({ method: 'GET', url: '/beasiswa', params });
export const requirements = (params?: Record<string, string | number>) =>
  apiRequest<ListResult<AdminRecord>>({ method: 'GET', url: '/persyaratan', params });
export const users = (params?: Record<string, string | number>) =>
  apiRequest<ListResult<AdminRecord>>({ method: 'GET', url: '/users', params });
export const roles = () => apiRequest<ListResult<AdminRecord>>({ method: 'GET', url: '/roles' });
export const menus = () => apiRequest<ListResult<AdminRecord>>({ method: 'GET', url: '/menus' });
export const createRecord = (endpoint: string, data: unknown) =>
  apiRequest<AdminRecord>({ method: 'POST', url: endpoint, data });
export const updateRecord = (endpoint: string, id: number, data: unknown) =>
  apiRequest<AdminRecord>({ method: 'PUT', url: `${endpoint}/${id}`, data });
export const deleteRecord = (endpoint: string, id: number) =>
  apiRequest<null>({ method: 'DELETE', url: `${endpoint}/${id}` });
export const updateRoleAccess = (id: number, data: unknown) =>
  apiRequest<unknown>({ method: 'PUT', url: `/roles/${id}/menu-access`, data });
