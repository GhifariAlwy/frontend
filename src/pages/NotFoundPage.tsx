import { Link } from 'react-router-dom';

export function NotFoundPage(): JSX.Element {
  return (
    <div className="container py-5 text-center">
      <i className="bi bi-compass display-1 text-primary opacity-50" />
      <h1 className="h4 fw-bold mt-3">Halaman tidak ditemukan</h1>
      <p className="text-muted">Alamat yang Anda tuju tidak tersedia.</p>
      <Link className="btn btn-primary" to="/">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
