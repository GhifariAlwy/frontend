import { apiRequest } from './client';
import type { Beasiswa } from '../types/api';
export const activeScholarships = () =>
  apiRequest<Beasiswa[]>({ method: 'GET', url: '/beasiswa/aktif' });
