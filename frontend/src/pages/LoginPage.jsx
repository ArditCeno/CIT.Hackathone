import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, TOKEN_KEY } from '../context/AppContext';

export default function LoginPage() {
  const { setCurrentUser, triggerToast } = useApp();
  const navigate = useNavigate();

  const [loginType,      setLoginType]      = useState('individ');
  const [loginEmail,     setLoginEmail]     = useState('');
  const [loginNipt,      setLoginNipt]      = useState('');
  const [loginPassword,  setLoginPassword]  = useState('');
  const [loginPin,       setLoginPin]       = useState('');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showLoginPass,  setShowLoginPass]  = useState(false);
  const [errorMsg,       setErrorMsg]       = useState('');
  const [isLoading,      setIsLoading]      = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!captchaChecked) { setErrorMsg('Ju lutem plotësoni CAPTCHA-n para se të vazhdoni!'); return; }
    setIsLoading(true);
    let success = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      let res;
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loginEmail, password: loginPassword, pin: loginPin }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || 'Kredencialet janë të gabuara!');
        return;
      }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setCurrentUser(data.user);
      triggerToast(`Mirë se erdhe, ${data.user.full_name}!`, 'success');
      success = true;
      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorMsg('Kërkesa skadoi. Kontrolloni lidhjen dhe provoni sërish.');
      } else {
        setErrorMsg('Server i paarritshëm. Provoni sërish.');
      }
    } finally {
      if (!success) setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-950">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
            <i className="fas fa-university text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">FIBANK</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Identifikim i Sigurt · <span className="text-green-500 font-semibold"><i className="fas fa-shield-halved mr-1"></i>GuardianAI Active</span>
          </p>
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
            <button type="button" onClick={() => navigate('/forgot')} className="text-blue-600 font-medium hover:underline bg-transparent border-0 cursor-pointer">Harruat Fjalëkalimin?</button>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="captcha" checked={captchaChecked} onChange={e => setCaptchaChecked(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="captcha" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">Unë nuk jam robot</label>
            </div>
            <i className="fas fa-shield-halved text-blue-600 text-lg"></i>
          </div>
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <i className="fas fa-times-circle flex-shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}
          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
            {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Duke u kyçur...</> : 'Hyni në Llogari'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-6">
          Pa llogari? <button onClick={() => navigate('/register')} className="text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer ml-1">Regjistrohu</button>
        </p>
      </div>
    </div>
  );
}
