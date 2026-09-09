export type Role = 'CALON_PESERTA' | 'VERIFIKATOR' | 'LEMBAGA_SELEKSI' | 'ADMIN';
export interface User {
  id: number;
  nama: string;
  username: string;
  email: string;
  role: Role;
}
export interface Menu {
  id: number;
  parent_id: number | null;
  nama: string;
  path: string;
  icon: string | null;
  urutan: number;
}
export interface Beasiswa {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
  persyaratan_khusus: string | null;
  kuota: number;
  metode: string;
  tanggal_buka: string;
  tanggal_tutup: string;
  status?: string;
}
export interface AuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}
export interface Requirement {
  id: number;
  nama_dokumen: string;
  format_allowed: string;
  max_size_kb: number;
  is_mandatory: boolean;
}
export interface DocumentItem {
  persyaratanId: number;
  dokumenUuid: string;
  namaDokumen: string;
}
export interface Checklist {
  persyaratanId: number;
  isSesuai: boolean;
  catatanPerbaikan: string | null;
}
export interface Verification {
  keputusan: string;
  catatanUmum: string | null;
  checklist: Checklist[];
}
export interface Interview {
  nilaiAkhir: string;
  status: string;
  catatanEvaluasi: string;
}
export interface VerificationQueueItem {
  id: number;
  kode_pendaftaran: string;
  nik?: string;
  nama_lengkap?: string;
  beasiswa_id: number;
  tipe_pengajuan: string;
  status: string;
  submitted_at?: string;
}
export interface VerificationQueue {
  items: VerificationQueueItem[];
  counters: { perlu_verifikasi: number; status_revisi: number; disetujui: number; ditolak: number };
  pagination: { page: number; limit: number; total: number; total_pages: number };
}
export interface InterviewQueueItem {
  id: number;
  kodePendaftaran: string;
  status: string;
  dataDiri?: { nik?: string; namaLengkap?: string };
  wawancara?: Interview;
}
export interface InterviewQueue {
  items: InterviewQueueItem[];
  counters: {
    proses_wawancara: number;
    lulus_wawancara: number;
    tidak_lulus_wawancara: number;
    total: number;
  };
}
export interface Registration {
  id: number;
  kodePendaftaran: string;
  status: string;
  jumlahRevisi: number;
  beasiswaSnapshot: Beasiswa & { persyaratan: Requirement[] };
  dataDiri?: Record<string, unknown>;
  pendidikan?: Record<string, unknown>;
  dokumen: DocumentItem[];
  persetujuan?: Record<string, unknown>;
  verifikasi?: Verification[];
  wawancara?: Interview;
  sectionTerakhir?: number;
  submittedAt?: string | null;
  auditStatus?: Array<{
    statusLama: string;
    statusBaru: string;
    catatan?: string | null;
    createdAt: string;
  }>;
}
