import React, { useState, useRef, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useApp } from '../context/AppContext';
import useInactivityLogout from '../hooks/useInactivityLogout';

export default function Layout() {
  const { handleLogout, triggerToast, darkMode, setDarkMode } = useApp();
  const navigate = useNavigate();

  const [mobileNavOpen,    setMobileNavOpen]    = useState(false);
  const [showSessionBanner, setShowSessionBanner] = useState(false);
  const [sessionTimeLeft,   setSessionTimeLeft]   = useState(20);
  const countdownRef = useRef(null);

  const doLogout = useCallback(() => {
    setShowSessionBanner(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    triggerToast('Auto-Logout: Keni qenë inaktiv!', 'error');
    handleLogout();
    navigate('/login');
  }, [handleLogout, navigate, triggerToast]);

  const onWarning = useCallback(() => {
    setShowSessionBanner(true);
    setSessionTimeLeft(20);
    let left = 20;
    countdownRef.current = setInterval(() => {
      left -= 1;
      setSessionTimeLeft(left);
      if (left <= 0) {
        clearInterval(countdownRef.current);
        doLogout();
      }
    }, 1000);
  }, [doLogout]);

  useInactivityLogout(onWarning, 120000);

  const resetSessionTimeout = () => {
    setShowSessionBanner(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
    triggerToast('Sesioni juaj u zgjat me sukses.', 'success');
  };

  return (
    <div className="min-h-screen flex">
      {mobileNavOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      <Sidebar mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileNavOpen(true)} className="text-slate-600 dark:text-slate-300 p-1">
            <i className="fas fa-bars text-xl"></i>
          </button>
          <h1 className="text-xl font-black text-blue-600 dark:text-blue-400"><i className="fas fa-university mr-1"></i>FIBANK</h1>
          <button onClick={() => setDarkMode(!darkMode)} className="text-slate-500 p-1">
            <i className={`fas ${darkMode ? 'fa-sun text-yellow-400' : 'fa-moon'}`}></i>
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {showSessionBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-slate-950 px-4 py-3 text-center text-sm font-semibold z-50 flex flex-col sm:flex-row justify-center items-center gap-3">
          <span><i className="fas fa-exclamation-triangle mr-2"></i>Sesioni po mbaron pas <strong>{sessionTimeLeft}</strong>s mosaktiviteti.</span>
          <button onClick={resetSessionTimeout} className="bg-slate-950 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition">Rri i lidhur</button>
        </div>
      )}
    </div>
  );
}
