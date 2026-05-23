import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { useApp } from '../context/AppContext';

const SCAN_PRESETS = [
  { label: 'Normal',          icon: 'fa-check-circle',  color: 'green',
    payload: { transaction_amount: 85.50,  hour_of_day: 14, is_new_device: 0, is_new_ip: 0, is_foreign_country: 0, distance_from_usual_km: 3.2,    is_phishing_detected: 0 } },
  { label: 'Account Takeover', icon: 'fa-user-secret',  color: 'yellow',
    payload: { transaction_amount: 150.00, hour_of_day: 10, is_new_device: 1, is_new_ip: 1, is_foreign_country: 0, distance_from_usual_km: 5000.0,  is_phishing_detected: 0 } },
  { label: 'Smishing SMS',    icon: 'fa-comment-slash', color: 'orange',
    payload: { transaction_amount: 150.00, hour_of_day: 11, is_new_device: 0, is_new_ip: 0, is_foreign_country: 0, distance_from_usual_km: 2.0,    is_phishing_detected: 0, sms_payload: 'Ju lutem verifikoni llogarinë tuaj në Fibank urgjentisht në këtë link: http://fibank-verify.ru/login' } },
  { label: 'Phishing URL',    icon: 'fa-fish',          color: 'red',
    payload: { transaction_amount: 500.00, hour_of_day: 9,  is_new_device: 0, is_new_ip: 0, is_foreign_country: 0, distance_from_usual_km: 1.0,    is_phishing_detected: 0, detected_url: 'https://secure-fibank.phish.ru/account/update' } },
];

