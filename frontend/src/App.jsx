import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import AdminPanel from './components/AdminPanel';
import { ActivityProvider } from './context/ActivityContext';
import Dashboard from './pages/Dashboard';
import IADocuments from './pages/IADocuments';
import InferenceML from './pages/InferenceML';
import Observabilite from './pages/Observabilite';

export default function App() {
  return (
    <ActivityProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="inference" element={<InferenceML />} />
            <Route path="documents" element={<IADocuments />} />
            <Route path="observabilite" element={<Observabilite />} />
            <Route path="deploiement" element={<AdminPanel />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ActivityProvider>
  );
}
