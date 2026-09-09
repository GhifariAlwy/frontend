import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/api';

function getRoleHome(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'VERIFIKATOR':
      return '/verifikasi';
    case 'LEMBAGA_SELEKSI':
      return '/wawancara';
    case 'CALON_PESERTA':
      return '/dashboard';
  }
}

export function LoginPage({ internal = false }: { internal?: boolean }): JSX.Element {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const loggedInUser = await login({
        identifier,
        password,
        channel: internal ? 'INTERNAL' : 'PUBLIK',
      });
      const role = loggedInUser.role;
      const requestedPath = (location.state as { from?: string } | null)?.from;
      navigate(internal ? getRoleHome(role) : requestedPath ?? getRoleHome(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    }
  }
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h1 className="h4 mb-4">{internal ? 'Login Internal' : 'Login Peserta'}</h1>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={submit}>
                <label className="form-label">Username atau Email</label>
                <input
                  className="form-control mb-3"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control mb-4"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="btn btn-primary w-100">Masuk</button>
              </form>
              {!internal && (
                <Link className="d-block mt-3" to="/register">
                  Belum punya akun?
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
