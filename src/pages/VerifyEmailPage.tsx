import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/auth';

/**
 * Halaman tujuan tautan aktivasi dari email registrasi
 * (`{APP_BASE_URL}/verifikasi-email?token=...`). Tanpa halaman ini, tautan
 * aktivasi di email mendarat di 404 dan akun tidak pernah bisa diaktifkan
 * dari email — persis seperti laporan "email aktivasi tidak bisa dipakai".
 */
export function VerifyEmailPage(): JSX.Element {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState('error');
      setMessage('Token aktivasi tidak ditemukan pada tautan.');
      return;
    }
    verifyEmail(token)
      .then(() => {
        if (!cancelled) setState('success');
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState('error');
          setMessage(err instanceof Error ? err.message : 'Aktivasi gagal.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 text-center">
              {state === 'loading' && (
                <>
                  <div className="spinner-border text-primary mb-3" role="status" />
                  <h1 className="h5 mb-1">Memverifikasi email Anda...</h1>
                </>
              )}
              {state === 'success' && (
                <>
                  <i className="bi bi-check-circle display-3 text-success" />
                  <h1 className="h5 fw-bold mt-3">Email berhasil diverifikasi</h1>
                  <p className="text-muted">
                    Akun Anda sudah aktif. Silakan masuk dengan username dan password sementara
                    yang dikirim ke email Anda.
                  </p>
                  <Link className="btn btn-primary" to="/login">
                    Masuk sekarang
                  </Link>
                </>
              )}
              {state === 'error' && (
                <>
                  <i className="bi bi-x-circle display-3 text-danger" />
                  <h1 className="h5 fw-bold mt-3">Aktivasi gagal</h1>
                  <p className="text-muted">{message || 'Tautan tidak valid atau sudah dipakai.'}</p>
                  <Link className="btn btn-outline-primary" to="/login">
                    Ke halaman masuk
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
