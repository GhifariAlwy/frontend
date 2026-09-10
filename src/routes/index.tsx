import { createBrowserRouter } from 'react-router-dom';
import { BerandaPage } from '../pages/BerandaPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { CandidateDashboardPage } from '../pages/calon/CandidateDashboardPage';
import { CandidateWizardPage } from '../pages/calon/CandidateWizardPage';
import { VerifierPage } from '../pages/internal/VerifierPage';
import { InterviewPage } from '../pages/internal/InterviewPage';
import { AdminPage } from '../pages/admin/AdminPage';
export const router = createBrowserRouter([
  { path: '/', element: <BerandaPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/login-internal', element: <LoginPage internal /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verifikasi-email', element: <VerifyEmailPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <ProtectedRoute roles={['CALON_PESERTA']} />,
            children: [{ index: true, element: <CandidateDashboardPage /> }],
          },
          {
            path: '/pendaftaran',
            element: <ProtectedRoute roles={['CALON_PESERTA']} />,
            children: [{ index: true, element: <CandidateWizardPage /> }],
          },
          {
            path: '/verifikasi',
            element: <ProtectedRoute roles={['VERIFIKATOR']} />,
            children: [{ index: true, element: <VerifierPage /> }],
          },
          {
            path: '/wawancara',
            element: <ProtectedRoute roles={['LEMBAGA_SELEKSI']} />,
            children: [{ index: true, element: <InterviewPage /> }],
          },
          {
            path: '/admin',
            element: <ProtectedRoute roles={['ADMIN']} />,
            children: [{ index: true, element: <AdminPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
