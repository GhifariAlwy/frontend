import { apiRequest } from './client';
import type { InterviewQueue, Registration, VerificationQueue } from '../types/api';

export const verificationQueue = (params?: { search?: string; beasiswa_id?: number }) =>
  apiRequest<VerificationQueue>({ method: 'GET', url: '/verifikasi/antrian', params });
export const verificationDetail = (id: number) =>
  apiRequest<Registration>({ method: 'GET', url: `/verifikasi/${id}` });
export const decideVerification = (id: number, data: unknown) =>
  apiRequest<unknown>({ method: 'POST', url: `/verifikasi/${id}/keputusan`, data });
export const interviewQueue = (params?: { search?: string; beasiswa_id?: number }) =>
  apiRequest<InterviewQueue>({ method: 'GET', url: '/wawancara/antrian', params });
export const scoreInterview = (
  id: number,
  data: {
    nilai_komunikasi: number;
    nilai_teknis: number;
    nilai_komitmen: number;
    status: 'LULUS' | 'TIDAK_LULUS';
    catatan_evaluasi: string;
  },
) => apiRequest<unknown>({ method: 'POST', url: `/wawancara/${id}/penilaian`, data });
