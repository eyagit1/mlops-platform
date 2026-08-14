import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import AdminPanel from './components/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import { ActivityProvider } from './context/ActivityContext';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import IADocuments from './pages/IADocuments';
import InferenceML from './pages/InferenceML';
import Login from './pages/Login';
import Observabilite from './pages/Observabilite';

export default function App() {
  return (
    <AuthProvider>
      <ActivityProvider>
        <BrowserRouter>
          <Routes>
            {/* Public authentication route */}
            <Route path="/login" element={<Login />} />

            {/* Protected dashboard and operational routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="inference" element={<InferenceML />} />
                <Route path="documents" element={<IADocuments />} />
                <Route path="observabilite" element={<Observabilite />} />
                <Route path="deploiement" element={<AdminPanel />} />
                <Route path="admin" element={<AdminPanel />} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ActivityProvider>
    </AuthProvider>
  );
}
