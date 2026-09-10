import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mine, saveSection, submit, uploadDocument } from '../../api/pendaftaran';
import type { Checklist, DocumentItem, Registration, Requirement } from '../../types/api';

const section1 = z.object({
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit'),
  nama_lengkap: z.string().min(1, 'Wajib diisi'),
  tempat_lahir: z.string().min(1, 'Wajib diisi'),
  tanggal_lahir: z.string().min(1, 'Wajib diisi'),
  jenis_kelamin: z.enum(['L', 'P']),
  alamat_domisili: z.string().min(1, 'Wajib diisi'),
  provinsi: z.string().min(1, 'Wajib diisi'),
  kabupaten_kota: z.string().min(1, 'Wajib diisi'),
  kecamatan: z.string().min(1, 'Wajib diisi'),
  kelurahan: z.string().min(1, 'Wajib diisi'),
  no_hp: z.string().min(8, 'Nomor tidak valid'),
  email: z.string().email('Email tidak valid'),
});
const section2 = z.object({
  pendidikan_terakhir: z.string().min(1, 'Wajib dipilih'),
  nama_instansi: z.string().min(1, 'Wajib diisi'),
  jurusan: z.string().min(1, 'Wajib diisi'),
  pekerjaan: z.string().min(1, 'Wajib diisi'),
});
type FormValues = z.infer<typeof section1> & z.infer<typeof section2>;
const emptyValues: FormValues = {
  nik: '',
  nama_lengkap: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: 'L',
  alamat_domisili: '',
  provinsi: '',
  kabupaten_kota: '',
  kecamatan: '',
  kelurahan: '',
  no_hp: '',
  email: '',
  pendidikan_terakhir: '',
  nama_instansi: '',
  jurusan: '',
  pekerjaan: '',
};

