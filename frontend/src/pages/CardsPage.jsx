import React from 'react';
import { useApp } from '../context/AppContext';

export default function CardsPage() {
  const { currentUser, triggerToast } = useApp();

  const USER = {
    name:      currentUser?.full_name || 'Arjola Hoxha',
    card:      '5412 •••• •••• 8804',
    cardExpiry:'09/27',
  };

  const [showCurrPass, setShowCurrPass] = React.useState(false);
  const [showNewPass,  setShowNewPass]  = React.useState(false);

  return (
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
  );
}
