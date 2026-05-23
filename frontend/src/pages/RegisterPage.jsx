import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, TOKEN_KEY } from '../context/AppContext';

export default function RegisterPage() {
  const { setCurrentUser, triggerToast } = useApp();
  const navigate = useNavigate();

  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin,      setRegPin]      = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

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
      navigate('/dashboard');
    } catch { triggerToast('Server i paarritshëm. Provoni sërish.', 'error'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-950">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400">FIBANK</h2>
          <p className="text-slate-500 mt-1 text-sm">Hap llogari të re digjitale</p>
        </div>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Numër Klienti</label>
            <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Emri i Plotë</label>
            <input type="text" value={regFullName} onChange={e => setRegFullName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Email</label>
            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
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
        <p className="text-center text-xs text-slate-500 mt-6">
          <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer">← Kthehu tek Login</button>
        </p>
      </div>
    </div>
  );
}