export function CandidateWizardPage(): JSX.Element {
  const navigate = useNavigate();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['pendaftaran-saya'], queryFn: mine });
  const registration = query.data;
  const editable = registration?.status === 'DRAFT' || registration?.status === 'REVISI';
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const form = useForm<FormValues>({ defaultValues: emptyValues });
  // Step hanya disinkronkan dari server SEKALI saat data pertama kali dimuat. Tanpa guard ini,
  // refetch setelah simpan section menjalankan ulang effect dan setStep(sectionTerakhir)
  // menimpa setStep(step+1) dari next() — wizard tidak pernah mau maju walau simpan sukses.
  const stepSyncedRef = useRef(false);
  const requirements = useMemo(
    () => (registration?.beasiswaSnapshot?.persyaratan ?? []) as Requirement[],
    [registration],
  );

  useEffect(() => {
    if (!registration) return;
    if (!stepSyncedRef.current) {
      stepSyncedRef.current = true;
      setStep(Math.min(Math.max(registration.sectionTerakhir ?? 1, 1), 4));
    }
    const data = registration.dataDiri ?? {};
    const education = registration.pendidikan ?? {};
    form.reset({
      ...emptyValues,
      nik: String(data.nik ?? ''),
      nama_lengkap: String(data.namaLengkap ?? data.nama_lengkap ?? ''),
      tempat_lahir: String(data.tempatLahir ?? data.tempat_lahir ?? ''),
      tanggal_lahir: String(data.tanggalLahir ?? data.tanggal_lahir ?? '').slice(0, 10),
      jenis_kelamin: (data.jenisKelamin ?? data.jenis_kelamin ?? 'L') as 'L' | 'P',
      alamat_domisili: String(data.alamatDomisili ?? data.alamat_domisili ?? ''),
      provinsi: String(data.provinsi ?? ''),
      kabupaten_kota: String(data.kabupatenKota ?? data.kabupaten_kota ?? ''),
      kecamatan: String(data.kecamatan ?? ''),
      kelurahan: String(data.kelurahan ?? ''),
      no_hp: String(data.noHp ?? data.no_hp ?? ''),
      email: String(data.email ?? ''),
      pendidikan_terakhir: String(
        education.pendidikanTerakhir ?? education.pendidikan_terakhir ?? '',
      ),
      nama_instansi: String(education.namaInstansi ?? education.nama_instansi ?? ''),
      jurusan: String(education.jurusan ?? ''),
      pekerjaan: String(education.pekerjaan ?? ''),
    });
    setDocuments(registration.dokumen ?? []);
    setConsent(
      Boolean(
        registration.persetujuan?.setujuKeabsahan && registration.persetujuan?.setujuKetentuan,
      ),
    );
  }, [registration, form]);

  if (query.isLoading)
    return (
      <div className="text-center py-5">
        <span className="spinner-border" />
      </div>
    );
  if (!registration)
    return (
      <div className="alert alert-warning">
        Pendaftaran belum dibuat. <Link to="/dashboard">Pilih program di dashboard.</Link>
      </div>
    );
  const currentRegistration = registration;
  if (!editable) return <ReadonlyRegistration registration={registration} />;

  const errors = form.formState.errors;
  async function next(advance = true): Promise<void> {
    setMessage('');
    const values = form.getValues();
    const result =
      step === 1
        ? section1.safeParse(values)
        : step === 2
          ? section2.safeParse(values)
          : { success: true as const, data: values };
    if (!result.success) {
      result.error.issues.forEach((issue) =>
        form.setError(issue.path[0] as keyof FormValues, { message: issue.message }),
      );
      return;
    }
    if (step === 3 && !documents.length) {
      setMessage('Unggah minimal satu dokumen.');
      return;
    }
    setSaving(true);
    try {
      const body =
        step === 1
          ? pick(values, Object.keys(section1.shape))
          : step === 2
            ? pick(values, Object.keys(section2.shape))
            : step === 3
              ? {
                  dokumen: documents.map((doc) => ({
                    persyaratan_id: doc.persyaratanId,
                    dokumen_uuid: doc.dokumenUuid,
                    nama_dokumen: doc.namaDokumen,
                  })),
                }
              : { setuju_keabsahan: consent, setuju_ketentuan: consent };
      await saveSection(currentRegistration.id, step, body);
      await client.invalidateQueries({ queryKey: ['pendaftaran-saya'] });
      if (advance) setStep(Math.min(step + 1, 4));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan draft');
    } finally {
      setSaving(false);
    }
  }
  async function finalSubmit(): Promise<void> {
    if (!consent) {
      setMessage('Anda harus menyetujui lembar persetujuan.');
      return;
    }
    setSaving(true);
    try {
      await saveSection(currentRegistration.id, 4, {
        setuju_keabsahan: true,
        setuju_ketentuan: true,
      });
      await submit(currentRegistration.id);
      await client.invalidateQueries({ queryKey: ['pendaftaran-saya'] });
      navigate('/dashboard');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pendaftaran belum lengkap');
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3">Formulir Pendaftaran</h1>
          <p className="text-muted mb-0">{registration.beasiswaSnapshot.nama}</p>
        </div>
        <Link className="btn btn-outline-secondary" to="/dashboard">
          Simpan & Keluar
        </Link>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <div className="row g-2">
            {[
              'Data Diri & Kontak',
              'Pendidikan & Pekerjaan',
              'Unggah Dokumen',
              'Ringkasan & Persetujuan',
            ].map((label, index) => (
              <button
                type="button"
                className={`col btn text-start ${step === index + 1 ? 'text-primary fw-bold' : 'text-muted'}`}
                key={label}
                onClick={() => index + 1 < step && setStep(index + 1)}
              >
                <span className="badge rounded-pill me-2 bg-primary">{index + 1}</span>
                {String(label)}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body p-4">
          {message && <div className="alert alert-warning">{message}</div>}
          {step === 1 && <Personal form={form} errors={errors} />}
          {step === 2 && <Education form={form} errors={errors} />}
          {step === 3 && (
            <Documents
              registration={registration}
              requirements={requirements}
              documents={documents}
              setDocuments={setDocuments}
              notes={registration.verifikasi?.[0]?.checklist ?? []}
            />
          )}
          {step === 4 && (
            <Summary
              values={form.getValues()}
              documents={documents}
              consent={consent}
              setConsent={setConsent}
            />
          )}
          <div className="d-flex justify-content-between mt-4">
            <button
              className="btn btn-outline-secondary"
              disabled={step === 1 || saving}
              onClick={() => setStep(step - 1)}
            >
              Sebelumnya
            </button>
            {step < 4 ? (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary"
                  disabled={saving}
                  onClick={() => void next(false)}
                >
                  Simpan Draft
                </button>
                <button className="btn btn-primary" disabled={saving} onClick={() => void next()}>
                  {saving ? 'Menyimpan...' : 'Selanjutnya'}
                </button>
              </div>
            ) : (
              <button
                className="btn btn-success"
                disabled={saving}
                onClick={() => void finalSubmit()}
              >
                {saving ? 'Mengirim...' : 'Kirim Final'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function pick(values: FormValues, keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, values[key as keyof FormValues]]));
}
function Field({
  name,
  label,
  form,
  errors,
  type = 'text',
}: {
  name: keyof FormValues;
  label: string;
  form: ReturnType<typeof useForm<FormValues>>;
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
  type?: string;
}): JSX.Element {
  return (
    <div className="col-md-6 mb-3">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
        {...form.register(name)}
      />
      <div className="invalid-feedback">{errors[name]?.message}</div>
    </div>
  );
}
function Personal({
  form,
  errors,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
}): JSX.Element {
  return (
    <div className="row">
      {<Field name="nik" label="NIK" form={form} errors={errors} />}
      {<Field name="nama_lengkap" label="Nama Lengkap" form={form} errors={errors} />}
      {<Field name="tempat_lahir" label="Tempat Lahir" form={form} errors={errors} />}
      {<Field name="tanggal_lahir" label="Tanggal Lahir" type="date" form={form} errors={errors} />}
      {<Field name="no_hp" label="Nomor HP" form={form} errors={errors} />}
      {<Field name="email" label="Email" type="email" form={form} errors={errors} />}
      {<Field name="provinsi" label="Provinsi" form={form} errors={errors} />}
      {<Field name="kabupaten_kota" label="Kabupaten/Kota" form={form} errors={errors} />}
      {<Field name="kecamatan" label="Kecamatan" form={form} errors={errors} />}
      {<Field name="kelurahan" label="Kelurahan" form={form} errors={errors} />}
      <div className="col-12 mb-3">
        <label className="form-label">Jenis Kelamin</label>
        <select className="form-select" {...form.register('jenis_kelamin')}>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </div>
      <div className="col-12 mb-3">
        <label className="form-label">Alamat Domisili</label>
        <textarea className="form-control" rows={3} {...form.register('alamat_domisili')} />
      </div>
    </div>
  );
}
function Education({
  form,
  errors,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
}): JSX.Element {
  return (
    <div className="row">
      <div className="col-md-6 mb-3">
        <label className="form-label">Pendidikan Terakhir</label>
        <select
          className={`form-select ${errors.pendidikan_terakhir ? 'is-invalid' : ''}`}
          {...form.register('pendidikan_terakhir')}
        >
          <option value="">Pilih</option>
          <option value="SMA_SMK">SMA/SMK</option>
          <option value="D3_D4">D3/D4</option>
          <option value="S1">S1</option>
          <option value="S2_S3">S2/S3</option>
        </select>
      </div>
      {<Field name="nama_instansi" label="Nama Instansi" form={form} errors={errors} />}
      {<Field name="jurusan" label="Jurusan" form={form} errors={errors} />}
      {<Field name="pekerjaan" label="Pekerjaan" form={form} errors={errors} />}
    </div>
  );
}
function Documents({
  registration,
  requirements,
  documents,
  setDocuments,
  notes,
}: {
  registration: Registration;
  requirements: Requirement[];
  documents: DocumentItem[];
  setDocuments: Dispatch<SetStateAction<DocumentItem[]>>;
  notes: Checklist[];
}): JSX.Element {
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [error, setError] = useState('');
  async function choose(requirement: Requirement, file: File): Promise<void> {
    setError('');
    if (!registration?.id) {
      setError('Pendaftaran belum siap. Muat ulang halaman.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(`${requirement.nama_dokumen}: ukuran maksimal 2 MB.`);
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!requirement.format_allowed.split(',').includes(ext)) {
      setError(`${requirement.nama_dokumen}: format tidak didukung.`);
      return;
    }
    try {
      const result = await uploadDocument(file, registration.id, requirement.id, (value) =>
        setProgress({ ...progress, [requirement.id]: value }),
      );
      // Update fungsional: aman walau pengguna memilih beberapa berkas cepat berturut-turut
      // (closure `documents` bisa usang sebelum upload selesai).
      setDocuments((prev) => [
        ...prev.filter((doc) => doc.persyaratanId !== requirement.id),
        { persyaratanId: requirement.id, dokumenUuid: result.dokumen_uuid, namaDokumen: file.name },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal');
    }
  }
  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {requirements.map((requirement) => {
        const current = documents.find((doc) => doc.persyaratanId === requirement.id);
        return (
          <div className="border rounded p-3 mb-3" key={requirement.id}>
            <div className="d-flex justify-content-between">
              <div>
                <strong>{requirement.nama_dokumen}</strong>
                <div className="small text-muted">
                  Format: {requirement.format_allowed} · Maks. 2 MB{' '}
                  {requirement.is_mandatory && <span className="text-danger">*</span>}
                </div>
                {notes
                  .filter(
                    (note) =>
                      Number(note.persyaratanId) === Number(requirement.id) &&
                      note.catatanPerbaikan,
                  )
                  .map((note) => (
                    <div className="alert alert-warning py-2 mt-2 mb-0" key={note.persyaratanId}>
                      <i className="bi bi-exclamation-circle me-1" />
                      Catatan verifikator: {note.catatanPerbaikan}
                    </div>
                  ))}
                {current && (
                  <div className="small text-success mt-2">
                    <i className="bi bi-file-earmark-check me-1" />
                    {current.namaDokumen}
                  </div>
                )}
              </div>
              <label className="btn btn-outline-primary btn-sm">
                Pilih File
                <input
                  type="file"
                  className="d-none"
                  accept={requirement.format_allowed
                    .split(',')
                    .map((item) => `.${item}`)
                    .join(',')}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void choose(requirement, file);
                  }}
                />
              </label>
            </div>
            {progress[requirement.id] !== undefined && progress[requirement.id]! < 100 && (
              <div className="progress mt-3">
                <div
                  className="progress-bar"
                  style={{ width: `${progress[requirement.id] ?? 0}%` }}
                >
                  {progress[requirement.id] ?? 0}%
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function Summary({
  values,
  documents,
  consent,
  setConsent,
}: {
  values: FormValues;
  documents: DocumentItem[];
  consent: boolean;
  setConsent: (value: boolean) => void;
}): JSX.Element {
  return (
    <div>
      <h2 className="h5">Ringkasan Data</h2>
      <dl className="row">
        <dt className="col-sm-3">Nama</dt>
        <dd className="col-sm-9">{values.nama_lengkap || '-'}</dd>
        <dt className="col-sm-3">NIK</dt>
        <dd className="col-sm-9">{values.nik || '-'}</dd>
        <dt className="col-sm-3">Pendidikan</dt>
        <dd className="col-sm-9">{values.pendidikan_terakhir || '-'}</dd>
        <dt className="col-sm-3">Dokumen</dt>
        <dd className="col-sm-9">{documents.length} file</dd>
      </dl>
      <div className="form-check border-top pt-3">
        <input
          className="form-check-input"
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          id="consent"
        />
        <label className="form-check-label" htmlFor="consent">
          Saya menyatakan seluruh data yang diisi benar dan menyetujui ketentuan pendaftaran.
        </label>
      </div>
    </div>
  );
}

function ReadonlyRegistration({ registration }: { registration: Registration }): JSX.Element {
  const data = registration.dataDiri ?? {};
  const education = registration.pendidikan ?? {};
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3">Detail Pendaftaran</h1>
          <p className="text-muted mb-0">{registration.beasiswaSnapshot.nama}</p>
        </div>
        <Link className="btn btn-outline-secondary" to="/dashboard">
          Kembali
        </Link>
      </div>
      <div className="alert alert-info">
        Status: <strong>{registration.status.replaceAll('_', ' ')}</strong>. Data terkunci setelah
        dikirim.
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h5">Data Diri & Kontak</h2>
          <dl className="row">
            {[
              ['Nama Lengkap', data.namaLengkap ?? data.nama_lengkap],
              ['NIK', data.nik],
              [
                'Tempat/Tanggal Lahir',
                `${data.tempatLahir ?? data.tempat_lahir ?? '-'} / ${String(data.tanggalLahir ?? '').slice(0, 10)}`,
              ],
              ['Email', data.email],
              ['Nomor HP', data.noHp ?? data.no_hp],
              ['Alamat', data.alamatDomisili ?? data.alamat_domisili],
            ].map(([label, value]) => (
              <>
                <dt className="col-sm-3" key={`${label}-label`}>
                  {String(label)}
                </dt>
                <dd className="col-sm-9" key={`${label}-value`}>
                  {String(value ?? '-')}
                </dd>
              </>
            ))}
          </dl>
          <h2 className="h5 mt-4">Pendidikan & Pekerjaan</h2>
          <dl className="row">
            {[
              [
                'Pendidikan Terakhir',
                education.pendidikanTerakhir ?? education.pendidikan_terakhir,
              ],
              ['Instansi', education.namaInstansi ?? education.nama_instansi],
              ['Jurusan', education.jurusan],
              ['Pekerjaan', education.pekerjaan],
            ].map(([label, value]) => (
              <>
                <dt className="col-sm-3" key={`${label}-label`}>
                  {String(label)}
                </dt>
                <dd className="col-sm-9" key={`${label}-value`}>
                  {String(value ?? '-')}
                </dd>
              </>
            ))}
          </dl>
          <h2 className="h5 mt-4">Dokumen</h2>
          <ul className="list-group">
            {registration.dokumen.map((doc) => (
              <li className="list-group-item d-flex justify-content-between" key={doc.dokumenUuid}>
                {doc.namaDokumen}
                <span className="badge bg-success">Terunggah</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
