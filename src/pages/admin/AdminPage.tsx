import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, type DataColumn } from '../../components/DataTable';
import * as api from '../../api/admin';
import type { Beasiswa } from '../../types/api';

const tabs = [
  'Ringkasan',
  'Beasiswa',
  'Persyaratan',
  'Users Internal',
  'Role & Hak Akses',
  'Struktur Menu',
] as const;
type Tab = (typeof tabs)[number];

export function AdminPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('Ringkasan');
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Administrasi Sistem</h1>
          <p className="text-muted mb-0">Kelola seleksi, master data, pengguna, dan hak akses.</p>
        </div>
      </div>
      <ul className="nav nav-tabs mb-4 flex-wrap">
        {tabs.map((item) => (
          <li className="nav-item" key={item}>
            <button
              className={`nav-link ${tab === item ? 'active' : ''}`}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
      {tab === 'Ringkasan' && <Summary />}
      {tab === 'Beasiswa' && <ScholarshipTab />}
      {tab === 'Persyaratan' && <RequirementsTab />}
      {tab === 'Users Internal' && <UsersTab />}
      {tab === 'Role & Hak Akses' && <RolesTab />}
      {tab === 'Struktur Menu' && <MenusTab />}
    </div>
  );
}

function Summary(): JSX.Element {
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: api.dashboard });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const data = useQuery({
    queryKey: ['admin-results', search, page],
    queryFn: () => api.results({ search, page, limit: 10 }),
  });
  const counters = [
    ['Pendaftar', 'pendaftar', 'primary'],
    ['Dalam Proses Admin', 'dalam_proses_admin', 'warning'],
    ['Lulus Admin', 'lulus_admin', 'success'],
    ['Tidak Lulus Admin', 'tidak_lulus_admin', 'danger'],
    ['Proses Wawancara', 'dalam_proses_wawancara', 'info'],
    ['Lulus Wawancara', 'lulus_wawancara', 'success'],
    ['Tidak Lulus Wawancara', 'tidak_lulus_wawancara', 'danger'],
  ] as const;
  async function download(): Promise<void> {
    const response = await api.exportResults();
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hasil-seleksi.xlsx';
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="row g-3 mb-4">
        {counters.map(([label, key, color]) => (
          <div className="col-6 col-md-3" key={key}>
            <div className={`card border-0 shadow-sm border-start border-4 border-${color}`}>
              <div className="card-body">
                <div className="small text-muted">{label}</div>
                <div className="h2 mb-0">{stats.data?.[key] ?? 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex gap-2 mb-3">
            <input
              className="form-control"
              placeholder="Cari NIK atau nama..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <button className="btn btn-success text-nowrap" onClick={() => void download()}>
              <i className="bi bi-file-earmark-excel me-1" />
              Export Excel
            </button>
          </div>
          <DataTable
            columns={[
              {
                key: 'nik',
                label: 'NIK & Nama',
                render: (row) => (
                  <>
                    <strong>{String(row.nik ?? '-')}</strong>
                    <br />
                    <span className="text-muted">
                      {String(row.namaLengkap ?? row.nama_lengkap ?? '-')}
                    </span>
                  </>
                ),
              },
              {
                key: 'program',
                label: 'Program',
                render: (row) =>
                  String(
                    (row.beasiswaSnapshot as { nama?: string } | undefined)?.nama ??
                      row.program ??
                      '-',
                  ),
              },
              {
                key: 'admin',
                label: 'Status Administrasi',
                render: (row) => String(row.status ?? '-'),
              },
              {
                key: 'nilai',
                label: 'Nilai Wawancara',
                render: (row) =>
                  String(
                    (row.wawancara as { nilaiAkhir?: unknown } | undefined)?.nilaiAkhir ?? '-',
                  ),
              },
              {
                key: 'wawancara',
                label: 'Status Wawancara',
                render: (row) =>
                  String((row.wawancara as { status?: unknown } | undefined)?.status ?? '-'),
              },
              { key: 'final', label: 'Status Final', render: (row) => String(row.status ?? '-') },
            ]}
            rows={data.data?.items ?? []}
          />
          <Pagination
            page={page}
            totalPages={data.data?.pagination?.total_pages ?? 1}
            setPage={setPage}
          />
        </div>
      </div>
    </>
  );
}

function ScholarshipTab(): JSX.Element {
  const query = useQuery({
    queryKey: ['admin-beasiswa'],
    queryFn: () => api.scholarships({ limit: 100 }),
  });
  const client = useQueryClient();
  const [editing, setEditing] = useState<Partial<Beasiswa> | null>(null);
  const save = useMutation({
    mutationFn: () =>
      editing?.id
        ? api.updateRecord('/beasiswa', editing.id, editing)
        : api.createRecord('/beasiswa', editing),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin-beasiswa'] });
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteRecord('/beasiswa', id),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['admin-beasiswa'] }),
  });
  return (
    <CrudSection
      title="Master Data Beasiswa Pelatihan"
      onAdd={() => setEditing({ status: 'AKTIF', metode: 'DARING', kuota: 1 })}
    >
      {editing && (
        <ScholarshipForm
          value={editing}
          setValue={setEditing}
          onSave={() => save.mutate()}
          onCancel={() => setEditing(null)}
        />
      )}
      {!editing && (
        <DataTable
          columns={[
            { key: 'nama', label: 'Nama' },
            { key: 'kuota', label: 'Kuota' },
            { key: 'metode', label: 'Metode' },
            { key: 'status', label: 'Status' },
          ]}
          rows={query.data?.items ?? []}
          actions={(row) => (
            <>
              <button
                className="btn btn-sm btn-outline-primary me-1"
                onClick={() => setEditing(row)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => {
                  if (window.confirm('Hapus program ini?')) remove.mutate(row.id);
                }}
              >
                Hapus
              </button>
            </>
          )}
        />
      )}
    </CrudSection>
  );
}

function ScholarshipForm({
  value,
  setValue,
  onSave,
  onCancel,
}: {
  value: Partial<Beasiswa>;
  setValue: (value: Partial<Beasiswa>) => void;
  onSave: () => void;
  onCancel: () => void;
}): JSX.Element {
  return (
    <div className="row g-2 mb-4">
      {(
        [
          ['nama', 'Nama'],
          ['kuota', 'Kuota'],
          ['metode', 'Metode'],
          ['status', 'Status'],
          ['tanggal_buka', 'Tanggal Buka'],
          ['tanggal_tutup', 'Tanggal Tutup'],
        ] as const
      ).map(([key, label]) => (
        <div className="col-md-4" key={key}>
          <label className="form-label">{label}</label>
          {key === 'metode' || key === 'status' ? (
            <select
              className="form-select"
              value={String(value[key as keyof Beasiswa] ?? '')}
              onChange={(e) => setValue({ ...value, [key]: e.target.value })}
            >
              {(key === 'metode'
                ? ['DARING', 'HYBRID', 'LURING']
                : ['AKTIF', 'NONAKTIF', 'DITUTUP']
              ).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          ) : (
            <input
              type={key.includes('tanggal') ? 'date' : key === 'kuota' ? 'number' : 'text'}
              className="form-control"
              value={String(value[key as keyof Beasiswa] ?? '')}
              onChange={(e) =>
                setValue({
                  ...value,
                  [key as keyof Beasiswa]:
                    key === 'kuota' ? Number(e.target.value) : e.target.value,
                })
              }
            />
          )}
        </div>
      ))}
      <div className="col-12 mt-3">
        <button className="btn btn-primary me-2" onClick={onSave}>
          Simpan
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Batal
        </button>
      </div>
    </div>
  );
}

function RequirementsTab(): JSX.Element {
  return (
    <GenericCrud
      title="Master Data Persyaratan Dokumen"
      endpoint="/persyaratan"
      queryKey="admin-persyaratan"
      loader={() => api.requirements({ limit: 100 })}
      columns={[
        { key: 'namaDokumen', label: 'Nama Dokumen' },
        { key: 'formatAllowed', label: 'Format Allowed' },
        { key: 'maxSizeKb', label: 'Max Size (KB)' },
        { key: 'isMandatory', label: 'Mandatory' },
      ]}
      fields={['beasiswa_id', 'nama_dokumen', 'format_allowed', 'max_size_kb', 'is_mandatory']}
    />
  );
}
function UsersTab(): JSX.Element {
  return (
    <GenericCrud
      title="CRUD Users Internal"
      endpoint="/users"
      queryKey="admin-users"
      loader={() => api.users({ limit: 100 })}
      columns={[
        { key: 'nama', label: 'Nama' },
        { key: 'username', label: 'Username' },
        { key: 'email', label: 'Email' },
        {
          key: 'role',
          label: 'Role System',
          render: (row) =>
            String((row.role as { nama?: string } | undefined)?.nama ?? row.role_id ?? '-'),
        },
        { key: 'is_active', label: 'Status' },
      ]}
      fields={['nama', 'username', 'email', 'role_id', 'password']}
    />
  );
}
function RolesTab(): JSX.Element {
  const query = useQuery({ queryKey: ['admin-roles'], queryFn: api.roles });
  const menuQuery = useQuery({ queryKey: ['admin-menus'], queryFn: api.menus });
  const [roleId, setRoleId] = useState<number | null>(null);
  const [access, setAccess] = useState<Record<number, Record<string, boolean>>>({});
  const save = useMutation({
    mutationFn: () =>
      api.updateRoleAccess(roleId!, {
        akses: (menuQuery.data?.items ?? []).map((menu) => ({
          menu_id: menu.id,
          ...access[menu.id],
        })),
      }),
  });
  return (
    <>
      <GenericCrud
        title="Manajemen Role"
        endpoint="/roles"
        queryKey="admin-roles"
        loader={() => api.roles()}
        columns={[
          { key: 'kode', label: 'Kode Role' },
          { key: 'nama', label: 'Nama Role' },
        ]}
        fields={['kode', 'nama']}
      />
      <CrudSection title="Role & Hak Akses Menu">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Menu</th>
                <th>View</th>
                <th>Create</th>
                <th>Update</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {roleId &&
                (menuQuery.data?.items ?? []).map((menu) => (
                  <tr key={menu.id}>
                    <td>
                      {String(query.data?.items.find((role) => role.id === roleId)?.nama ?? '-')}
                    </td>
                    <td>{String(menu.nama)}</td>
                    {['can_view', 'can_create', 'can_update', 'can_delete'].map((action) => (
                      <td key={action}>
                        <input
                          type="checkbox"
                          checked={Boolean(access[menu.id]?.[action])}
                          onChange={(e) =>
                            setAccess({
                              ...access,
                              [menu.id]: { ...access[menu.id], [action]: e.target.checked },
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex gap-2 mb-3">
          {(query.data?.items ?? []).map((role) => (
            <button
              className={`btn ${roleId === role.id ? 'btn-primary' : 'btn-outline-primary'}`}
              key={role.id}
              onClick={() => setRoleId(role.id)}
            >
              {String(role.nama)}
            </button>
          ))}
          {roleId && (
            <button className="btn btn-success" onClick={() => save.mutate()}>
              Simpan Akses
            </button>
          )}
        </div>
      </CrudSection>
    </>
  );
}
function MenusTab(): JSX.Element {
  return (
    <GenericCrud
      title="Manajemen Struktur Menu"
      endpoint="/menus"
      queryKey="admin-menus"
      loader={() => api.menus()}
      columns={[
        { key: 'nama', label: 'Nama Menu' },
        { key: 'path', label: 'URL/Route' },
        { key: 'icon', label: 'Icon' },
        { key: 'urutan', label: 'Urutan' },
      ]}
      fields={['nama', 'path', 'icon', 'urutan', 'is_active']}
    />
  );
}
function CrudSection({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd?: () => void;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">{title}</h2>
          {onAdd && (
            <button className="btn btn-primary" onClick={onAdd}>
              <i className="bi bi-plus-lg me-1" />
              Tambah
            </button>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
function GenericCrud({
  title,
  endpoint,
  queryKey,
  loader,
  columns,
  fields,
}: {
  title: string;
  endpoint: string;
  queryKey: string;
  loader: () => Promise<{ items: api.AdminRecord[] }>;
  columns: DataColumn<api.AdminRecord>[];
  fields: string[];
}): JSX.Element {
  const query = useQuery({ queryKey: [queryKey], queryFn: loader });
  const client = useQueryClient();
  const [form, setForm] = useState<api.AdminRecord | null>(null);
  const save = useMutation({
    mutationFn: () =>
      form?.id ? api.updateRecord(endpoint, form.id, form) : api.createRecord(endpoint, form),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [queryKey] });
      setForm(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteRecord(endpoint, id),
    onSuccess: () => void client.invalidateQueries({ queryKey: [queryKey] }),
  });
  return (
    <CrudSection title={title} onAdd={() => setForm({ id: 0 })}>
      {form && (
        <div className="row g-2 mb-4">
          {fields.map((field) => (
            <div className="col-md-4" key={field}>
              <label className="form-label">{field}</label>
              <input
                className="form-control"
                value={String(form[field] ?? '')}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </div>
          ))}
          <div className="col-12">
            <button className="btn btn-primary me-2" onClick={() => save.mutate()}>
              Simpan
            </button>
            <button className="btn btn-secondary" onClick={() => setForm(null)}>
              Batal
            </button>
          </div>
        </div>
      )}
      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        actions={(row) => (
          <>
            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setForm(row)}>
              Edit
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                if (window.confirm('Hapus data ini?')) remove.mutate(row.id);
              }}
            >
              Hapus
            </button>
          </>
        )}
      />
    </CrudSection>
  );
}
function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}): JSX.Element {
  return (
    <div className="d-flex justify-content-end gap-2 mt-3">
      <button
        className="btn btn-sm btn-outline-secondary"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        Sebelumnya
      </button>
      <span className="align-self-center">
        Halaman {page} / {totalPages}
      </span>
      <button
        className="btn btn-sm btn-outline-secondary"
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
      >
        Berikutnya
      </button>
    </div>
  );
}
