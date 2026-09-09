import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { activeScholarships } from '../../api/master';
import { decideVerification, verificationDetail, verificationQueue } from '../../api/seleksi';
import { apiClient } from '../../api/client';
import type { DocumentItem, Registration, Requirement } from '../../types/api';

type Decision = 'DISETUJUI' | 'DITOLAK' | 'REVISI';
interface Check {
  id: number;
  sesuai: boolean;
  catatan: string;
}

export function VerifierPage(): JSX.Element {
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const queue = useQuery({
    queryKey: ['verifikasi', search, program],
    queryFn: () =>
      verificationQueue({
        search: search || undefined,
        beasiswa_id: program ? Number(program) : undefined,
      }),
  });
  const programs = useQuery({ queryKey: ['beasiswa-aktif'], queryFn: activeScholarships });
  const detail = useQuery({
    queryKey: ['verifikasi-detail', selected],
    queryFn: () => verificationDetail(selected!),
    enabled: selected !== null,
  });
  const counters = queue.data?.counters;
  return (
    <div>
      <h1 className="h3 mb-4">Verifikasi Pendaftaran</h1>
      <div className="row g-3 mb-4">
        {[
          ['Perlu Verifikasi', counters?.perlu_verifikasi ?? 0, 'primary'],
          ['Status Revisi', counters?.status_revisi ?? 0, 'warning'],
          ['Disetujui', counters?.disetujui ?? 0, 'success'],
          ['Ditolak', counters?.ditolak ?? 0, 'danger'],
        ].map(([label, value, color]) => (
          <div className="col-md-3" key={String(label)}>
            <div className={`card border-0 shadow-sm border-start border-4 border-${color}`}>
              <div className="card-body">
                <div className="text-muted small">{label}</div>
                <div className="display-6 fw-bold">{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-7">
              <input
                className="form-control"
                placeholder="Cari NIK atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <select
                className="form-select"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              >
                <option value="">Semua program</option>
                {(programs.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Kode Tiket</th>
                  <th>NIK</th>
                  <th>Nama Lengkap</th>
                  <th>Tipe Pengajuan</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(queue.data?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.kode_pendaftaran}</td>
                    <td>{item.nik}</td>
                    <td>{item.nama_lengkap}</td>
                    <td>
                      <span
                        className={`badge ${item.tipe_pengajuan === 'Revisi' ? 'bg-warning text-dark' : 'bg-primary'}`}
                      >
                        {item.tipe_pengajuan}
                      </span>
                    </td>
                    <td>
                      {item.submitted_at
                        ? new Date(item.submitted_at).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setSelected(item.id)}
                      >
                        Periksa
                      </button>
                    </td>
                  </tr>
                ))}
                {!queue.data?.items.length && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      Tidak ada antrian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selected !== null && detail.data && (
        <VerificationModal registration={detail.data} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function VerificationModal({
  registration,
  onClose,
}: {
  registration: Registration;
  onClose: () => void;
}): JSX.Element {
  const client = useQueryClient();
  const requirements = registration.beasiswaSnapshot?.persyaratan ?? [];
  const previous = registration.verifikasi?.[0]?.checklist ?? [];
  const [checks, setChecks] = useState<Check[]>(
    requirements.map((requirement) => {
      const old = previous.find((item) => Number(item.persyaratanId) === Number(requirement.id));
      return {
        id: requirement.id,
        sesuai: old?.isSesuai ?? false,
        catatan: old?.catatanPerbaikan ?? '',
      };
    }),
  );
  const [decision, setDecision] = useState<Decision>('DISETUJUI');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const allCorrect = checks.length > 0 && checks.every((item) => item.sesuai);
  async function save(): Promise<void> {
    if (decision === 'DISETUJUI' && !allCorrect) return;
    if (decision === 'REVISI' && !checks.some((item) => !item.sesuai && item.catatan.trim())) {
      setError('Revisi harus memiliki minimal satu catatan perbaikan.');
      return;
    }
    if (decision === 'DITOLAK' && !note.trim()) {
      setError('Catatan wajib diisi untuk penolakan.');
      return;
    }
    if (!window.confirm(`Kirim keputusan ${decision}?`)) return;
    try {
      await decideVerification(registration.id, {
        keputusan: decision,
        catatan_umum: note,
        checklist: checks.map((item) => ({
          persyaratan_id: item.id,
          is_sesuai: item.sesuai,
          catatan_perbaikan: item.catatan,
        })),
      });
      await client.invalidateQueries({ queryKey: ['verifikasi'] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Keputusan gagal disimpan');
    }
  }
  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      style={{ background: 'rgba(0,0,0,.5)' }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h5">Detail Verifikasi — {registration.kodePendaftaran}</h2>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="row g-4">
              <div className="col-lg-5">
                <h3 className="h6">Data Peserta</h3>
                <dl className="row">
                  {[
                    ['Nama', registration.dataDiri?.namaLengkap],
                    ['NIK', registration.dataDiri?.nik],
                    ['Email', registration.dataDiri?.email],
                    ['Pendidikan', registration.pendidikan?.pendidikanTerakhir],
                    ['Instansi', registration.pendidikan?.namaInstansi],
                  ].map(([label, value]) => (
                    <>
                      <dt className="col-sm-4" key={`${label}-dt`}>
                        {String(label)}
                      </dt>
                      <dd className="col-sm-8" key={`${label}-dd`}>
                        {String(value ?? '-')}
                      </dd>
                    </>
                  ))}
                </dl>
              </div>
              <div className="col-lg-7">
                <h3 className="h6">Pemeriksaan Dokumen</h3>
                {requirements.map((requirement) => (
                  <DocumentCheck
                    key={requirement.id}
                    requirement={requirement}
                    document={registration.dokumen.find(
                      (item) => Number(item.persyaratanId) === Number(requirement.id),
                    )}
                    check={checks.find((item) => item.id === requirement.id)!}
                    update={(value) =>
                      setChecks(
                        checks.map((item) =>
                          item.id === requirement.id ? { ...item, ...value } : item,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            </div>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <hr />
            <h3 className="h6">Keputusan</h3>
            <div className="d-flex gap-3 mb-3">
              {(['DISETUJUI', 'DITOLAK', 'REVISI'] as Decision[]).map((value) => (
                <label className="form-check" key={value}>
                  <input
                    className="form-check-input"
                    type="radio"
                    checked={decision === value}
                    onChange={() => setDecision(value)}
                  />
                  <span className="form-check-label">
                    {value === 'DISETUJUI'
                      ? 'Disetujui'
                      : value === 'DITOLAK'
                        ? 'Ditolak'
                        : 'Revisi'}
                  </span>
                </label>
              ))}
            </div>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Catatan untuk peserta"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              disabled={decision === 'DISETUJUI' && !allCorrect}
              onClick={() => void save()}
            >
              Simpan Keputusan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentCheck({
  requirement,
  document,
  check,
  update,
}: {
  requirement: Requirement;
  document?: DocumentItem;
  check: Check;
  update: (value: Partial<Check>) => void;
}): JSX.Element {
  async function preview(): Promise<void> {
    if (!document) return;
    const response = await apiClient.get(`/dokumen/${document.dokumenUuid}`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  return (
    <div className="border rounded p-3 mb-3">
      <div className="d-flex justify-content-between mb-2">
        <strong>{requirement.nama_dokumen}</strong>
        {document && (
          <button className="btn btn-sm btn-outline-secondary" onClick={() => void preview()}>
            <i className="bi bi-eye me-1" />
            Pratinjau
          </button>
        )}
      </div>
      <div className="d-flex gap-3 mb-2">
        <label className="form-check">
          <input
            className="form-check-input"
            type="radio"
            checked={check.sesuai}
            onChange={() => update({ sesuai: true })}
          />{' '}
          Sesuai
        </label>
        <label className="form-check">
          <input
            className="form-check-input"
            type="radio"
            checked={!check.sesuai}
            onChange={() => update({ sesuai: false })}
          />{' '}
          Tidak Sesuai
        </label>
      </div>
      <input
        className="form-control form-control-sm"
        placeholder="Catatan perbaikan"
        value={check.catatan}
        onChange={(e) => update({ catatan: e.target.value })}
      />
    </div>
  );
}
