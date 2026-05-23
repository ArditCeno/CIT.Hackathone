import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Sidebar({ mobileNavOpen, setMobileNavOpen }) {
  const { currentUser, darkMode, setDarkMode, handleLogout, triggerToast, unreadCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const USER = {
    name:   currentUser?.full_name || 'Arjola Hoxha',
    status: currentUser?.role === 'admin' ? 'Admin' : 'Premium',
  };

  const navTo = (path) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  const getSidebarClass = (path) =>
    location.pathname === path
      ? 'flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm transition-all whitespace-nowrap'
      : 'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 font-medium text-sm transition-all whitespace-nowrap';

  const logout = () => {
    handleLogout();
    triggerToast('U çidentifikuat në mënyrë të sigurt.', 'error');
    navigate('/login');
  };

  return (
    <aside className={`
      fixed md:relative inset-y-0 left-0 z-50 md:z-auto
      w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
      flex flex-col justify-between p-4
      transition-transform duration-300
      ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
    `}>
      <div>
        <div className="flex items-center justify-between mb-8 px-2 pt-2">
          <h1 className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            <i className="fas fa-university mr-2"></i>FIBANK
          </h1>
          <button onClick={() => setMobileNavOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl px-3 py-3 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {USER.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{USER.name}</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{USER.status}</p>
          </div>
        </div>

        <nav className="space-y-1">
          <button onClick={() => navTo('/dashboard')}    className={getSidebarClass('/dashboard')}><i className="fas fa-th-large w-5 text-blue-500"></i>Dashboard</button>
          <button onClick={() => navTo('/transactions')} className={getSidebarClass('/transactions')}><i className="fas fa-exchange-alt w-5 text-blue-500"></i>Transaksionet</button>
          <button onClick={() => navTo('/transfer')}     className={getSidebarClass('/transfer')}><i className="fas fa-paper-plane w-5 text-blue-500"></i>Transfero Para</button>
          <button onClick={() => navTo('/cards')}        className={getSidebarClass('/cards')}><i className="fas fa-credit-card w-5 text-blue-500"></i>Kartat e Mia</button>
          <button onClick={() => navTo('/security')} className={getSidebarClass('/security')}>
            <i className="fas fa-shield-halved w-5 text-blue-500"></i>
            Siguria
            {unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm transition-all">
          <i className={`fas ${darkMode ? 'fa-sun text-yellow-400' : 'fa-moon text-slate-400'} w-5`}></i>
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold text-sm transition-all">
          <i className="fas fa-sign-out-alt w-5"></i>Dil nga Llogaria
        </button>
      </div>
    </aside>
  );
}
