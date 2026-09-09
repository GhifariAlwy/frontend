import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
export function RegisterPage(): JSX.Element {
  const [form, setForm] = useState({ nik: '', nama: '', email: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register(form);
      setMessage('Registrasi berhasil. Silakan cek email untuk verifikasi.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Registrasi gagal');
    }
  }
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h1 className="h4 mb-4">Registrasi Peserta</h1>
              {message && <div className="alert alert-info">{message}</div>}
              <form onSubmit={submit}>
                {(['nik', 'nama', 'email'] as const).map((key) => (
                  <div className="mb-3" key={key}>
                    <label className="form-label">
                      {key === 'nik' ? 'NIK' : key === 'nama' ? 'Nama Lengkap' : 'Email'}
                    </label>
                    <input
                      className="form-control"
                      type={key === 'email' ? 'email' : 'text'}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      required
                    />
                  </div>
                ))}
                <button className="btn btn-primary w-100">Daftar</button>
              </form>
              <Link className="d-block mt-3" to="/login">
                Sudah punya akun?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
