/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ReactNode } from 'react';
import Landing from './pages/Landing';
import LoginPage from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Inbox from './pages/Inbox';
import Automations from './pages/Automations';
import Broadcasts from './pages/Broadcasts';
import Contacts from './pages/Contacts';

import Templates from './pages/Templates';
import SuperAdmin from './pages/SuperAdmin';
import Settings from './pages/Settings';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-12">
    <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-400 mb-6 font-sans">
      <h1 className="text-4xl font-black">؟</h1>
    </div>
    <h2 className="text-2xl font-black text-gray-900 mb-2">{title}</h2>
    <p className="text-gray-500 font-medium">سيتم توفير هذه الميزة في الإصدار القادم من "وصل".</p>
  </div>
);

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<DashboardHome />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="templates" element={<Templates />} />
            <Route path="automations" element={<Automations />} />
            <Route path="broadcasts" element={<Broadcasts />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="analytics" element={<Placeholder title="تحليلات الأداء" />} />
            <Route path="settings" element={<Settings />} />
            <Route path="superadmin" element={<SuperAdmin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
