import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-950">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Rifito Qasjen</h2>
          <p className="text-slate-500 text-xs mt-1">Shkruani email-in për kodin OTP.</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); navigate('/reset'); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Email Adresa</label>
            <input type="email" required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition">Dërgo Kodin</button>
        </form>
        <p className="text-center text-xs mt-4">
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline bg-transparent border-0 cursor-pointer">← Kthehu</button>
        </p>
      </div>
    </div>
  );
}
