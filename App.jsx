import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function App() {
  // ====== STATES FOR FORM INPUTS ======
  // BACKEND: Këto shtete mbajnë vlerat aktuale të shkruara në inpute.
  // Mund t'i përdorni direkt te payload-i i kërkesave tuaja (POST/PUT).
  const [currentPage, setCurrentPage] = useState('login');
  const [loginType, setLoginType] = useState('individ'); // 'individ' ose 'biznes'
  const [transferTab, setTransferTab] = useState('tab-sub-transfer');
  
  // Timers & Alerts States
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success', 'error', 'info'
  const [showSessionBanner, setShowSessionBanner] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(30);

  // Form Inputs States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginNipt, setLoginNipt] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  // Password Visibility States
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Refs for Timers & Chart
  const sessionTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const INACTIVITY_TIME = 90000; // 1.5 minuta inaktivitet para paralajmërimit (Total 2 min)

  // ====== TOAST FUNCTION ======
  // BACKEND: Thërrisni këtë funksion për të shfaqur mesazhe gabimi ose suksesi nga API.
  // Shembull: triggerToast("Fjalëkalimi gabim!", "error") ose triggerToast("U krye!", "success")
  const triggerToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // ====== INACTIVITY MONITOR ======
  const startSessionMonitor = () => {
    stopSessionMonitor();
    if (['login', 'register', 'forgot', 'reset'].includes(currentPage)) return;

    sessionTimerRef.current = setTimeout(() => {
      setShowSessionBanner(true);
      startCountdown();
    }, INACTIVITY_TIME);
  };

  const stopSessionMonitor = () => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setShowSessionBanner(false);
  };

  const startCountdown = () => {
    setSessionTimeLeft(30);
  };

  // Handle countdown tracking
  useEffect(() => {
    if (showSessionBanner) {
      countdownTimerRef.current = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            autoLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [showSessionBanner]);

  // Reset timer on user activity
  useEffect(() => {
    const handleActivity = () => {
      if (!showSessionBanner) {
        startSessionMonitor();
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, handleActivity));

    // Inicializo monitorimin nëse jemi brenda aplikacionit
    startSessionMonitor();

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      stopSessionMonitor();
    };
  }, [currentPage, showSessionBanner]);

  const resetSessionTimeout = () => {
    setShowSessionBanner(false);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    startSessionMonitor();
    triggerToast("Sesioni juaj u zgjat me sukses.", "success");
  };

  const autoLogout = () => {
    stopSessionMonitor();
    triggerToast("Auto-Logout: Keni qenë inaktiv për 2 minuta!", "error");
    setCurrentPage('login');
  };

  const handleLogout = () => {
    triggerToast("U çidentifikuat në mënyrë të sigurt.", "info");
    setCurrentPage('login');
  };

  // ====== CHART.JS INITIALIZATION ======
  useEffect(() => {
    if (currentPage === 'dashboard' && chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          // -----------------------------------------------------------------
          // BACKEND DEVELOPERS: DATA INDICATION FOR CHART
          // Vendosni këtu dinamikisht datat/muajt (labels) dhe shumat (data)
          // duke bërë map të dhënat që vijnë nga statistikat e serverit tuaj.
          // -----------------------------------------------------------------
          labels: [], // Bosh - duhet të mbushet nga DB (Psh: ['Jan', 'Shk', 'Mar'])
          datasets: [{
            label: 'Shpenzime (€)',
            data: [], // Bosh - duhet të mbushet nga DB (Psh: [200, 450, 150])
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [currentPage]);

  // ====== HANDLERS ======
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!captchaChecked) {
      triggerToast("Ju lutem plotësoni CAPTCHA-n!", "error");
      return;
    }
    
    // -----------------------------------------------------------------
    // BACKEND DEVELOPERS: AUTHENTICATION POST REQUEST
    // Këtu duhet të nisni kërkesën drejt API-së tuaj të autentikimit.
    // Variablat që keni gati për payload:
    // { loginEmail, loginPassword, loginPin, loginType, loginNipt, rememberDevice }
    // Nëse statusi është OK -> setCurrentPage('dashboard')
    // -----------------------------------------------------------------
    triggerToast("Forma e llogarisë u dërgua për verifikim...", "info");
    setCurrentPage('dashboard');
  };

  // Helper dynamic sidebar style
  const getSidebarClass = (pageId) => {
    return currentPage === pageId
      ? "flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm transition-all"
      : "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 font-medium text-sm transition-all";
  };

  // Helper dynamic sub-tab transfer styles
  const getSubTabClass = (tabId) => {
    return transferTab === tabId
      ? "w-full py-2 rounded-lg bg-white dark:bg-slate-800 text-blue-600 shadow-xs"
      : "w-full py-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm text-white font-semibold animate-bounce ${
          toastType === 'error' ? 'bg-red-500' : toastType === 'info' ? 'bg-slate-800' : 'bg-blue-600'
        }`}>
          <i className={`fas ${toastType === 'error' ? 'fa-times-circle' : toastType === 'info' ? 'fa-circle-info' : 'fa-check-circle'}`}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SESSION TIMEOUT BANNER */}
      {showSessionBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-slate-950 px-4 py-3 text-center text-sm font-semibold z-50 flex flex-col sm:flex-row justify-center items-center gap-3">
          <span><i className="fas fa-exclamation-triangle mr-2"></i> Sesioni juaj po mbaron për <span className="font-bold">{sessionTimeLeft}</span> sekonda për shkak të mosaktivitetit.</span>
          <button onClick={resetSessionTimeout} className="bg-slate-950 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-900 transition">Rri i lidhur</button>
        </div>
      )}

      {/* AUTH CONTAINER (LOGIN, REGISTER, FORGOT, RESET) */}
      {['login', 'register', 'forgot', 'reset'].includes(currentPage) && (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-950">
          
          {/* LOGIN PAGE */}
          {currentPage === 'login' && (
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight"><i className="fas fa-university mr-2"></i>FIBANK</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Identifikim i Sigurt</p>
              </div>

              {/* INDIVID / BIZNES SWITCHER */}
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl mb-6">
                <button type="button" onClick={() => setLoginType('individ')} className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'individ' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}>
                  <i className="fas fa-user mr-1"></i> Individ
                </button>
                <button type="button" onClick={() => setLoginType('biznes')} className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'biznes' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}>
                  <i className="fas fa-briefcase mr-1"></i> Biznes
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Numër Klienti / Numër Personal</label>
                  <input type="text" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>

                {/* FIELD UNIQUE TO BIZNES */}
                {loginType === 'biznes' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">ID Kompanie / NIPT</label>
                    <input type="text" value={loginNipt} onChange={(e) => setLoginNipt(e.target.value)} required placeholder="M12345678X" className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Fjalëkalimi</label>
                  <div className="relative flex items-center">
                    <input type={showLoginPass ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="w-full px-4 py-2.5 pr-10 rounded-xl border dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3 text-slate-400 hover:text-blue-500">
                      <i className={`fas ${showLoginPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">PIN i Sigurisë (4 Shifra)</label>
                  <input type="password" maxLength={4} placeholder="••••" value={loginPin} onChange={(e) => setLoginPin(e.target.value)} required className="w-full text-center tracking-widest text-lg px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-slate-500">Kujto këtë pajisje</span>
                  </label>
                  <button type="button" onClick={() => setCurrentPage('forgot')} className="text-blue-600 font-medium hover:underline bg-transparent border-0 cursor-pointer">Harruat Fjalëkalimin?</button>
                </div>

                {/* CAPTCHA Anti-bot */}
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="captcha-check" checked={captchaChecked} onChange={(e) => setCaptchaChecked(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <label htmlFor="captcha-check" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">Unë nuk jam robot</label>
                  </div>
                  <span className="text-blue-600 text-lg"><i className="fas fa-shield-halved"></i></span>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition">Hyni në Llogari</button>
              </form>
              <p className="text-center text-xs text-slate-500 mt-6">Nuk keni llogari elektronikisht? <button onClick={() => setCurrentPage('register')} className="text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer ml-1">Regjistrohu</button></p>
            </div>
          )}

          {/* REGISTER PAGE */}
          {currentPage === 'register' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400">FIBANK</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Hap llogari të re digjitale</p>
              </div>
              {/* ---------------------------------------------------------------
                 BACKEND DEVELOPERS: REGISTER FORM
                 Lidhni një funksion handleRegister për të dërguar fushat në POST /api/register
                 --------------------------------------------------------------- */}
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Emri i Plotë</label>
                  <input type="text" required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Email</label>
                  <input type="email" required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Fjalëkalimi</label>
                  <div className="relative flex items-center">
                    <input type={showRegPass ? "text" : "password"} required className="w-full px-4 py-2.5 pr-10 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3 text-slate-400 hover:text-blue-500">
                      <i className={`fas ${showRegPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <button type="submit" onClick={() => triggerToast("Përditësuar nga DB së shpejti", "info")} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition">Vazhdo Regjistrimin</button>
              </form>
              <p className="text-center text-xs text-slate-500 mt-6"><button onClick={() => setCurrentPage('login')} className="text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer">Kthehu tek Krahina e Loginit</button></p>
            </div>
          )}

          {/* FORGOT PASSWORD PAGE */}
          {currentPage === 'forgot' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Rifito Qasjen</h2>
                <p className="text-slate-500 text-xs mt-1">Shkruani email-in tuaj për të pranuar kodin OTP të rivendosjes.</p>
              </div>
              {/* ---------------------------------------------------------------
                 BACKEND DEVELOPERS: REQUEST FORGOT PASSWORD (OTP SUBMIT)
                 Kërkesa: POST /api/auth/forgot-password -> dërgon email-in
                 --------------------------------------------------------------- */}
              <form onSubmit={(e) => { e.preventDefault(); setCurrentPage('reset'); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Email Adresa</label>
                  <input type="email" required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition">Dërgo Kodin</button>
              </form>
            </div>
          )}

          {/* RESET PASSWORD PAGE */}
          {currentPage === 'reset' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-500"><i className="fas fa-lock-open mr-2"></i>Reset Password</h2>
                <p className="text-slate-500 text-xs mt-1">Vendosni fjalëkalimin e ri të sigurisë.</p>
              </div>
              {/* ---------------------------------------------------------------
                 BACKEND DEVELOPERS: SAVE NEW PASSWORD
                 Kërkesa: POST /api/auth/reset-password (Bashkë me Kodin OTP)
                 --------------------------------------------------------------- */}
              <form onSubmit={(e) => { e.preventDefault(); triggerToast("Fjalëkalimi u ndryshua!", "success"); setCurrentPage('login'); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Fjalëkalimi i Ri</label>
                  <div className="relative flex items-center">
                    <input type={showResetPass ? "text" : "password"} required className="w-full px-4 py-2.5 pr-10 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => setShowResetPass(!showResetPass)} className="absolute right-3 text-slate-400 hover:text-blue-500">
                      <i className={`fas ${showResetPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition">Përditëso Fjalëkalimin</button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* MAIN APP WRAPPER (DASHBOARD, TRANSACTIONS, ETC.) */}
      {!['login', 'register', 'forgot', 'reset'].includes(currentPage) && (
        <div className="min-h-screen flex flex-col md:flex-row">
          
          {/* SIDEBAR NAVIGATION - RESPONSIVE & MOBILE FRIENDLY */}
          <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between p-4 sticky top-0 z-40 md:h-screen">
            <div>
              <div className="flex items-center justify-between mb-4 md:mb-8 px-2 py-2 md:py-4">
                <h1 className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight"><i className="fas fa-university mr-2"></i>FIBANK</h1>
              </div>
              
              <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none space-y-0 md:space-y-1">
                <button onClick={() => setCurrentPage('dashboard')} className={`${getSidebarClass('dashboard')} whitespace-nowrap`}>
                  <i className="fas fa-th-large w-5 text-blue-500"></i> Dashboard
                </button>
                <button onClick={() => setCurrentPage('transactions')} className={`${getSidebarClass('transactions')} whitespace-nowrap`}>
                  <i className="fas fa-exchange-alt w-5 text-blue-500"></i> Transaksionet
                </button>
                <button onClick={() => setCurrentPage('transfer')} className={`${getSidebarClass('transfer')} whitespace-nowrap`}>
                  <i className="fas fa-paper-plane w-5 text-blue-500"></i> Transfero Para
                </button>
                <button onClick={() => setCurrentPage('cards')} className={`${getSidebarClass('cards')} whitespace-nowrap`}>
                  <i className="fas fa-credit-card w-5 text-blue-500"></i> Kartat e Mia
                </button>
                <button onClick={() => setCurrentPage('security')} className={`${getSidebarClass('security')} whitespace-nowrap`}>
                  <i className="fas fa-shield-halved w-5 text-blue-500"></i> Siguria & Cilësimet
                </button>
              </nav>
            </div>
            <div className="pt-2 md:pt-4 border-t border-slate-200 dark:border-slate-700 mt-2 md:mt-0">
              {/* ---------------------------------------------------------------
                 BACKEND DEVELOPERS: LOGOUT ACTION
                 Pastroni tokenat/sessionet këtu përpara se ta ktheni tek 'login'.
                 --------------------------------------------------------------- */}
              <button onClick={handleLogout} className="w-full flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold text-sm transition-all"><i className="fas fa-sign-out-alt w-5"></i> <span className="hidden md:inline">Dil nga Llogaria</span></button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">

            {/* PAGE: DASHBOARD */}
            {currentPage === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    {/* BACKEND: Vendosni emrin e përdoruesit në vend të fjalës "Llogaria" */}
                    <h2 className="text-2xl font-bold"><span className="text-blue-600">Llogaria</span></h2>
                    <p className="text-slate-500 text-xs">FIBANK Digital Banking - Sistemi juaj është i mbrojtur.</p>
                  </div>
                  {/* BACKEND: Vendosni statusin e klientit te kjo ID (Psh. VIP, Premium, Standard) */}
                  <span id="account-badge" className="px-3 py-1 rounded-full text-xs font-bold"></span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between h-44 sm:h-48 lg:col-span-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs opacity-70 uppercase tracking-wider">Balanca e Disponueshme</p>
                        {/* BACKEND: Injektoni vlerën monetare reale këtu (Psh. € 4,500.00) */}
                        <h3 className="text-2xl sm:text-3xl font-black mt-1">--</h3>
                      </div>
                      <i className="fas fa-wallet text-3xl opacity-50"></i>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-60 tracking-widest uppercase">IBAN primar</p>
                      {/* BACKEND: Injektoni numrin e IBAN-it të klientit këtu */}
                      <p className="font-mono text-xs sm:text-sm tracking-wider mt-0.5">--</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                    <h3 className="font-bold text-sm uppercase text-slate-400 tracking-wider mb-3 lg:mb-0">Veprime të Shpejta</h3>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <button onClick={() => { setCurrentPage('transfer'); setTransferTab('tab-sub-transfer'); }} className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:scale-105 transition-transform"><i className="fas fa-paper-plane block mb-1 text-lg"></i>Dërgo</button>
                      <button onClick={() => { setCurrentPage('transfer'); setTransferTab('tab-sub-fatura'); }} className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:scale-105 transition-transform"><i className="fas fa-file-invoice block mb-1 text-lg"></i>Fatura</button>
                      <button onClick={() => { setCurrentPage('transfer'); setTransferTab('tab-sub-kembim'); }} className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:scale-105 transition-transform"><i className="fas fa-plus block mb-1 text-lg"></i>Këmbim</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2">
                    <h3 className="font-bold text-sm mb-4 uppercase text-slate-400">Analiza e Shpenzimeve</h3>
                    <div className="h-64 relative"><canvas ref={chartRef}></canvas></div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-sm mb-4 uppercase text-slate-400">Transaksionet e Fundit</h3>
                    {/* ---------------------------------------------------------
                       BACKEND DEVELOPERS: RECENT TRANSACTIONS CONTAINER
                       Mbusheni këtë div me një `.map` loop që afishon 3 ose 4 
                       transaksionet e fundit të marra nga GET /api/transactions
                       --------------------------------------------------------- */}
                    <div id="dash-recent-list" className="space-y-4">
                      {/* Bosh per databaze */}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE: TRANSACTIONS */}
            {currentPage === 'transactions' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Historia e Transaksioneve</h2>
                    <p className="text-slate-500 text-xs">Mundësia për të kërkuar dhe filtruar në kohë reale.</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <i className="fas fa-search absolute left-3 top-3 text-slate-400 text-xs"></i>
                    {/* BACKEND: Lidhni funksionin e filtrimit ose kërkimit (onChange query) këtu */}
                    <input type="text" placeholder="Kërko për përfitues ose kategori..." className="w-full pl-9 pr-4 py-2 text-xs border dark:border-slate-700 rounded-xl bg-transparent outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-x-auto border dark:border-slate-700">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 uppercase font-semibold text-slate-400">
                      <tr>
                        <th className="p-4">Përfituesi</th>
                        <th className="p-4">Kategoria</th>
                        <th className="p-4">Data</th>
                        <th className="p-4 text-right">Shuma</th>
                      </tr>
                    </thead>
                    {/* ---------------------------------------------------------
                       BACKEND DEVELOPERS: FULL TRANSACTION LIST TABLE BODY
                       Bëni loop rreshtat `<tr>` duke specifikuar ngjyrën e shumës
                       (tekst-red-500 nëse është minus/shpenzim, tekst-green-500 nëse është plus)
                       --------------------------------------------------------- */}
                    <tbody id="page-tx-table-body" className="divide-y divide-slate-100 dark:divide-slate-700">
                      {/* Bosh per databaze */}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAGE: MONEY TRANSFER */}
            {currentPage === 'transfer' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-xl font-bold">Transferta & Shërbime Financiare</h2>
                
                {/* Horizontal navigation tabs per transfertat */}
                <div className="flex overflow-x-auto gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-center text-xs font-bold scrollbar-none whitespace-nowrap">
                  <button onClick={() => setTransferTab('tab-sub-transfer')} className={getSubTabClass('tab-sub-transfer')}>Transferta</button>
                  <button onClick={() => setTransferTab('tab-sub-pagesa')} className={getSubTabClass('tab-sub-pagesa')}>Pagesa</button>
                  <button onClick={() => setTransferTab('tab-sub-fatura')} className={getSubTabClass('tab-sub-fatura')}>Fatura</button>
                  <button onClick={() => setTransferTab('tab-sub-kembim')} className={getSubTabClass('tab-sub-kembim')}>Këmbim Valute</button>
                  <button onClick={() => setTransferTab('tab-sub-pakarte')} className={getSubTabClass('tab-sub-pakarte')}>Pa Kartë</button>
                </div>

                {/* SUB 1: TRANSFERTA FORM */}
                {transferTab === 'tab-sub-transfer' && (
                  /* -----------------------------------------------------------
                     BACKEND DEVELOPERS: BANK TRANSFER POST ACTION
                     Krijoni një funksion për të dërguar këto 3 fusha në:
                     POST /api/transfer/execute
                     ----------------------------------------------------------- */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase">Emri i Marrësit</label>
                      <input type="text" className="w-full px-4 py-2 rounded-xl border dark:border-slate-700 bg-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase">IBAN</label>
                      <input type="text" placeholder="ALXX XXXX XXXX XXXX" className="w-full px-4 py-2 rounded-xl border dark:border-slate-700 bg-transparent font-mono text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase">Shuma (€)</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border dark:border-slate-700 bg-transparent text-sm" />
                    </div>
                    <button type="button" onClick={() => triggerToast("Ekzekutuar nga Backend së shpejti", "success")} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm transition hover:bg-blue-700">Ekzekuto</button>
                  </div>
                )}

                {/* SUB 2: PAGESA */}
                {transferTab === 'tab-sub-pagesa' && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                    <h3 className="text-sm font-bold text-blue-600"><i className="fas fa-building-columns mr-1"></i> Pagesa Institucionale</h3>
                    <div className="text-xs space-y-3">
                      <div>
                        <label className="block font-medium mb-1">Përfituesi (Institucioni)</label>
                        {/* BACKEND: Mbusni dinamikisht opsionet e select-it nga databaza */}
                        <select className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl dark:bg-slate-800">
                          {/* Dinamike nga DB */}
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Kodi i Referencës</label>
                        <input type="text" className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl" />
                      </div>
                    </div>
                    <button type="button" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs">Kryej Pagesën</button>
                  </div>
                )}

                {/* SUB 3: FATURA */}
                {transferTab === 'tab-sub-fatura' && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                    <h3 className="text-sm font-bold text-blue-600"><i className="fas fa-file-invoice mr-1"></i> Pagesë Fature Utiliteti</h3>
                    <div className="text-xs space-y-3">
                      <div>
                        <label className="block font-medium mb-1">Ofruesi i Shërbimit</label>
                        {/* BACKEND: Mbusni listën e kompanive (OSHEE, UKT, etj.) nga databaza */}
                        <select className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl dark:bg-slate-800">
                          {/* Dinamike nga DB */}
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Kodi i faturës / Kontratës</label>
                        <input type="text" className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl" />
                      </div>
                    </div>
                    <button type="button" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs">Paguaj Faturën</button>
                  </div>
                )}

                {/* SUB 4: KEMBIM VALUTE */}
                {transferTab === 'tab-sub-kembim' && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                    <h3 className="text-sm font-bold text-blue-600"><i className="fas fa-rotate mr-1"></i> Këmbim Valutor Digjital</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><label className="block font-medium mb-1">Nga Valuta</label><select className="w-full p-2 border dark:border-slate-700 bg-transparent rounded-lg dark:bg-slate-800"><option>EUR</option><option>ALL</option></select></div>
                      <div><label className="block font-medium mb-1">Në Valuta</label><select className="w-full p-2 border dark:border-slate-700 bg-transparent rounded-lg dark:bg-slate-800"><option>ALL</option><option>EUR</option></select></div>
                      <div className="col-span-2"><label className="block font-medium mb-1">Shuma për Këmbim</label><input type="number" placeholder="0.00" className="w-full p-2 border dark:border-slate-700 bg-transparent rounded-lg" /></div>
                    </div>
                    {/* BACKEND: Lidhni veprimin e këmbimit valutor duke llogaritur kursin e ditës */}
                    <button type="button" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs">Konfirmo Këmbimin</button>
                  </div>
                )}

                {/* SUB 5: PA KARTE */}
                {transferTab === 'tab-sub-pakarte' && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                    <h3 className="text-sm font-bold text-blue-600"><i className="fas fa-money-bill-wave mr-1"></i> Tërheqje Pa Kartë në ATM</h3>
                    <p className="text-xs text-slate-400">Gjeneroni një kod unik për të tërhequr para direkt nga çdo ATM e FIBANK pa përdorur kartë fizike.</p>
                    <div className="text-xs">
                      <label className="block font-semibold mb-1">Shuma e Tërheqjes</label>
                      <select className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl dark:bg-slate-800"><option>€20</option><option>€50</option><option>€100</option></select>
                    </div>
                    {/* BACKEND: Ktheu një kod token 6-shifror nga API për t'ia shfaqur klientit */}
                    <button type="button" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm">Gjenero Kodin Token</button>
                  </div>
                )}
              </div>
            )}

            {/* PAGE: CARDS MANAGEMENT */}
            {currentPage === 'cards' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Menaxhimi i Kartave Bankare</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white p-6 rounded-2xl shadow-xl h-48 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        {/* BACKEND: Injektoni emrin e llojit të kartës */}
                        <p className="text-xs opacity-50 font-bold">FIBANK PREMIUM</p>
                        <p className="text-xs">--</p>
                      </div>
                      <i className="fab fa-cc-mastercard text-3xl text-amber-500"></i>
                    </div>
                    {/* BACKEND: Injektoni numrin e maskuar të kartës (Psh. 5412 •••• •••• 8804) */}
                    <p className="font-mono tracking-widest text-base sm:text-lg text-center">•••• •••• •••• ••••</p>
                    <div className="flex justify-between text-[10px] opacity-70">
                      {/* BACKEND: Injektoni emrin e mbajtësit dhe datën e skadencës */}
                      <span>--</span>
                      <span>VALIDE: --/--</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4 text-sm">
                    <h3 className="font-bold">Aksionet e Sigurisë</h3>
                    {/* BACKEND: Lidhni gjendjen e checkbox me një API PUT/POST për ngrirjen e kartës */}
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-3 rounded-xl">
                      <span>Ngrij / Blloko Kartën</span>
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE: SECURITY SETTINGS */}
            {currentPage === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold"><i className="fas fa-shield-halved text-blue-600 mr-2"></i>Siguria & Cilësimet</h2>
                  <p className="text-slate-500 text-xs">Përfshin kontrollin e pajisjeve, ndryshimin e kodeve si dhe qendrën e integruar të mesazheve & njoftimeve.</p>
                </div>

                {/* SHTYLLAT: NJOFTIMET, KERKESAT, APROVIMET */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* BACKEND: Maponi listën e njoftimeve të sistemit brenda këtij divi */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-700"><i className="fas fa-bullhorn text-blue-500 mr-1"></i> Njoftimet</h4>
                    <div id="db-notifications-container" className="space-y-2"></div>
                  </div>
                  {/* BACKEND: Maponi kërkesat aktive (Psh. për kredi, libreza të reja) këtu */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-700"><i className="fas fa-envelope-open-text text-blue-500 mr-1"></i> Kërkesat e Mia</h4>
                    <div id="db-requests-container" className="space-y-2"></div>
                  </div>
                  {/* BACKEND: Maponi transaksionet pezull që presin miratim ose nënshkrim digjital (2FA) */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-700"><i className="fas fa-signature text-blue-500 mr-1"></i> Aprovimet</h4>
                    <div id="db-approvals-container" className="space-y-2"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  
                  {/* TRUSTED DEVICES LIST */}
                  {/* BACKEND: Renditni pajisjet nga ku klienti është loguar dhe ofroni opsionin për të bërë Revoke/Delete Token */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 space-y-4">
                    <h3 className="font-bold text-sm uppercase text-slate-400"><i className="fas fa-laptop-medical mr-2 text-blue-500"></i>Trusted Devices List</h3>
                    <div id="db-devices-container" className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-700"></div>
                  </div>

                  {/* CHANGE PASSWORD FORM */}
                  {/* BACKEND: Lidhni veprimin e formularit për të ndryshuar fjalëkalimin aktual me një fjalëkalim të ri */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 space-y-4">
                    <h3 className="font-bold text-sm uppercase text-slate-400"><i className="fas fa-key mr-2 text-blue-500"></i>Ndryshimet e Kredencialeve</h3>
                    <form onSubmit={(e) => { e.preventDefault(); triggerToast("Dërguar në server!", "info"); }} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-medium mb-1">Fjalëkalimi Aktual</label>
                        <div className="relative flex items-center">
                          <input type={showCurrPass ? "text" : "password"} className="w-full p-2 pr-10 border dark:border-slate-700 bg-transparent rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
                          <button type="button" onClick={() => setShowCurrPass(!showCurrPass)} className="absolute right-3 text-slate-400 hover:text-blue-500"><i className={`fas ${showCurrPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                        </div>
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Fjalëkalimi i Ri</label>
                        <div className="relative flex items-center">
                          <input type={showNewPass ? "text" : "password"} className="w-full p-2 pr-10 border dark:border-slate-700 bg-transparent rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
                          <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 text-slate-400 hover:text-blue-500"><i className={`fas ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold transition hover:bg-blue-700">Përditëso</button>
                    </form>
                  </div>

                  {/* LOGIN HISTORY & AUDITING */}
                  {/* BACKEND: Shfaqni historikun e plotë të hyni-ve me status 'Success' ose 'Failed' për çështje auditi të sigurisë */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-sm uppercase text-slate-400"><i className="fas fa-history mr-2 text-blue-500"></i>Login History & Auditing</h3>
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 uppercase font-semibold text-slate-400">
                          <tr>
                            <th className="p-3">Pajisja / Browser</th>
                            <th className="p-3">IP Adresa</th>
                            <th className="p-3">Data / Ora</th>
                            <th className="p-3">Statusi</th>
                          </tr>
                        </thead>
                        <tbody id="db-audit-table-body" className="divide-y divide-slate-100 dark:divide-slate-700"></tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </main>
        </div>
      )}
    </div>
  );
}
