import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';

const TOKEN_KEY = 'guardian_token';

// ── GuardianAI demo presets ───────────────────────────────────────────────────
const SCAN_PRESETS = [
  {
    label: 'Normal', icon: 'fa-check-circle', color: 'green',
    payload: { transaction_amount: 85.50, hour_of_day: 14, is_new_device: 0, is_new_ip: 0, is_foreign_country: 0, distance_from_usual_km: 3.2, is_phishing_detected: 0 },
  },
  {
    label: 'Account Takeover', icon: 'fa-user-secret', color: 'yellow',
    payload: { transaction_amount: 150.00, hour_of_day: 10, is_new_device: 1, is_new_ip: 1, is_foreign_country: 0, distance_from_usual_km: 5000.0, is_phishing_detected: 0 },
  },
  {
    label: 'Smishing SMS', icon: 'fa-comment-slash', color: 'orange',
    payload: { transaction_amount: 150.00, hour_of_day: 11, is_new_device: 0, is_new_ip: 0, is_foreign_country: 0, distance_from_usual_km: 2.0, is_phishing_detected: 0, sms_payload: 'Ju lutem verifikoni llogarinë tuaj në Fibank urgjentisht në këtë link: http://fibank-verify.ru/login' },
  },
  {
    label: 'Phishing URL', icon: 'fa-fish', color: 'red',
    payload: { transaction_amount: 500.00, hour_of_day: 9, is_new_device: 0, is_new_ip: 0, is_foreign_country: 0, distance_from_usual_km: 1.0, is_phishing_detected: 0, detected_url: 'https://secure-fibank.phish.ru/account/update' },
  },
];

// ── Static demo data ──────────────────────────────────────────────────────────
const RECENT_TRANSACTIONS = [
  { id: 'KA_E003', date: '15 Qer 2025, 13:15', type: 'Transfer', recipient: 'Unknown (Rome)', amount: -5000.00, fraud: true },
  { id: 'KA_E002', date: '15 Qer 2025, 13:00', type: 'Login Anomaly', recipient: 'IP: 89.96.123.45', amount: null, fraud: true },
  { id: 'T001',    date: '10 Qer 2025, 09:30', type: 'Payment',  recipient: 'OSHEE sh.a.', amount: -125.50, fraud: false },
  { id: 'T002',    date: '08 Qer 2025, 14:20', type: 'Transfer', recipient: 'Besnik Kola', amount: -350.00, fraud: false },
  { id: 'T003',    date: '05 Qer 2025, 11:05', type: 'Deposit',  recipient: 'Paga Mujore', amount: +2100.00, fraud: false },
];

const ALL_TRANSACTIONS = [
  { id: 'KA_E003', date: '2025-06-15 13:15', type: 'Transfer',      recipient: 'Unknown (Rome)',  amount: -5000.00, city: 'Rome',   device: 'Desktop_Windows', fraud: true },
  { id: 'KA_E002', date: '2025-06-15 13:00', type: 'Login',         recipient: 'IP 89.96.123.45', amount: null,     city: 'Rome',   device: 'Desktop_Windows', fraud: true },
  { id: 'KA_E001', date: '2025-06-15 10:00', type: 'Login',         recipient: 'Normal Session',  amount: null,     city: 'Tiranë', device: 'Desktop_Windows', fraud: false },
  { id: 'T001',    date: '2025-06-10 09:30', type: 'Payment',       recipient: 'OSHEE sh.a.',     amount: -125.50,  city: 'Tiranë', device: 'Mobile_iOS',      fraud: false },
  { id: 'T002',    date: '2025-06-08 14:20', type: 'Transfer',      recipient: 'Besnik Kola',     amount: -350.00,  city: 'Berat',  device: 'Desktop_Mac',     fraud: false },
  { id: 'T003',    date: '2025-06-05 11:05', type: 'Deposit',       recipient: 'Paga Mujore',     amount: +2100.00, city: 'Tiranë', device: 'Desktop_Mac',     fraud: false },
  { id: 'T004',    date: '2025-05-28 16:44', type: 'Payment',       recipient: 'UKT Ujësjellës',  amount: -48.20,   city: 'Tiranë', device: 'Mobile_iOS',      fraud: false },
  { id: 'T005',    date: '2025-05-20 10:10', type: 'Transfer',      recipient: 'Elona Dervishi',  amount: -200.00,  city: 'Tiranë', device: 'Desktop_Mac',     fraud: false },
  { id: 'T006',    date: '2025-04-18 02:33', type: 'Transfer',      recipient: 'Unknown',         amount: -1800.00, city: 'Berlin', device: 'Mobile_Android',  fraud: true },
  { id: 'T007',    date: '2025-04-01 09:00', type: 'Deposit',       recipient: 'Paga Mujore',     amount: +2100.00, city: 'Tiranë', device: 'Desktop_Mac',     fraud: false },
];

const CITY_RISK = [
  { city: 'Rome',    total: 3,   fraud: 3,  rate: 100.0 },
  { city: 'Berlin',  total: 5,   fraud: 5,  rate: 100.0 },
  { city: 'Milan',   total: 3,   fraud: 3,  rate: 100.0 },
  { city: 'Istanbul',total: 2,   fraud: 2,  rate: 100.0 },
  { city: 'Athens',  total: 2,   fraud: 2,  rate: 100.0 },
  { city: 'Elbasan', total: 89,  fraud: 13, rate: 14.61 },
  { city: 'Lezhë',   total: 49,  fraud: 6,  rate: 12.24 },
  { city: 'Vlorë',   total: 103, fraud: 12, rate: 11.65 },
  { city: 'Berat',   total: 163, fraud: 16, rate: 9.82 },
  { city: 'Shkodër', total: 88,  fraud: 8,  rate: 9.09 },
];

const LOGIN_HISTORY = [
  { device: 'Desktop Windows / Chrome 124', ip: '192.168.1.100',  time: '2025-06-15 10:00', status: 'success' },
  { device: 'Desktop Windows / Chrome 124', ip: '89.96.123.45',   time: '2025-06-15 13:00', status: 'fraud' },
  { device: 'Mobile iOS / Safari 17',        ip: '212.55.100.2',   time: '2025-06-10 09:22', status: 'success' },
  { device: 'Desktop Mac / Firefox 125',     ip: '192.168.1.100',  time: '2025-06-08 08:15', status: 'success' },
  { device: 'Mobile Android / Chrome 123',   ip: '46.99.201.100',  time: '2025-05-29 19:41', status: 'failed' },
];

const TRUSTED_DEVICES = [
  { name: 'MacBook Pro 16" — Chrome 125',   last: '2025-06-10 09:22', trusted: true },
  { name: 'iPhone 15 Pro — Safari 17',       last: '2025-06-08 08:15', trusted: true },
  { name: 'Unknown Desktop — Windows/Chrome',last: '2025-06-15 13:00', trusted: false },
];

