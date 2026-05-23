import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPage from './pages/ForgotPage';
import ResetPage from './pages/ResetPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import TransferPage from './pages/TransferPage';
import CardsPage from './pages/CardsPage';
import SecurityPage from './pages/SecurityPage';

export default function App() {
  const { authLoading, currentUser, showToast, toastMessage, toastType } = useApp();

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-950">
      <div className="text-white text-center">
        <i className="fas fa-spinner fa-spin text-3xl mb-3 block"></i>
        <p className="text-sm opacity-70">Duke ngarkuar…</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Global toast — visible on all pages */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-[60] px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm text-white font-semibold animate-bounce max-w-xs sm:max-w-sm ${
          toastType === 'error' ? 'bg-red-500' : toastType === 'info' ? 'bg-slate-800' : 'bg-blue-600'
        }`}>
          <i className={`fas ${toastType === 'error' ? 'fa-times-circle' : toastType === 'info' ? 'fa-circle-info' : 'fa-check-circle'}`}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      <Routes>
        <Route path="/login"    element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={currentUser ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="/forgot"   element={<ForgotPage />} />
        <Route path="/reset"    element={<ResetPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transfer"     element={<TransferPage />} />
            <Route path="/cards"        element={<CardsPage />} />
            <Route path="/security"     element={<SecurityPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </>
  );
}
