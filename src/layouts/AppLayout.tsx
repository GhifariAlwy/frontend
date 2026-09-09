import { Link, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { menus } from '../api/auth';
import { useAuth } from '../context/AuthContext';
export function AppLayout(): JSX.Element {
  const { user, logout } = useAuth();
  const menuQuery = useQuery({ queryKey: ['menus'], queryFn: menus });
  return (
    <div className="d-flex min-vh-100 bg-light">
      <aside className="bg-primary text-white p-3" style={{ width: 260 }}>
        <h5 className="mb-4">
          <i className="bi bi-mortarboard-fill me-2" />
          Beasiswa
        </h5>
        <nav className="nav flex-column gap-1">
          {(menuQuery.data ?? [])
            .sort((a, b) => a.urutan - b.urutan)
            .map((item) => (
              <Link className="nav-link text-white" key={item.id} to={item.path}>
                <i className={`${item.icon ?? 'bi bi-circle'} me-2`} />
                {item.nama}
              </Link>
            ))}
        </nav>
      </aside>
      <main className="flex-grow-1">
        <header className="bg-white border-bottom p-3 d-flex justify-content-end align-items-center gap-3">
          <span>{user?.nama}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
            Keluar
          </button>
        </header>
        <div className="container-fluid p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
