import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewQueue, scoreInterview } from '../../api/seleksi';
import type { InterviewQueueItem } from '../../types/api';

export function InterviewPage(): JSX.Element {
  const [selected, setSelected] = useState<InterviewQueueItem | null>(null);
  const queue = useQuery({ queryKey: ['wawancara'], queryFn: () => interviewQueue() });
  const counters = queue.data?.counters;
  return (
    <div>
      <h1 className="h3 mb-4">Seleksi Wawancara</h1>
      <div className="row g-3 mb-4">
        {[
          ['Dalam Proses Wawancara', counters?.proses_wawancara ?? 0, 'primary'],
          ['Lulus Wawancara', counters?.lulus_wawancara ?? 0, 'success'],
          ['Tidak Lulus Wawancara', counters?.tidak_lulus_wawancara ?? 0, 'danger'],
          ['Total Peserta', counters?.total ?? 0, 'secondary'],
        ].map(([label, value, color]) => (
          <div className="col-md-3" key={String(label)}>
            <div className={`card border-0 shadow-sm border-start border-4 border-${color}`}>
              <div className="card-body">
                <div className="small text-muted">{label}</div>
                <div className="display-6 fw-bold">{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Kode Tiket</th>
                  <th>NIK</th>
                  <th>Nama Lengkap</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(queue.data?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.kodePendaftaran}</td>
                    <td>{item.dataDiri?.nik ?? '-'}</td>
                    <td>{item.dataDiri?.namaLengkap ?? '-'}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => setSelected(item)}>
                        Nilai
                      </button>
                    </td>
                  </tr>
                ))}
                {!queue.data?.items.length && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Tidak ada peserta lolos administrasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selected && <InterviewModal candidate={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function InterviewModal({
  candidate,
  onClose,
}: {
  candidate: InterviewQueueItem;
  onClose: () => void;
}): JSX.Element {
  const client = useQueryClient();
  const [scores, setScores] = useState({ komunikasi: 0, teknis: 0, komitmen: 0 });
  const [status, setStatus] = useState<'LULUS' | 'TIDAK_LULUS'>('LULUS');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const finalScore = (
    scores.komunikasi * 0.3 +
    scores.teknis * 0.4 +
    scores.komitmen * 0.3
  ).toFixed(2);
  async function save(): Promise<void> {
    if (!note.trim()) {
      setError('Catatan evaluasi wajib diisi.');
      return;
    }
    if (
      !window.confirm(
        `Simpan penilaian dengan status ${status === 'LULUS' ? 'Lulus' : 'Tidak Lulus'}?`,
      )
    )
      return;
    try {
      await scoreInterview(candidate.id, {
        nilai_komunikasi: scores.komunikasi,
        nilai_teknis: scores.teknis,
        nilai_komitmen: scores.komitmen,
        status,
        catatan_evaluasi: note,
      });
      await client.invalidateQueries({ queryKey: ['wawancara'] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Penilaian gagal disimpan');
    }
  }
  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      style={{ background: 'rgba(0,0,0,.5)' }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h5">
              Penilaian Wawancara — {candidate.dataDiri?.namaLengkap}
            </h2>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {(
              [
                ['komunikasi', 'Komunikasi & Sikap', '30%'],
                ['teknis', 'Pemahaman Teknis & Motivasi', '40%'],
                ['komitmen', 'Komitmen & Kehadiran', '30%'],
              ] as const
            ).map(([key, label, weight]) => (
              <div className="mb-3" key={key}>
                <label className="form-label">
                  {label} <span className="text-muted">({weight})</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="form-control"
                  value={scores[key as keyof typeof scores]}
                  onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
                />
              </div>
            ))}
            <div className="alert alert-light border">
              <strong>Nilai Akhir (informasi):</strong> {finalScore}
            </div>
            <div className="mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="LULUS">Lulus</option>
                <option value="TIDAK_LULUS">Tidak Lulus</option>
              </select>
            </div>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Catatan evaluasi"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={() => void save()}>
              Simpan Penilaian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
