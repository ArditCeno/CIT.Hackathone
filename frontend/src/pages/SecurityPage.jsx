import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CITY_RISK = [
  { city: 'Rome',     total: 3,   fraud: 3,  rate: 100.0 },
  { city: 'Berlin',   total: 5,   fraud: 5,  rate: 100.0 },
  { city: 'Milan',    total: 3,   fraud: 3,  rate: 100.0 },
  { city: 'Istanbul', total: 2,   fraud: 2,  rate: 100.0 },
  { city: 'Athens',   total: 2,   fraud: 2,  rate: 100.0 },
  { city: 'Elbasan',  total: 89,  fraud: 13, rate: 14.61 },
  { city: 'Lezhë',    total: 49,  fraud: 6,  rate: 12.24 },
  { city: 'Vlorë',    total: 103, fraud: 12, rate: 11.65 },
  { city: 'Berat',    total: 163, fraud: 16, rate: 9.82 },
  { city: 'Shkodër',  total: 88,  fraud: 8,  rate: 9.09 },
];

const LOGIN_HISTORY = [
  { device: 'Desktop Windows / Chrome 124', ip: '192.168.1.100', time: '2025-06-15 10:00', status: 'success' },
  { device: 'Desktop Windows / Chrome 124', ip: '89.96.123.45',  time: '2025-06-15 13:00', status: 'fraud' },
  { device: 'Mobile iOS / Safari 17',       ip: '212.55.100.2',  time: '2025-06-10 09:22', status: 'success' },
  { device: 'Desktop Mac / Firefox 125',    ip: '192.168.1.100', time: '2025-06-08 08:15', status: 'success' },
  { device: 'Mobile Android / Chrome 123',  ip: '46.99.201.100', time: '2025-05-29 19:41', status: 'failed' },
];

const TRUSTED_DEVICES = [
  { name: 'MacBook Pro 16" — Chrome 125',    last: '2025-06-10 09:22', trusted: true },
  { name: 'iPhone 15 Pro — Safari 17',        last: '2025-06-08 08:15', trusted: true },
  { name: 'Unknown Desktop — Windows/Chrome', last: '2025-06-15 13:00', trusted: false },
];

export default function SecurityPage() {
  const { userAlerts, unreadCount, markAlertRead, triggerToast } = useApp();
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass,  setShowNewPass]  = useState(false);

  const handleMarkRead = async (alertId) => {
    const ok = await markAlertRead(alertId);
    if (ok) triggerToast('Njoftimi u shënua si i lexuar.', 'success');
    else    triggerToast('Gabim gjatë përditësimit.', 'error');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold"><i className="fas fa-shield-halved text-blue-600 mr-2"></i>Siguria & Cilësimet</h2>
        <p className="text-slate-500 text-xs mt-0.5">GuardianAI mbron llogarinë tuaj 24/7 — analizë e aktivitetit, detektim smishing dhe bllokues phishing.</p>
      </div>

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
                  <button onClick={() => handleMarkRead(alert.id)} className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex-shrink-0 mt-1">
                    Shëno si lexuar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                      c.rate > 10    ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' :
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
  );
}
