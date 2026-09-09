import { apiClient, apiRequest } from './client';
import type { Registration } from '../types/api';

export const mine = () =>
  apiRequest<Registration | null>({ method: 'GET', url: '/pendaftaran/saya' });
export const create = (beasiswa_id: number) =>
  apiRequest<Registration>({ method: 'POST', url: '/pendaftaran', data: { beasiswa_id } });
export const saveSection = (id: number, section: number, data: unknown) =>
  apiRequest<Registration>({ method: 'PUT', url: `/pendaftaran/${id}/section/${section}`, data });
export const submit = (id: number) =>
  apiRequest<Registration>({ method: 'POST', url: `/pendaftaran/${id}/submit` });

export async function uploadDocument(
  file: File,
  kodePendaftaran: string,
  persyaratanId: number,
  onUploadProgress?: (progress: number) => void,
): Promise<{ dokumen_uuid: string; nama_file_asli?: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('kode_pendaftaran', kodePendaftaran);
  form.append('persyaratan_id', String(persyaratanId));
  const response = await apiClient.post<{
    data: { dokumen_uuid: string; nama_file_asli?: string };
  }>('/dokumen/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) =>
      onUploadProgress?.(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
  });
  return response.data.data;
}
