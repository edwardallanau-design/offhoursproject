import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, roleHomeRoute } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useAuth } from './auth/AuthContext';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ContractorsPage } from './pages/admin/ContractorsPage';
import { StrataManagersPage } from './pages/admin/StrataManagersPage';
import { ContractorDashboard } from './pages/contractor/ContractorDashboard';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { NewRequest } from './pages/owner/NewRequest';
import { StrataDashboard } from './pages/strata/StrataDashboard';
import { BillingPage } from './pages/strata/BillingPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHomeRoute[user.role]} replace />;
};

const AppWithPush = () => { usePushNotifications(); return null; };

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppWithPush />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />
            <Route element={<ProtectedRoute allowedRole="admin" />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/contractors" element={<ContractorsPage />} />
              <Route path="/admin/strata-managers" element={<StrataManagersPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRole="contractor" />}>
              <Route path="/contractor" element={<ContractorDashboard />} />
            </Route>
            <Route element={<ProtectedRoute allowedRole="unit_owner" />}>
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/owner/new" element={<NewRequest />} />
            </Route>
            <Route element={<ProtectedRoute allowedRole="strata_manager" />}>
              <Route path="/strata" element={<StrataDashboard />} />
              <Route path="/strata/billing" element={<BillingPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