const ACTION_STYLE = {
  ALLOW:         { bg: 'bg-green-50 dark:bg-green-900/30',  border: 'border-green-300 dark:border-green-700',   text: 'text-green-700 dark:text-green-300',  badge: 'bg-green-500',  icon: 'fa-check-circle' },
  MFA_CHALLENGE: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-500', icon: 'fa-mobile-screen' },
  BLOCK:         { bg: 'bg-red-50 dark:bg-red-900/30',     border: 'border-red-300 dark:border-red-700',        text: 'text-red-700 dark:text-red-300',      badge: 'bg-red-500',    icon: 'fa-ban' },
  ERROR:         { bg: 'bg-slate-100 dark:bg-slate-800',    border: 'border-slate-300 dark:border-slate-600',    text: 'text-slate-500',                      badge: 'bg-slate-400',  icon: 'fa-triangle-exclamation' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    currentUser, userTransactions,
    myStats, adminStats, adminUsers, adminEvents, setAdminEvents,
    chartData, decisionBreakdown, statsLoading, mockData,
    _bearer, triggerToast,
  } = useApp();

  const USER = {
    name:    currentUser?.full_name || 'Arjola Hoxha',
    balance: currentUser?.balance != null
               ? Number(currentUser.balance).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
               : '4,287.50',
    iban:    currentUser?.iban || 'AL47 2121 1009 0000 0002 3569 8741',
    card:    '5412 •••• •••• 8804',
    cardExpiry: '09/27',
    status:  currentUser?.role === 'admin' ? 'Admin' : 'Premium',
  };

  // Scanner state
  const [scanResult,  setScanResult]  = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanAmount,  setScanAmount]  = useState('250');
  const [scanHour,    setScanHour]    = useState('14');
  const [scanNewDevice, setScanNewDevice] = useState(false);
  const [scanNewIp,     setScanNewIp]     = useState(false);
  const [scanForeign,   setScanForeign]   = useState(false);
  const [scanDistance,  setScanDistance]  = useState('5');
  const [scanPhishing,  setScanPhishing]  = useState(false);

  // Chart refs
  const chartRef         = useRef(null);
  const chartInstanceRef = useRef(null);
  const pieChartRef      = useRef(null);
  const pieChartInst     = useRef(null);

  const recentTx = (userTransactions || []).slice(0, 5);

  const statCards = currentUser?.role === 'admin'
    ? [
        { label: 'Total Events',   value: adminStats?.total_events  ?? '…', icon: 'fa-bolt',                 color: 'blue'   },
        { label: 'Fraud Detected', value: adminStats?.total_fraud   ?? '…', icon: 'fa-triangle-exclamation', color: 'red'    },
        { label: 'Fraud Rate',     value: adminStats ? `${adminStats.fraud_rate}%` : '…', icon: 'fa-percent', color: 'orange' },
        { label: 'Active Users',   value: adminStats?.total_users   ?? '…', icon: 'fa-users',                color: 'green'  },
      ]
    : [
        { label: 'Transaksionet', value: myStats?.total_transactions ?? '…', icon: 'fa-arrow-right-arrow-left', color: 'blue'   },
        { label: 'Mashtrime',     value: myStats?.fraud_count        ?? '…', icon: 'fa-triangle-exclamation',   color: 'red'    },
        { label: 'Njoftime',      value: myStats?.unread_alerts      ?? '…', icon: 'fa-bell',                   color: 'orange' },
        { label: 'Bilanci',       value: myStats ? `€ ${Number(myStats.balance).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '…', icon: 'fa-wallet', color: 'green' },
      ];

  // Line chart
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    const MONTH_NAMES = ['Jan','Shk','Mar','Pri','Maj','Qer','Kor','Gus','Sht','Tet','Nën','Dhj'];
    let labels, totalData, fraudData;
    if (chartData && chartData.length > 0) {
      labels    = chartData.map(d => { const dt = new Date(d.date); return `${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}`; });
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
    } else { return; }
    chartInstanceRef.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [
        { label: 'Total Events',    data: totalData, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)', fill: true, tension: 0.3, pointRadius: 3 },
        { label: 'Fraud / Blocked', data: fraudData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.3, pointRadius: 3 },
      ]},
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(100,116,139,0.08)' } }, x: { grid: { display: false } } },
      },
    });
    return () => { if (chartInstanceRef.current) chartInstanceRef.current.destroy(); };
  }, [chartData, mockData]);

  // Pie chart
  useEffect(() => {
    if (!pieChartRef.current || !decisionBreakdown) return;
    if (pieChartInst.current) pieChartInst.current.destroy();
    const labels = Object.keys(decisionBreakdown);
    const values = Object.values(decisionBreakdown);
    const colors = labels.map(l => l === 'ALLOW' ? '#22c55e' : l === 'MFA_CHALLENGE' ? '#eab308' : l === 'BLOCK' ? '#ef4444' : '#94a3b8');
    pieChartInst.current = new Chart(pieChartRef.current.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#1e293b' }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 10 }, color: '#94a3b8' } } },
      },
    });
    return () => { if (pieChartInst.current) pieChartInst.current.destroy(); };
  }, [decisionBreakdown]);

  // TASK 5: Admin live event feed — refresh every 5s
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/dashboard/events', { headers: _bearer() });
        if (res.ok) setAdminEvents(await res.json());
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.role]);

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

  return (
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
        {statsLoading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-600 rounded w-20"></div>
            </div>
          </div>
        )) : statCards.map(({ label, value, icon, color }) => (
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
            <button onClick={() => navigate('/transfer', { state: { tab: 'tab-sub-transfer' } })} className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:scale-105 transition-transform"><i className="fas fa-paper-plane block mb-1 text-lg"></i>Dërgo</button>
            <button onClick={() => navigate('/transfer', { state: { tab: 'tab-sub-fatura' } })}  className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:scale-105 transition-transform"><i className="fas fa-file-invoice block mb-1 text-lg"></i>Fatura</button>
            <button onClick={() => navigate('/transfer', { state: { tab: 'tab-sub-kembim' } })}  className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:scale-105 transition-transform"><i className="fas fa-rotate block mb-1 text-lg"></i>Këmbim</button>
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
            {recentTx.length === 0 && statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>
                    <div className="space-y-1.5">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-600 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-14"></div>
                </div>
              ))
            ) : recentTx.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Nuk ka transaksione.</p>
            ) : recentTx.map(tx => (
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
                  {tx.amount !== null && (
                    <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-slate-700 dark:text-slate-200'}`}>
                      {tx.amount > 0 ? '+' : ''}€{Math.abs(tx.amount).toFixed(2)}
                    </p>
                  )}
                  {tx.fraud && <span className="text-red-500 font-bold">FRAUD</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GuardianAI Live Scanner */}
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
          <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Demo Presets</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {SCAN_PRESETS.map(preset => (
              <button key={preset.label} onClick={() => runScan(preset.payload)} disabled={scanLoading}
                className={`p-3 rounded-xl border-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  preset.color === 'green'  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:border-green-400' :
                  preset.color === 'yellow' ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:border-yellow-400' :
                  preset.color === 'orange' ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:border-orange-400' :
                  'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:border-red-400'
                }`}>
                <i className={`fas ${preset.icon} block mb-1 text-base`}></i>
                {preset.label}
              </button>
            ))}
          </div>

          <details className="mb-4">
            <summary className="text-xs font-semibold text-slate-500 cursor-pointer hover:text-blue-600 transition-colors select-none">
              <i className="fas fa-sliders mr-1"></i>Skanim i Personalizuar
            </summary>
            <form onSubmit={handleCustomScan} className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              <div><label className="block text-[10px] font-semibold uppercase mb-1 text-slate-400">Shuma (€)</label><input type="number" value={scanAmount} onChange={e => setScanAmount(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-700 bg-transparent text-xs outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="block text-[10px] font-semibold uppercase mb-1 text-slate-400">Ora</label><input type="number" min="0" max="23" value={scanHour} onChange={e => setScanHour(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-700 bg-transparent text-xs outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="block text-[10px] font-semibold uppercase mb-1 text-slate-400">Distanca (km)</label><input type="number" value={scanDistance} onChange={e => setScanDistance(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-700 bg-transparent text-xs outline-none focus:ring-1 focus:ring-blue-500" /></div>
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
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={gaugeColor} strokeWidth="3"
                          strokeDasharray={`${riskPct} 100`} strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
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

      {/* Admin: Decision Breakdown */}
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

      {/* Admin: Users at Risk */}
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
                {adminUsers.filter(u => u.role === 'user').sort((a, b) => b.fraud_count - a.fraud_count).map(u => {
                  const risk = u.fraud_count >= 2
                    ? { label: 'I LARTE', cls: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' }
                    : u.fraud_count === 1
                    ? { label: 'MESATAR', cls: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' }
                    : { label: 'I ULET',  cls: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' };
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

      {/* Admin: All Events (live feed) */}
      {currentUser?.role === 'admin' && adminEvents && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b dark:border-slate-700 flex items-center gap-2">
            <i className="fas fa-list-ul text-blue-500"></i>
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Te gjitha Eventet ({adminEvents.length})</h3>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-green-500 font-semibold">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>LIVE · auto-refresh 5s
            </span>
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
                {adminEvents.slice(0, 15).map(ev => (
                  <tr key={ev.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 ${ev.decision === 'BLOCK' ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                    <td className="p-3 font-medium capitalize">{ev.event_type}</td>
                    <td className="p-3 font-semibold">{ev.full_name || ev.username}</td>
                    <td className="p-3 font-mono text-slate-400">{ev.ip_address}</td>
                    <td className="p-3 text-right">{ev.amount != null ? `€${Math.abs(ev.amount).toFixed(2)}` : '—'}</td>
                    <td className="p-3 text-center font-mono">{ev.risk_score != null ? ev.risk_score.toFixed(2) : '—'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.decision === 'BLOCK'         ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
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
  );
}
