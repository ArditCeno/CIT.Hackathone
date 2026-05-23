import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ResetPage() {
  const { triggerToast } = useApp();
  const navigate = useNavigate();
  const [showResetPass, setShowResetPass] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-950">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-amber-500"><i className="fas fa-lock-open mr-2"></i>Reset Password</h2>
          <p className="text-slate-500 text-xs mt-1">Vendosni fjalëkalimin e ri.</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); triggerToast('Fjalëkalimi u ndryshua!', 'success'); navigate('/login'); }} className="space-y-4">
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
    </div>
  );
}
