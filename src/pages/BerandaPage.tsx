import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { activeScholarships } from '../api/master';
export function BerandaPage(): JSX.Element {
  const query = useQuery({ queryKey: ['beasiswa-aktif'], queryFn: activeScholarships });
  const programs = query.data ?? [];
  return (
    <>
      <nav className="navbar navbar-expand-lg bg-white border-bottom">
        <div className="container">
          <Link className="navbar-brand fw-bold text-primary" to="/">
            <i className="bi bi-mortarboard-fill me-2" />
            Beasiswa Pelatihan
          </Link>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-primary" to="/login">
              Masuk
            </Link>
            <Link className="btn btn-primary" to="/register">
              Daftar
            </Link>
          </div>
        </div>
      </nav>
      <main>
        <section className="bg-primary text-white py-5">
          <div className="container py-4">
            <h1 className="display-5 fw-bold">Bangun Masa Depanmu</h1>
            <p className="lead">Raih kesempatan belajar melalui program beasiswa pelatihan.</p>
          </div>
        </section>
        <section className="container py-5">
          <h2 className="h3 mb-4">
            {programs.length ? 'Program Pelatihan Tersedia' : 'Pendaftaran Belum Dibuka'}
          </h2>
          {query.isLoading ? (
            <div className="text-center">
              <span className="spinner-border text-primary" />
            </div>
          ) : programs.length ? (
            <div className="row g-4">
              {programs.map((program) => (
                <div className="col-md-4" key={program.id}>
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <span className="badge bg-success-subtle text-success mb-3">
                        Pendaftaran Dibuka
                      </span>
                      <h3 className="h5">{program.nama}</h3>
                      <p className="text-muted">{program.deskripsi}</p>
                      <p className="small mb-0">
                        <i className="bi bi-calendar-event me-2" />
                        Batas akhir: {new Date(program.tanggal_tutup).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-light border text-center py-5">
              <i className="bi bi-calendar-x fs-1 text-muted d-block mb-3" />
              <p className="mb-0">Belum ada gelombang pendaftaran aktif saat ini.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
