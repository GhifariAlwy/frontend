import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { activeScholarships } from '../../api/master';
import { create, mine } from '../../api/pendaftaran';
import type { Beasiswa, Registration } from '../../types/api';

function statusLabel(value: string | undefined): string {
  return value?.replaceAll('_', ' ') ?? '-';
}

export function CandidateDashboardPage(): JSX.Element {
  const registration = useQuery({ queryKey: ['pendaftaran-saya'], queryFn: mine });
  const programs = useQuery({ queryKey: ['beasiswa-aktif'], queryFn: activeScholarships });
  const item = registration.data;
  const active = item?.beasiswaSnapshot;

  async function start(program: Beasiswa): Promise<void> {
    await create(program.id);
    await registration.refetch();
  }

  if (registration.isLoading)
    return (
      <div className="text-center py-5">
        <span className="spinner-border" />
      </div>
    );
  if (item?.status === 'LULUS_WAWANCARA') return <Announcement registration={item} />;
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Dashboard Peserta</h1>
          <p className="text-muted mb-0">Pantau proses pendaftaran beasiswa Anda.</p>
        </div>
        {item && (item.status === 'DRAFT' || item.status === 'REVISI') && (
          <Link className="btn btn-primary" to="/pendaftaran">
            Lanjutkan Pendaftaran
          </Link>
        )}
      </div>
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5">Monitoring Pendaftaran</h2>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Kode Tiket</th>
                  <th>Program</th>
                  <th>Tanggal</th>
                  <th>Seleksi Administrasi</th>
                  <th>Status Wawancara</th>
                  <th>Status Final</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {item ? (
                  <tr>
                    <td>{item.kodePendaftaran}</td>
                    <td>{active?.nama ?? '-'}</td>
                    <td>
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td>
                      {statusLabel(
                        item.status === 'LOLOS_ADMIN' || item.status.includes('WAWANCARA')
                          ? 'LOLOS_ADMIN'
                          : item.status === 'DITOLAK_ADMIN'
                            ? 'DITOLAK_ADMIN'
                            : item.status,
                      )}
                    </td>
                    <td>{item.status.includes('WAWANCARA') ? statusLabel(item.status) : '-'}</td>
                    <td>{item.status.includes('WAWANCARA') ? statusLabel(item.status) : '-'}</td>
                    <td>
                      {item.status === 'DRAFT' || item.status === 'REVISI' ? (
                        <Link to="/pendaftaran">Edit</Link>
                      ) : (
                        <span className="text-muted">Terkunci</span>
                      )}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      Belum ada pendaftaran.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <section>
        <h2 className="h5 mb-3">Katalog Program Pelatihan</h2>
        <div className="row g-3">
          {(programs.data ?? []).map((program) => (
            <div className="col-md-4" key={program.id}>
              <div
                className={`card h-100 ${active?.id === program.id ? 'border-primary' : 'border-0 shadow-sm'}`}
              >
                <div className="card-body">
                  <h3 className="h6">{program.nama}</h3>
                  <p className="small text-muted">{program.deskripsi}</p>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={Boolean(item) || programs.isFetching}
                    onClick={() => void start(program)}
                  >
                    {active?.id === program.id ? (
                      'Sedang Diikuti'
                    ) : item ? (
                      <>
                        <i className="bi bi-lock me-1" />
                        Terkunci
                      </>
                    ) : (
                      'Daftar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Announcement({ registration }: { registration: Registration }): JSX.Element {
  return (
    <div className="card border-0 shadow-sm text-center p-5">
      <i className="bi bi-patch-check-fill text-success display-3" />
      <h1 className="h2 mt-3">Selamat, Anda Lulus!</h1>
      <p className="lead">
        Anda dinyatakan lulus seleksi program {registration.beasiswaSnapshot.nama}.
      </p>
      <p className="text-muted">Kode tiket: {registration.kodePendaftaran}</p>
    </div>
  );
}