// ── Action colour map ─────────────────────────────────────────────────────────
const ACTION_STYLE = {
  ALLOW:         { bg: 'bg-green-50 dark:bg-green-900/30',  border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-500', icon: 'fa-check-circle' },
  MFA_CHALLENGE: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-500', icon: 'fa-mobile-screen' },
  BLOCK:         { bg: 'bg-red-50 dark:bg-red-900/30',     border: 'border-red-300 dark:border-red-700',     text: 'text-red-700 dark:text-red-300',     badge: 'bg-red-500',   icon: 'fa-ban' },
  ERROR:         { bg: 'bg-slate-100 dark:bg-slate-800',    border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-500',                       badge: 'bg-slate-400', icon: 'fa-triangle-exclamation' },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [currentUser, setCurrentUser]           = useState(null);
  const [authLoading, setAuthLoading]           = useState(true);
  const [userTransactions, setUserTransactions] = useState(null);
  const [userAlerts, setUserAlerts]             = useState(null);

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin,      setRegPin]      = useState('');

  // Navigation
  const [currentPage, setCurrentPage] = useState('login');
  const [loginType, setLoginType]     = useState('individ');
  const [transferTab, setTransferTab] = useState('tab-sub-transfer');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Alerts
  const [showToast, setShowToast]           = useState(false);
  const [toastMessage, setToastMessage]     = useState('');
  const [toastType, setToastType]           = useState('success');
  const [showSessionBanner, setShowSessionBanner] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft]     = useState(30);

  // Auth form
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginNipt,     setLoginNipt]     = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin,      setLoginPin]      = useState('');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass,   setShowRegPass]   = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [showCurrPass,  setShowCurrPass]  = useState(false);
  const [showNewPass,   setShowNewPass]   = useState(false);

  // GuardianAI scanner
  const [scanResult,  setScanResult]  = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanAmount,  setScanAmount]  = useState('250');
  const [scanHour,    setScanHour]    = useState('14');
  const [scanNewDevice, setScanNewDevice] = useState(false);
  const [scanNewIp,     setScanNewIp]     = useState(false);
  const [scanForeign,   setScanForeign]   = useState(false);
  const [scanDistance,  setScanDistance]  = useState('5');
  const [scanPhishing,  setScanPhishing]  = useState(false);

  // Transactions search
  const [txSearch, setTxSearch] = useState('');

  // Role-based stats
  const [myStats,    setMyStats]    = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState(null);
  const [adminEvents, setAdminEvents] = useState(null);

  // Chart data
  const [chartData,          setChartData]          = useState(null);
  const [decisionBreakdown,  setDecisionBreakdown]  = useState(null);
  const [statsLoading,       setStatsLoading]       = useState(false);

  // Mock data from server
  const [mockData, setMockData] = useState(null);

  // Refs
  const sessionTimerRef    = useRef(null);
  const countdownTimerRef  = useRef(null);
  const chartRef           = useRef(null);
  const chartInstanceRef   = useRef(null);
  const pieChartRef        = useRef(null);
  const pieChartInst       = useRef(null);
  const INACTIVITY_TIME    = 90000;

  // ── Derived USER (replaces removed top-level const) ─────────────────────────
  const USER = {
    name:      currentUser?.full_name || 'Arjola Hoxha',
    balance:   currentUser?.balance != null
                 ? Number(currentUser.balance).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                 : '4,287.50',
    iban:      currentUser?.iban      || 'AL47 2121 1009 0000 0002 3569 8741',
    card:      '5412 •••• •••• 8804',
    cardExpiry:'09/27',
    status:    currentUser?.role === 'admin' ? 'Admin' : 'Premium',
  };

  const _bearer = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` });

  const loadUserData = async () => {
    const h = _bearer();
    try {
      const [txRes, alRes] = await Promise.all([
        fetch('/api/me/transactions', { headers: h }),
        fetch('/api/me/alerts',       { headers: h }),
      ]);
      if (txRes.ok) {
        const raw = await txRes.json();
        setUserTransactions(raw.map(t => ({
          id:        String(t.id),
          date:      (t.created_at || '').slice(0, 16).replace('T', ' '),
          type:      t.tx_type,
          recipient: t.recipient || '',
          amount:    t.amount,
          city:      t.city   || '',
          device:    t.device || '',
          fraud:     t.is_fraud,
        })));
      }
      if (alRes.ok) setUserAlerts(await alRes.json());
    } catch { /* fall back to static demo data */ }
  };

  // ── Load mock data ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/mock_data.json').then(r => r.json()).then(setMockData).catch(() => {});
  }, []);

  // ── Startup auth check ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setAuthLoading(false); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(user => { setCurrentUser(user); setCurrentPage('dashboard'); })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const h = _bearer();
    setStatsLoading(true);
    loadUserData();

    fetch('/api/dashboard/chart-data', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setChartData(d))
      .catch(() => {});

    if (currentUser.role === 'user') {
      fetch('/api/dashboard/my-stats', { headers: h })
        .then(r => r.ok ? r.json() : null)
        .then(d => { d && setMyStats(d); setStatsLoading(false); })
        .catch(() => setStatsLoading(false));
    } else if (currentUser.role === 'admin') {
      Promise.all([
        fetch('/api/dashboard/stats',              { headers: h }).then(r => r.ok ? r.json() : null),
        fetch('/api/dashboard/users',              { headers: h }).then(r => r.ok ? r.json() : null),
        fetch('/api/dashboard/events',             { headers: h }).then(r => r.ok ? r.json() : null),
        fetch('/api/dashboard/decision-breakdown', { headers: h }).then(r => r.ok ? r.json() : null),
      ]).then(([stats, users, events, breakdown]) => {
        stats     && setAdminStats(stats);
        users     && setAdminUsers(users);
        events    && setAdminEvents(events);
        breakdown && setDecisionBreakdown(breakdown);
        setStatsLoading(false);
      }).catch(() => setStatsLoading(false));
    }
  }, [currentUser?.id]);

  // ── Dark mode ───────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const triggerToast = (message, type = 'success') => {
    setToastMessage(message); setToastType(type); setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // ── Session monitor ─────────────────────────────────────────────────────────
  const isAuthPage = ['login', 'register', 'forgot', 'reset'].includes(currentPage);

  const startSessionMonitor = useCallback(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (isAuthPage) return;
    sessionTimerRef.current = setTimeout(() => setShowSessionBanner(true), INACTIVITY_TIME);
  }, [isAuthPage]);

  const stopSessionMonitor = () => {
    if (sessionTimerRef.current)   clearTimeout(sessionTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setShowSessionBanner(false);
  };

  useEffect(() => {
    if (!showSessionBanner) return;
    setSessionTimeLeft(30);
    countdownTimerRef.current = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) { clearInterval(countdownTimerRef.current); autoLogout(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current); };
  }, [showSessionBanner]);

  useEffect(() => {
    const handle = () => { if (!showSessionBanner) startSessionMonitor(); };
    const evts = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    evts.forEach(e => window.addEventListener(e, handle));
    startSessionMonitor();
    return () => { evts.forEach(e => window.removeEventListener(e, handle)); stopSessionMonitor(); };
  }, [currentPage, showSessionBanner, startSessionMonitor]);

  // ── Chart.js ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentPage !== 'dashboard' || !chartRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const MONTH_NAMES = ['Jan','Shk','Mar','Pri','Maj','Qer','Kor','Gus','Sht','Tet','Nën','Dhj'];
    let labels, totalData, fraudData;

    if (chartData && chartData.length > 0) {
      labels    = chartData.map(d => {
        const dt = new Date(d.date);
        return `${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}`;
      });
      totalData = chartData.map(d => d.total);
      fraudData = chartData.map(d => d.fraud);
    } else if (mockData?.fraud_timeline) {
      const monthly = {};
      (mockData.fraud_timeline || []).forEach(({ date, total_events, fraud_events }) => {
        const mo = date.slice(0, 7);
        if (!monthly[mo]) monthly[mo] = { total: 0, fraud: 0 };
        monthly[mo].total += total_events;
        monthly[mo].fraud += fraud_events;
      });
      const sorted = Object.keys(monthly).sort();
      labels    = sorted.map(m => MONTH_NAMES[parseInt(m.split('-')[1]) - 1]);
      totalData = sorted.map(m => monthly[m].total);
      fraudData = sorted.map(m => monthly[m].fraud);
    } else {
      return;
    }

    chartInstanceRef.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Total Events',   data: totalData, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)', fill: true, tension: 0.3, pointRadius: 3 },
          { label: 'Fraud / Blocked', data: fraudData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.3, pointRadius: 3 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(100,116,139,0.08)' } },
          x: { grid: { display: false } },
        },
      },
    });

    return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
  }, [currentPage, chartData, mockData]);

  useEffect(() => {
    if (currentPage !== 'dashboard' || !pieChartRef.current || !decisionBreakdown) return;
    if (pieChartInst.current) pieChartInst.current.destroy();

    const labels = Object.keys(decisionBreakdown);
    const values = Object.values(decisionBreakdown);
    const colors = labels.map(l =>
      l === 'ALLOW' ? '#22c55e' : l === 'MFA_CHALLENGE' ? '#eab308' : l === 'BLOCK' ? '#ef4444' : '#94a3b8'
    );

    pieChartInst.current = new Chart(pieChartRef.current.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#1e293b' }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 10 }, color: '#94a3b8' } },
        },
      },
    });

    return () => { if (pieChartInst.current) pieChartInst.current.destroy(); };
  }, [currentPage, decisionBreakdown]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const resetSessionTimeout = () => {
    setShowSessionBanner(false);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    startSessionMonitor();
    triggerToast('Sesioni juaj u zgjat me sukses.', 'success');
  };

  const autoLogout = () => {
    stopSessionMonitor(); triggerToast('Auto-Logout: Keni qenë inaktiv!', 'error');
    setCurrentPage('login');
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null); setUserTransactions(null); setUserAlerts(null);
    setMyStats(null); setAdminStats(null); setAdminUsers(null); setAdminEvents(null);
    setChartData(null); setDecisionBreakdown(null); setStatsLoading(false);
    triggerToast('U çidentifikuat në mënyrë të sigurt.', 'error');
    setScanResult(null); setCurrentPage('login');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!captchaChecked) { triggerToast('Ju lutem plotësoni CAPTCHA-n!', 'error'); return; }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginEmail, password: loginPassword, pin: loginPin }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        triggerToast(err.detail || 'Kredencialet janë të gabuara!', 'error'); return;
      }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setCurrentUser(data.user);
      triggerToast(`Mirë se erdhe, ${data.user.full_name}!`, 'success');
      setCurrentPage('dashboard');
    } catch { triggerToast('Server i paarritshëm. Provoni sërish.', 'error'); }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (regUsername.trim().length < 3) {
      triggerToast('Emri i përdoruesit duhet të ketë të paktën 3 karaktere!', 'error'); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      triggerToast('Ju lutem vendosni një email të vlefshëm!', 'error'); return;
    }
    if (regPassword.length < 6) {
      triggerToast('Fjalëkalimi duhet të ketë të paktën 6 karaktere!', 'error'); return;
    }
    if (!/^\d{4}$/.test(regPin)) {
      triggerToast('PIN-i duhet të jetë saktësisht 4 shifra!', 'error'); return;
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword, pin: regPin, full_name: regFullName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        triggerToast(err.detail || 'Regjistrimi dështoi!', 'error'); return;
      }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setCurrentUser(data.user);
      triggerToast('Llogaria u krijua me sukses!', 'success');
      setCurrentPage('dashboard');
    } catch { triggerToast('Server i paarritshëm. Provoni sërish.', 'error'); }
  };

  // GuardianAI scanner
  const runScan = async (payload) => {
    setScanLoading(true); setScanResult(null);
    try {
      const res = await fetch('/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setScanResult(await res.json());
    } catch (err) {
      setScanResult({ action: 'ERROR', reason: `Cannot reach fraud API: ${err.message}`, score: 0 });
    } finally { setScanLoading(false); }
  };

  const handleCustomScan = (e) => {
    e.preventDefault();
    runScan({
      transaction_amount:     parseFloat(scanAmount) || 0,
      hour_of_day:            parseInt(scanHour) || 12,
      is_new_device:          scanNewDevice ? 1 : 0,
      is_new_ip:              scanNewIp     ? 1 : 0,
      is_foreign_country:     scanForeign   ? 1 : 0,
      distance_from_usual_km: parseFloat(scanDistance) || 0,
      is_phishing_detected:   scanPhishing  ? 1 : 0,
    });
  };

  const markAlertRead = async (alertId) => {
    try {
      const res = await fetch(`/api/me/alerts/${alertId}/read`, {
        method: 'PATCH',
        headers: _bearer(),
      });
      if (res.ok) {
        setUserAlerts(prev => prev ? prev.map(a => a.id === alertId ? { ...a, is_read: true } : a) : prev);
        triggerToast('Njoftimi u shënua si i lexuar.', 'success');
      }
    } catch { triggerToast('Gabim gjatë përditësimit.', 'error'); }
  };

  const downloadCSV = () => {
    const headers = ['ID', 'Data', 'Tipi', 'Destinatari', 'Shuma (EUR)', 'Qyteti', 'Pajisja', 'Mashtrim'];
    const rows = allTx.map(tx => [
      tx.id,
      tx.date,
      tx.type,
      tx.recipient,
      tx.amount ?? '',
      tx.city ?? '',
      tx.device ?? '',
      tx.fraud ? 'PO' : 'JO',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'guardianai-transaksionet.csv'; a.click();
    URL.revokeObjectURL(url);
    triggerToast('Transaksionet u shkarkuan si CSV!', 'success');
  };

  // Nav helpers
  const navTo = (page) => { setCurrentPage(page); setMobileNavOpen(false); };

  const getSidebarClass = (pageId) =>
    currentPage === pageId
      ? 'flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm transition-all whitespace-nowrap'
      : 'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 font-medium text-sm transition-all whitespace-nowrap';

  const getSubTabClass = (tabId) =>
    transferTab === tabId
      ? 'flex-shrink-0 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-blue-600 shadow-sm text-xs font-bold'
      : 'flex-shrink-0 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-xs';

  const allTx = userTransactions || ALL_TRANSACTIONS;
  const unreadCount = userAlerts ? userAlerts.filter(a => !a.is_read).length : (myStats?.unread_alerts ?? 0);
  const filteredTx = allTx.filter(tx =>
    txSearch === '' || tx.recipient.toLowerCase().includes(txSearch.toLowerCase()) || tx.type.toLowerCase().includes(txSearch.toLowerCase())
  );
  const recentTx = userTransactions ? userTransactions.slice(0, 5) : RECENT_TRANSACTIONS;

  const statCards = currentUser?.role === 'admin'
    ? [
        { label: 'Total Events',   value: adminStats?.total_events  ?? '…', icon: 'fa-bolt',                 color: 'blue'   },
        { label: 'Fraud Detected', value: adminStats?.total_fraud   ?? '…', icon: 'fa-triangle-exclamation', color: 'red'    },
        { label: 'Fraud Rate',     value: adminStats ? `${adminStats.fraud_rate}%` : '…', icon: 'fa-percent', color: 'orange' },
        { label: 'Active Users',   value: adminStats?.total_users   ?? '…', icon: 'fa-users',                color: 'green'  },
      ]
    : [
        { label: 'Transaksionet',         value: myStats?.total_transactions ?? '…', icon: 'fa-arrow-right-arrow-left', color: 'blue'   },
        { label: 'Mashtrime',             value: myStats?.fraud_count        ?? '…', icon: 'fa-triangle-exclamation',   color: 'red'    },
        { label: 'Njoftime',              value: myStats?.unread_alerts      ?? '…', icon: 'fa-bell',                   color: 'orange' },
        { label: 'Bilanci',               value: myStats ? `€ ${Number(myStats.balance).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}` : '…', icon: 'fa-wallet', color: 'green' },
      ];

  // ── RENDER ──────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-950">
      <div className="text-white text-center">
        <i className="fas fa-spinner fa-spin text-3xl mb-3 block"></i>
        <p className="text-sm opacity-70">Duke ngarkuar…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">

      {/* TOAST */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-[60] px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm text-white font-semibold animate-bounce max-w-xs sm:max-w-sm ${
          toastType === 'error' ? 'bg-red-500' : toastType === 'info' ? 'bg-slate-800' : 'bg-blue-600'
        }`}>
          <i className={`fas ${toastType === 'error' ? 'fa-times-circle' : toastType === 'info' ? 'fa-circle-info' : 'fa-check-circle'}`}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SESSION TIMEOUT BANNER */}
      {showSessionBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-slate-950 px-4 py-3 text-center text-sm font-semibold z-50 flex flex-col sm:flex-row justify-center items-center gap-3">
          <span><i className="fas fa-exclamation-triangle mr-2"></i>Sesioni po mbaron pas <strong>{sessionTimeLeft}</strong>s mosaktiviteti.</span>
          <button onClick={resetSessionTimeout} className="bg-slate-950 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition">Rri i lidhur</button>
        </div>
      )}

      {/* ── AUTH PAGES ──────────────────────────────────────────────────────── */}
      {isAuthPage && (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-950">

          {/* LOGIN */}
          {currentPage === 'login' && (
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
                  <i className="fas fa-university text-white text-2xl"></i>
                </div>
                <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">FIBANK</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Identifikim i Sigurt · <span className="text-green-500 font-semibold"><i className="fas fa-shield-halved mr-1"></i>GuardianAI Active</span></p>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl mb-6">
                <button type="button" onClick={() => setLoginType('individ')} className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'individ' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                  <i className="fas fa-user mr-1"></i> Individ
                </button>
                <button type="button" onClick={() => setLoginType('biznes')} className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-all ${loginType === 'biznes' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                  <i className="fas fa-briefcase mr-1"></i> Biznes
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Numër Klienti / Personal</label>
                  <input type="text" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                {loginType === 'biznes' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">ID Kompanie / NIPT</label>
                    <input type="text" value={loginNipt} onChange={e => setLoginNipt(e.target.value)} required placeholder="M12345678X" className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Fjalëkalimi</label>
                  <div className="relative flex items-center">
                    <input type={showLoginPass ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="w-full px-4 py-2.5 pr-10 rounded-xl border dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3 text-slate-400 hover:text-blue-500"><i className={`fas ${showLoginPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">PIN i Sigurisë (4 Shifra)</label>
                  <input type="password" maxLength={4} placeholder="••••" value={loginPin} onChange={e => setLoginPin(e.target.value)} required className="w-full text-center tracking-widest text-lg px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} className="rounded text-blue-600" />
                    <span className="text-slate-500">Kujto pajisjen</span>
                  </label>
                  <button type="button" onClick={() => setCurrentPage('forgot')} className="text-blue-600 font-medium hover:underline bg-transparent border-0 cursor-pointer">Harruat Fjalëkalimin?</button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="captcha" checked={captchaChecked} onChange={e => setCaptchaChecked(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                    <label htmlFor="captcha" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">Unë nuk jam robot</label>
                  </div>
                  <i className="fas fa-shield-halved text-blue-600 text-lg"></i>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-3 rounded-xl font-bold text-sm transition">Hyni në Llogari</button>
              </form>
              <p className="text-center text-xs text-slate-500 mt-6">Pa llogari? <button onClick={() => setCurrentPage('register')} className="text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer ml-1">Regjistrohu</button></p>
            </div>
          )}

          {/* REGISTER */}
          {currentPage === 'register' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400">FIBANK</h2>
                <p className="text-slate-500 mt-1 text-sm">Hap llogari të re digjitale</p>
              </div>
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div><label className="block text-xs font-semibold uppercase mb-1">Numër Klienti</label><input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-semibold uppercase mb-1">Emri i Plotë</label><input type="text" value={regFullName} onChange={e => setRegFullName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-semibold uppercase mb-1">Email</label><input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Fjalëkalimi</label>
                  <div className="relative flex items-center">
                    <input type={showRegPass ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} required className="w-full px-4 py-2.5 pr-10 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3 text-slate-400 hover:text-blue-500"><i className={`fas ${showRegPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">PIN i Sigurisë (4 Shifra)</label>
                  <input type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={regPin} onChange={e => setRegPin(e.target.value.replace(/\D/g, ''))} required className="w-full text-center tracking-widest text-lg px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none" />
                  <p className="text-[10px] text-slate-400 mt-1">Vendos 4 shifra — do ta përdorësh çdo herë që hyni</p>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition">Vazhdo Regjistrimin</button>
              </form>
              <p className="text-center text-xs text-slate-500 mt-6"><button onClick={() => setCurrentPage('login')} className="text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer">← Kthehu tek Login</button></p>
            </div>
          )}

          {/* FORGOT */}
          {currentPage === 'forgot' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Rifito Qasjen</h2>
                <p className="text-slate-500 text-xs mt-1">Shkruani email-in për kodin OTP.</p>
              </div>
              <form onSubmit={e => { e.preventDefault(); setCurrentPage('reset'); }} className="space-y-4">
                <div><label className="block text-xs font-semibold uppercase mb-1">Email Adresa</label><input type="email" required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition">Dërgo Kodin</button>
              </form>
              <p className="text-center text-xs mt-4"><button onClick={() => setCurrentPage('login')} className="text-blue-600 hover:underline bg-transparent border-0 cursor-pointer">← Kthehu</button></p>
            </div>
          )}

          {/* RESET */}
          {currentPage === 'reset' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-amber-500"><i className="fas fa-lock-open mr-2"></i>Reset Password</h2>
                <p className="text-slate-500 text-xs mt-1">Vendosni fjalëkalimin e ri.</p>
              </div>
              <form onSubmit={e => { e.preventDefault(); triggerToast('Fjalëkalimi u ndryshua!', 'success'); setCurrentPage('login'); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">Fjalëkalimi i Ri</label>
                  <div className="relative flex items-center">
                    <input type={showResetPass ? 'text' : 'password'} required className="w-full px-4 py-2.5 pr-10 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => setShowResetPass(!showResetPass)} className="absolute right-3 text-slate-400 hover:text-blue-500"><i className={`fas ${showResetPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition">Përditëso Fjalëkalimin</button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── MAIN APP ─────────────────────────────────────────────────────────── */}
      {!isAuthPage && (
        <div className="min-h-screen flex">

          {/* Mobile overlay */}
          {mobileNavOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />
          )}

          {/* SIDEBAR */}
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

              {/* User mini-card */}
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
                <button onClick={() => navTo('dashboard')}     className={getSidebarClass('dashboard')}><i className="fas fa-th-large w-5 text-blue-500"></i>Dashboard</button>
                <button onClick={() => navTo('transactions')}  className={getSidebarClass('transactions')}><i className="fas fa-exchange-alt w-5 text-blue-500"></i>Transaksionet</button>
                <button onClick={() => navTo('transfer')}      className={getSidebarClass('transfer')}><i className="fas fa-paper-plane w-5 text-blue-500"></i>Transfero Para</button>
                <button onClick={() => navTo('cards')}         className={getSidebarClass('cards')}><i className="fas fa-credit-card w-5 text-blue-500"></i>Kartat e Mia</button>
                <button onClick={() => navTo('security')} className={getSidebarClass('security')}>
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
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold text-sm transition-all">
                <i className="fas fa-sign-out-alt w-5"></i>Dil nga Llogaria
              </button>
            </div>
          </aside>

          {/* CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Top bar (mobile) */}
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

              {/* ── DASHBOARD ─────────────────────────────────────────────── */}
              {currentPage === 'dashboard' && (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h2 className="text-2xl font-bold">Mirë se erdhe, <span className="text-blue-600">{USER.name}</span></h2>
                      <p className="text-slate-500 text-xs mt-0.5">FIBANK Digital Banking · GuardianAI ju mbron në kohë reale.</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                      <i className="fas fa-crown mr-1 text-amber-500"></i>{USER.status}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {statsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3 animate-pulse">
                          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
                            <div className="h-3 bg-slate-100 dark:bg-slate-600 rounded w-20"></div>
                          </div>
                        </div>
                      ))
                    ) : statCards.map(({ label, value, icon, color }) => (
                      <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          color === 'blue'   ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' :
                          color === 'red'    ? 'bg-red-100 dark:bg-red-900/40 text-red-600' :
                          color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' :
                          'bg-green-100 dark:bg-green-900/40 text-green-600'
                        }`}><i className={`fas ${icon}`}></i></div>
                        <div>
                          <p className="text-xl font-black">{value}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Balance + Quick Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between h-44 lg:col-span-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs opacity-70 uppercase tracking-wider">Balanca e Disponueshme</p>
                          <h3 className="text-3xl font-black mt-1">€ {USER.balance}</h3>
                        </div>
                        <i className="fas fa-wallet text-4xl opacity-40"></i>
                      </div>
                      <div>
                        <p className="text-[10px] opacity-60 tracking-widest uppercase">IBAN Primar</p>
                        <p className="font-mono text-xs sm:text-sm tracking-wider mt-0.5">{USER.iban}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                      <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-3">Veprime të Shpejta</h3>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <button onClick={() => { navTo('transfer'); setTransferTab('tab-sub-transfer'); }} className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:scale-105 transition-transform"><i className="fas fa-paper-plane block mb-1 text-lg"></i>Dërgo</button>
                        <button onClick={() => { navTo('transfer'); setTransferTab('tab-sub-fatura'); }}  className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:scale-105 transition-transform"><i className="fas fa-file-invoice block mb-1 text-lg"></i>Fatura</button>
                        <button onClick={() => { navTo('transfer'); setTransferTab('tab-sub-kembim'); }}  className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:scale-105 transition-transform"><i className="fas fa-rotate block mb-1 text-lg"></i>Këmbim</button>
                      </div>
                    </div>
                  </div>

                  {/* Chart + Recent Transactions */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2">
                      <h3 className="font-bold text-xs mb-4 uppercase text-slate-400 tracking-wider">Aktiviteti i Mashtrimit 2025</h3>
                      <div className="h-56 sm:h-64 relative"><canvas ref={chartRef}></canvas></div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <h3 className="font-bold text-xs mb-4 uppercase text-slate-400 tracking-wider">Transaksionet e Fundit</h3>
                      <div className="space-y-3">
                        {recentTx.map(tx => (
                          <div key={tx.id} className={`flex justify-between items-start text-xs rounded-xl p-2 ${tx.fraud ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs ${tx.fraud ? 'bg-red-500' : tx.amount > 0 ? 'bg-green-500' : 'bg-blue-500'}`}>
                                <i className={`fas ${tx.fraud ? 'fa-triangle-exclamation' : tx.amount > 0 ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{tx.recipient}</p>
                                <p className="text-slate-400 truncate">{tx.date}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              {tx.amount !== null ? (
                                <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {tx.amount > 0 ? '+' : ''}€{Math.abs(tx.amount).toFixed(2)}
                                </p>
                              ) : null}
                              {tx.fraud && <span className="text-red-500 font-bold">FRAUD</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── GuardianAI Live Scanner ──────────────────────────── */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-shield-halved text-white"></i>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm">GuardianAI Live Scanner</h3>
                        <p className="text-blue-300 text-xs">Isolation Forest + Dual-Layer Phishing Engine · Real-time</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-xs font-semibold">LIVE</span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      {/* Preset buttons */}
                      <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Demo Presets</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                        {SCAN_PRESETS.map(preset => (
                          <button
                            key={preset.label}
                            onClick={() => runScan(preset.payload)}
                            disabled={scanLoading}
                            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                              preset.color === 'green'  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:border-green-400' :
                              preset.color === 'yellow' ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:border-yellow-400' :
                              preset.color === 'orange' ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:border-orange-400' :
                              'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:border-red-400'
                            }`}
                          >
                            <i className={`fas ${preset.icon} block mb-1 text-base`}></i>
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom scan form */}
                      <details className="mb-4">
                        <summary className="text-xs font-semibold text-slate-500 cursor-pointer hover:text-blue-600 transition-colors select-none">
                          <i className="fas fa-sliders mr-1"></i>Skanim i Personalizuar
                        </summary>
                        <form onSubmit={handleCustomScan} className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase mb-1 text-slate-400">Shuma (€)</label>
                            <input type="number" value={scanAmount} onChange={e => setScanAmount(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-700 bg-transparent text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase mb-1 text-slate-400">Ora</label>
                            <input type="number" min="0" max="23" value={scanHour} onChange={e => setScanHour(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-700 bg-transparent text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase mb-1 text-slate-400">Distanca (km)</label>
                            <input type="number" value={scanDistance} onChange={e => setScanDistance(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-700 bg-transparent text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400 cursor-pointer"><input type="checkbox" checked={scanNewDevice} onChange={e => setScanNewDevice(e.target.checked)} className="rounded text-blue-600" />Pajisje e Re</label>
                            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400 cursor-pointer"><input type="checkbox" checked={scanNewIp} onChange={e => setScanNewIp(e.target.checked)} className="rounded text-blue-600" />IP e Re</label>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400 cursor-pointer"><input type="checkbox" checked={scanForeign} onChange={e => setScanForeign(e.target.checked)} className="rounded text-blue-600" />Jashtë Vendit</label>
                            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400 cursor-pointer"><input type="checkbox" checked={scanPhishing} onChange={e => setScanPhishing(e.target.checked)} className="rounded text-blue-600" />Phishing Flag</label>
                          </div>
                          <button type="submit" disabled={scanLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50">Skano</button>
                        </form>
                      </details>

                      {/* Result */}
                      {scanLoading && (
                        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                          <i className="fas fa-spinner fa-spin text-blue-600 text-xl"></i>
                          <span className="text-sm">Analyzing transaction…</span>
                        </div>
                      )}

                      {scanResult && !scanLoading && (() => {
                        const s = ACTION_STYLE[scanResult.action] || ACTION_STYLE.ERROR;
                        const rawScore = scanResult.score ?? 0;
                        const riskPct = scanResult.action === 'BLOCK'
                          ? Math.min(100, Math.max(80, 95))
                          : scanResult.action === 'MFA_CHALLENGE'
                          ? Math.min(79, Math.max(40, Math.round(50 + (-rawScore) * 40)))
                          : Math.min(39, Math.max(0, Math.round(20 + (-rawScore) * 20)));
                        const gaugeColor = riskPct >= 80 ? '#ef4444' : riskPct >= 40 ? '#eab308' : '#22c55e';
                        return (
                          <div className={`rounded-xl border-2 ${s.bg} ${s.border} p-4`}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`${s.badge} text-white w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                                  <i className={`fas ${s.icon} text-lg`}></i>
                                </div>
                                <div>
                                  <p className={`text-xl font-black ${s.text}`}>{scanResult.action?.replace('_', ' ')}</p>
                                  <p className="text-xs text-slate-400">
                                    Raw score: <span className="font-mono font-bold">{rawScore.toFixed(4)}</span>
                                    {scanResult.latency_ms ? ` · ${scanResult.latency_ms.toFixed(1)}ms` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <div className="relative w-16 h-16">
                                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                                    <circle
                                      cx="18" cy="18" r="15.9" fill="none"
                                      stroke={gaugeColor} strokeWidth="3"
                                      strokeDasharray={`${riskPct} 100`}
                                      strokeLinecap="round"
                                      style={{ transition: 'stroke-dasharray 0.8s ease' }}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-black" style={{ color: gaugeColor }}>{riskPct}%</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Risk</span>
                              </div>
                            </div>
                            <p className={`text-xs leading-relaxed ${s.text}`}>{scanResult.reason}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ── ADMIN: Decision Breakdown Pie Chart ──────────────── */}
                  {currentUser?.role === 'admin' && decisionBreakdown && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-xs mb-4 uppercase text-slate-400 tracking-wider">
                          <i className="fas fa-chart-pie mr-2 text-blue-500"></i>Vendime sipas Tipit
                        </h3>
                        <div className="h-52 relative"><canvas ref={pieChartRef}></canvas></div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-xs mb-4 uppercase text-slate-400 tracking-wider">
                          <i className="fas fa-shield-halved mr-2 text-blue-500"></i>Statistika të Shpejta
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(decisionBreakdown).map(([decision, count]) => {
                            const total = Object.values(decisionBreakdown).reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            const color = decision === 'ALLOW' ? 'bg-green-500' : decision === 'MFA_CHALLENGE' ? 'bg-yellow-500' : 'bg-red-500';
                            return (
                              <div key={decision}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="font-semibold text-slate-600 dark:text-slate-300">{decision.replace('_', ' ')}</span>
                                  <span className="font-mono font-bold">{count} <span className="text-slate-400">({pct}%)</span></span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                  <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── ADMIN: Users at Risk ─────────────────────────────── */}
                  {currentUser?.role === 'admin' && adminUsers && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                      <div className="px-5 py-3 border-b dark:border-slate-700 flex items-center gap-2">
                        <i className="fas fa-users-slash text-red-500"></i>
                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Perdoruesit ne Rrezik</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[580px]">
                          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 uppercase font-semibold">
                            <tr>
                              <th className="p-3 text-left">Perdoruesi</th>
                              <th className="p-3 text-left">Email</th>
                              <th className="p-3 text-right">Bilanci</th>
                              <th className="p-3 text-center">Events</th>
                              <th className="p-3 text-center">Mashtrime</th>
                              <th className="p-3 text-center">Rreziku</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {adminUsers.filter(u => u.role === 'user').sort((a,b) => b.fraud_count - a.fraud_count).map(u => {
                              const risk = u.fraud_count >= 2 ? { label: 'I LARTE', cls: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400', dot: 'text-red-500' }
                                         : u.fraud_count === 1 ? { label: 'MESATAR', cls: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400', dot: 'text-yellow-500' }
                                         : { label: 'I ULET', cls: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400', dot: 'text-green-500' };
                              return (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                  <td className="p-3 font-semibold">{u.full_name}</td>
                                  <td className="p-3 text-slate-400">{u.email}</td>
                                  <td className="p-3 text-right font-mono">€{Number(u.balance).toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                                  <td className="p-3 text-center">{u.event_count}</td>
                                  <td className="p-3 text-center font-bold text-red-500">{u.fraud_count}</td>
                                  <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${risk.cls}`}>{risk.label}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ── ADMIN: All Events ────────────────────────────────── */}
                  {currentUser?.role === 'admin' && adminEvents && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                      <div className="px-5 py-3 border-b dark:border-slate-700 flex items-center gap-2">
                        <i className="fas fa-list-ul text-blue-500"></i>
                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Te gjitha Eventet ({adminEvents.length})</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[680px]">
                          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 uppercase font-semibold">
                            <tr>
                              <th className="p-3 text-left">Lloji</th>
                              <th className="p-3 text-left">Perdoruesi</th>
                              <th className="p-3 text-left">IP</th>
                              <th className="p-3 text-right">Shuma</th>
                              <th className="p-3 text-center">Risk</th>
                              <th className="p-3 text-center">Vendimi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {adminEvents.slice(0,15).map(ev => (
                              <tr key={ev.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${ev.decision === 'BLOCK' ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                                <td className="p-3 font-medium capitalize">{ev.event_type}</td>
                                <td className="p-3 font-semibold">{ev.full_name || ev.username}</td>
                                <td className="p-3 font-mono text-slate-400">{ev.ip_address}</td>
                                <td className="p-3 text-right">{ev.amount != null ? `€${Math.abs(ev.amount).toFixed(2)}` : '—'}</td>
                                <td className="p-3 text-center font-mono">{ev.risk_score != null ? ev.risk_score.toFixed(2) : '—'}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ev.decision === 'BLOCK' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                                    ev.decision === 'MFA_CHALLENGE' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700' :
                                    'bg-green-100 dark:bg-green-900/40 text-green-600'
                                  }`}>{ev.decision}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TRANSACTIONS ──────────────────────────────────────────── */}
              {currentPage === 'transactions' && (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold">Historia e Transaksioneve</h2>
                      <p className="text-slate-500 text-xs mt-0.5">Kërkoni dhe filtroni aktivitetin tuaj bankar.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-72">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                        <input type="text" value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="Kërko (përfitues, lloji)..." className="w-full pl-9 pr-4 py-2.5 text-xs border dark:border-slate-700 rounded-xl bg-transparent outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex-shrink-0"
                      >
                        <i className="fas fa-download"></i>
                        <span className="hidden sm:inline">Shkarko CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* User risk table */}
                  {mockData?.user_risk && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden">
                      <div className="px-5 py-3 border-b dark:border-slate-700">
                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider"><i className="fas fa-fire text-orange-500 mr-1"></i>Përdoruesit me Rrezik të Lartë</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 uppercase font-semibold">
                            <tr>
                              <th className="p-3">User ID</th>
                              <th className="p-3">Events</th>
                              <th className="p-3">Fraud</th>
                              <th className="p-3">Total (€)</th>
                              <th className="p-3">Risk Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {mockData.user_risk.slice(0, 5).map(u => (
                              <tr key={u.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                <td className="p-3 font-bold">{u.user_id}</td>
                                <td className="p-3">{u.total_events}</td>
                                <td className="p-3 text-red-500 font-bold">{u.fraud_count}</td>
                                <td className="p-3">€{u.total_amount.toFixed(2)}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 w-20">
                                      <div className={`h-1.5 rounded-full ${u.risk_score > 50 ? 'bg-red-500' : u.risk_score > 20 ? 'bg-orange-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(u.risk_score, 100)}%` }}></div>
                                    </div>
                                    <span className={`font-bold ${u.risk_score > 50 ? 'text-red-500' : u.risk_score > 20 ? 'text-orange-500' : 'text-yellow-600'}`}>{u.risk_score.toFixed(1)}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-x-auto border dark:border-slate-700">
                    <table className="w-full text-left text-xs min-w-[580px]">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 uppercase font-semibold text-slate-400">
                        <tr>
                          <th className="p-4">Lloji</th>
                          <th className="p-4">Përfituesi</th>
                          <th className="p-4">Qyteti / Pajisja</th>
                          <th className="p-4">Data</th>
                          <th className="p-4 text-right">Shuma</th>
                          <th className="p-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredTx.map(tx => (
                          <tr key={tx.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${tx.fraud ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                            <td className="p-4 font-medium">{tx.type}</td>
                            <td className="p-4">{tx.recipient}</td>
                            <td className="p-4 text-slate-400">{tx.city} · {tx.device}</td>
                            <td className="p-4 text-slate-400">{tx.date}</td>
                            <td className={`p-4 text-right font-bold ${tx.amount === null ? '' : tx.amount > 0 ? 'text-green-600' : 'text-slate-700 dark:text-slate-200'}`}>
                              {tx.amount !== null ? `${tx.amount > 0 ? '+' : ''}€${Math.abs(tx.amount).toFixed(2)}` : '—'}
                            </td>
                            <td className="p-4 text-center">
                              {tx.fraud
                                ? <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full font-bold text-[10px]"><i className="fas fa-ban mr-1"></i>FRAUD</span>
                                : <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full font-bold text-[10px]"><i className="fas fa-check mr-1"></i>OK</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TRANSFER ──────────────────────────────────────────────── */}
              {currentPage === 'transfer' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <h2 className="text-xl font-bold">Transferta & Shërbime Financiare</h2>
                  <div className="flex overflow-x-auto gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl scrollbar-none">
                    {[['tab-sub-transfer','Transferta'],['tab-sub-pagesa','Pagesa'],['tab-sub-fatura','Fatura'],['tab-sub-kembim','Këmbim'],['tab-sub-pakarte','Pa Kartë']].map(([id, label]) => (
                      <button key={id} onClick={() => setTransferTab(id)} className={getSubTabClass(id)}>{label}</button>
                    ))}
                  </div>

                  {transferTab === 'tab-sub-transfer' && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                      <h3 className="text-sm font-bold text-blue-600"><i className="fas fa-paper-plane mr-1"></i>Transfertë Bankare</h3>
                      <div><label className="block text-xs font-semibold mb-1 uppercase">Emri i Marrësit</label><input type="text" className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm" /></div>
                      <div><label className="block text-xs font-semibold mb-1 uppercase">IBAN</label><input type="text" placeholder="ALXX XXXX XXXX XXXX" className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent font-mono text-sm" /></div>
                      <div><label className="block text-xs font-semibold mb-1 uppercase">Shuma (€)</label><input type="number" className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm" /></div>
                      <button type="button" onClick={() => triggerToast('Transferta u ekzekutua!', 'success')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm transition hover:bg-blue-700">Ekzekuto</button>
                    </div>
                  )}
                  {transferTab === 'tab-sub-pagesa' && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                      <h3 className="text-sm font-bold text-blue-600"><i className="fas fa-building-columns mr-1"></i>Pagesa Institucionale</h3>
                      <div className="text-xs space-y-3">
                        <div><label className="block font-medium mb-1">Institucioni</label><select className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl dark:bg-slate-800 text-xs"><option>OSHEE sh.a.</option><option>UKT Ujësjellës</option><option>Albtelekom</option></select></div>
                        <div><label className="block font-medium mb-1">Kodi Referencës</label><input type="text" className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl" /></div>
                      </div>
                      <button type="button" onClick={() => triggerToast('Pagesa u kry!', 'success')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs">Kryej Pagesën</button>
                    </div>
                  )}
                  {transferTab === 'tab-sub-fatura' && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                      <h3 className="text-sm font-bold text-blue-600"><i className="fas fa-file-invoice mr-1"></i>Pagesë Fature Utiliteti</h3>
                      <div className="text-xs space-y-3">
                        <div><label className="block font-medium mb-1">Ofruesi</label><select className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl dark:bg-slate-800 text-xs"><option>OSHEE</option><option>UKT</option><option>Albgaz</option></select></div>
                        <div><label className="block font-medium mb-1">Kodi i Faturës</label><input type="text" className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl" /></div>
                      </div>
                      <button type="button" onClick={() => triggerToast('Fatura u pagua!', 'success')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs">Paguaj Faturën</button>
                    </div>
                  )}
                  {transferTab === 'tab-sub-kembim' && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                      <h3 className="text-sm font-bold text-blue-600"><i className="fas fa-rotate mr-1"></i>Këmbim Valutor</h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div><label className="block font-medium mb-1">Nga Valuta</label><select className="w-full p-2 border dark:border-slate-700 bg-transparent rounded-lg dark:bg-slate-800"><option>EUR</option><option>ALL</option><option>USD</option></select></div>
                        <div><label className="block font-medium mb-1">Në Valuta</label><select className="w-full p-2 border dark:border-slate-700 bg-transparent rounded-lg dark:bg-slate-800"><option>ALL</option><option>EUR</option><option>USD</option></select></div>
                        <div className="col-span-2"><label className="block font-medium mb-1">Shuma</label><input type="number" placeholder="0.00" className="w-full p-2 border dark:border-slate-700 bg-transparent rounded-lg" /></div>
                      </div>
                      <button type="button" onClick={() => triggerToast('Këmbimi u konfirmua!', 'success')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs">Konfirmo Këmbimin</button>
                    </div>
                  )}
                  {transferTab === 'tab-sub-pakarte' && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
                      <h3 className="text-sm font-bold text-blue-600"><i className="fas fa-money-bill-wave mr-1"></i>Tërheqje Pa Kartë</h3>
                      <p className="text-xs text-slate-400">Gjeneroni kod unik për ATM-të e FIBANK.</p>
                      <div className="text-xs"><label className="block font-semibold mb-1">Shuma</label><select className="w-full p-2.5 border dark:border-slate-700 bg-transparent rounded-xl dark:bg-slate-800"><option>€20</option><option>€50</option><option>€100</option><option>€200</option></select></div>
                      <button type="button" onClick={() => triggerToast('Kodi: 748219 · Skadon brenda 15 minutave.', 'success')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm">Gjenero Kodin Token</button>
                    </div>
                  )}
                </div>
              )}

              {/* ── CARDS ─────────────────────────────────────────────────── */}
              {currentPage === 'cards' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <h2 className="text-xl font-bold">Menaxhimi i Kartave Bankare</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white p-6 rounded-2xl shadow-xl h-48 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-10 -mt-10"></div>
                      <div className="flex justify-between items-start relative">
                        <div>
                          <p className="text-xs opacity-50 font-bold uppercase tracking-wider">FIBANK Premium</p>
                          <p className="text-xs opacity-70 mt-0.5">{USER.name}</p>
                        </div>
                        <i className="fab fa-cc-mastercard text-3xl text-amber-400"></i>
                      </div>
                      <p className="font-mono tracking-widest text-base sm:text-lg text-center relative">{USER.card}</p>
                      <div className="flex justify-between text-[10px] opacity-70 relative">
                        <span>{USER.name.toUpperCase()}</span>
                        <span>VALIDE: {USER.cardExpiry}</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4 text-sm">
                      <h3 className="font-bold">Aksionet e Sigurisë</h3>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                          <span>Ngrij / Blloko Kartën</span>
                          <input type="checkbox" onChange={e => triggerToast(e.target.checked ? 'Karta u bllokua.' : 'Karta u shbllokua.', e.target.checked ? 'error' : 'success')} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                          <span>Blerje Online</span>
                          <input type="checkbox" defaultChecked onChange={() => triggerToast('Ndryshimet u ruajtën.', 'success')} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                          <span>Transaksione Ndërkombëtare</span>
                          <input type="checkbox" onChange={() => triggerToast('Ndryshimet u ruajtën.', 'success')} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                        </div>
                      </div>
                      <button onClick={() => triggerToast('Karta e re u porositë!', 'success')} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition">Porosit Kartë të Re</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECURITY ──────────────────────────────────────────────── */}
              {currentPage === 'security' && (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div>
                    <h2 className="text-2xl font-bold"><i className="fas fa-shield-halved text-blue-600 mr-2"></i>Siguria & Cilësimet</h2>
                    <p className="text-slate-500 text-xs mt-0.5">GuardianAI mbron llogarinë tuaj 24/7 — analizë e aktivitetit, detektim smishing dhe bllokues phishing.</p>
                  </div>

                  {/* Fraud Alerts */}
                  {userAlerts && userAlerts.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden">
                      <div className="px-5 py-3 border-b dark:border-slate-700 flex items-center gap-2">
                        <i className="fas fa-bell text-red-500"></i>
                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Njoftime Mashtrimi</h3>
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} të palexuara</span>
                        )}
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {userAlerts.map(alert => (
                          <div key={alert.id} className={`flex items-start gap-3 px-5 py-4 ${!alert.is_read ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs mt-0.5 ${
                              alert.severity === 'critical' ? 'bg-red-600' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}>
                              <i className="fas fa-triangle-exclamation"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-600' :
                                  alert.severity === 'high'     ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' :
                                  'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700'
                                }`}>{alert.severity?.toUpperCase()}</span>
                                {!alert.is_read && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 font-bold px-2 py-0.5 rounded-full">E RE</span>}
                              </div>
                              <p className="text-xs mt-1 text-slate-700 dark:text-slate-300">{alert.message}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{alert.created_at ? alert.created_at.slice(0, 16).replace('T', ' ') : ''}</p>
                            </div>
                            {!alert.is_read && (
                              <button
                                onClick={() => markAlertRead(alert.id)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex-shrink-0 mt-1"
                              >
                                Shëno si lexuar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* City Risk Heatmap */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 overflow-hidden">
                    <div className="px-5 py-3 border-b dark:border-slate-700 flex items-center gap-2">
                      <i className="fas fa-map-location-dot text-blue-500"></i>
                      <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Rreziku Gjeografik · City Heatmap</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[400px]">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-400 uppercase font-semibold">
                          <tr>
                            <th className="p-3 text-left">Qyteti</th>
                            <th className="p-3 text-center">Total Events</th>
                            <th className="p-3 text-center">Fraud</th>
                            <th className="p-3 text-left">Fraud Rate</th>
                            <th className="p-3 text-left">Rreziku</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {CITY_RISK.map(c => (
                            <tr key={c.city} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                              <td className="p-3 font-semibold">{c.rate === 100 ? <span className="text-red-500"><i className="fas fa-globe mr-1"></i>{c.city}</span> : c.city}</td>
                              <td className="p-3 text-center">{c.total}</td>
                              <td className="p-3 text-center text-red-500 font-bold">{c.fraud}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${c.rate === 100 ? 'bg-red-600' : c.rate > 10 ? 'bg-orange-500' : 'bg-yellow-500'}`} style={{ width: `${c.rate}%` }}></div>
                                  </div>
                                  <span className={`font-bold ${c.rate === 100 ? 'text-red-600' : c.rate > 10 ? 'text-orange-500' : 'text-yellow-600'}`}>{c.rate}%</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.rate === 100 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                                  c.rate > 10  ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' :
                                  'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                                }`}>{c.rate === 100 ? 'KRITIKE' : c.rate > 10 ? 'I LARTË' : 'MESATAR'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trusted Devices */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 space-y-4">
                      <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider"><i className="fas fa-laptop-medical mr-2 text-blue-500"></i>Pajisjet e Besuara</h3>
                      <div className="space-y-3">
                        {TRUSTED_DEVICES.map((d, i) => (
                          <div key={i} className={`flex items-center justify-between text-xs p-3 rounded-xl border ${d.trusted ? 'border-slate-100 dark:border-slate-700' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <i className={`fas ${d.trusted ? 'fa-laptop text-blue-500' : 'fa-circle-exclamation text-red-500'}`}></i>
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{d.name}</p>
                                <p className="text-slate-400 text-[10px]">Aktivi i fundit: {d.last}</p>
                              </div>
                            </div>
                            {!d.trusted && <span className="text-red-500 font-bold text-[10px] ml-2 flex-shrink-0">SUSPICIOUS</span>}
                            {d.trusted && <button onClick={() => triggerToast('Pajisja u revokua.', 'error')} className="text-red-400 hover:text-red-600 text-[10px] ml-2 flex-shrink-0">Revoko</button>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 space-y-4">
                      <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider"><i className="fas fa-key mr-2 text-blue-500"></i>Ndryshimet e Kredencialeve</h3>
                      <form onSubmit={e => { e.preventDefault(); triggerToast('Fjalëkalimi u ndryshua!', 'success'); }} className="space-y-3 text-xs">
                        <div>
                          <label className="block font-medium mb-1">Fjalëkalimi Aktual</label>
                          <div className="relative flex items-center">
                            <input type={showCurrPass ? 'text' : 'password'} className="w-full p-2.5 pr-10 border dark:border-slate-700 bg-transparent rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
                            <button type="button" onClick={() => setShowCurrPass(!showCurrPass)} className="absolute right-3 text-slate-400 hover:text-blue-500"><i className={`fas ${showCurrPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                          </div>
                        </div>
                        <div>
                          <label className="block font-medium mb-1">Fjalëkalimi i Ri</label>
                          <div className="relative flex items-center">
                            <input type={showNewPass ? 'text' : 'password'} className="w-full p-2.5 pr-10 border dark:border-slate-700 bg-transparent rounded-lg outline-none focus:ring-1 focus:ring-blue-500" />
                            <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 text-slate-400 hover:text-blue-500"><i className={`fas ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                          </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold transition hover:bg-blue-700">Përditëso</button>
                      </form>
                    </div>
                  </div>

                  {/* Login History */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider"><i className="fas fa-history mr-2 text-blue-500"></i>Login History & Auditing</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 uppercase font-semibold text-slate-400">
                          <tr>
                            <th className="p-3">Pajisja / Browser</th>
                            <th className="p-3">IP Adresa</th>
                            <th className="p-3">Data / Ora</th>
                            <th className="p-3 text-center">Statusi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {LOGIN_HISTORY.map((h, i) => (
                            <tr key={i} className={`${h.status === 'fraud' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                              <td className="p-3 font-medium">{h.device}</td>
                              <td className="p-3 font-mono">{h.ip}</td>
                              <td className="p-3 text-slate-400">{h.time}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                  h.status === 'success' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
                                  h.status === 'fraud'   ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                                  'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                                }`}>
                                  {h.status === 'success' ? 'SUCCESS' : h.status === 'fraud' ? 'FRAUD' : 'FAILED'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
      )}
    </div>
  );
}
