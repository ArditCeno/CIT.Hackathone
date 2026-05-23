import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ACTION_STYLE = {
  ALLOW:         { bg: 'bg-green-50 dark:bg-green-900/30',  border: 'border-green-300 dark:border-green-700',   text: 'text-green-700 dark:text-green-300',  badge: 'bg-green-500',  icon: 'fa-check-circle' },
  MFA_CHALLENGE: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-500', icon: 'fa-mobile-screen' },
  BLOCK:         { bg: 'bg-red-50 dark:bg-red-900/30',     border: 'border-red-300 dark:border-red-700',        text: 'text-red-700 dark:text-red-300',      badge: 'bg-red-500',    icon: 'fa-ban' },
};

export default function TransferPage() {
  const location = useLocation();
  const { _bearer, triggerToast, refreshCurrentUser } = useApp();

  const [transferTab, setTransferTab] = useState(location.state?.tab || 'tab-sub-transfer');

  // Transfer form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientIban, setRecipientIban] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferResult, setTransferResult] = useState(null);

  const getSubTabClass = (tabId) =>
    transferTab === tabId
      ? 'flex-shrink-0 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-blue-600 shadow-sm text-xs font-bold'
      : 'flex-shrink-0 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-xs';

  const handleTransfer = async (e) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) { triggerToast('Shuma duhet të jetë pozitive.', 'error'); return; }
    if (!recipientName.trim()) { triggerToast('Emri i marrësit është i detyrueshëm.', 'error'); return; }

    setTransferLoading(true);
    setTransferResult(null);
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { ...(_bearer()), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: recipientName,
          recipient_iban: recipientIban || 'N/A',
          amount,
          note: transferNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) { triggerToast(data.detail || 'Gabim në transfertë.', 'error'); return; }
      setTransferResult(data);
      if (data.decision === 'ALLOW') {
        triggerToast(`Transfertë e suksesshme: €${amount.toFixed(2)} dërguar tek ${data.recipient}!`, 'success');
        await refreshCurrentUser();
        setRecipientName(''); setRecipientIban(''); setTransferAmount(''); setTransferNote('');
      } else if (data.decision === 'BLOCK') {
        triggerToast('⛔ Transfertë e bllokuar nga GuardianAI!', 'error');
      } else if (data.decision === 'MFA_CHALLENGE') {
        triggerToast('⚠️ Kërkohet verifikim shtesë (MFA).', 'info');
      }
    } catch { triggerToast('Server i paarritshëm. Provoni sërish.', 'error'); }
    finally { setTransferLoading(false); }
  };

  const RiskGauge = ({ decision, riskScore }) => {
    const riskPct = decision === 'BLOCK'
      ? Math.min(100, Math.max(80, 95))
      : decision === 'MFA_CHALLENGE'
      ? Math.min(79, Math.max(40, Math.round(50 + riskScore * 40)))
      : Math.min(39, Math.max(0, Math.round(20 + riskScore * 20)));
    const gaugeColor = riskPct >= 80 ? '#ef4444' : riskPct >= 40 ? '#eab308' : '#22c55e';
    return (
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
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">Transferta & Shërbime Financiare</h2>

      <div className="flex overflow-x-auto gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl scrollbar-none">
        {[['tab-sub-transfer','Transferta'],['tab-sub-pagesa','Pagesa'],['tab-sub-fatura','Fatura'],['tab-sub-kembim','Këmbim'],['tab-sub-pakarte','Pa Kartë']].map(([id, label]) => (
          <button key={id} onClick={() => { setTransferTab(id); setTransferResult(null); }} className={getSubTabClass(id)}>{label}</button>
        ))}
      </div>

      {transferTab === 'tab-sub-transfer' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2">
              <i className="fas fa-paper-plane"></i>Transfertë Bankare
              <span className="ml-auto text-[10px] font-normal text-slate-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>GuardianAI Aktiv
              </span>
            </h3>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div><label className="block text-xs font-semibold mb-1 uppercase">Emri i Marrësit</label>
                <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-semibold mb-1 uppercase">IBAN</label>
                <input type="text" value={recipientIban} onChange={e => setRecipientIban(e.target.value)} placeholder="ALXX XXXX XXXX XXXX" className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-semibold mb-1 uppercase">Shuma (€)</label>
                <input type="number" min="0.01" step="0.01" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" /></div>
              <div><label className="block text-xs font-semibold mb-1 uppercase">Shënim (opsional)</label>
                <input type="text" value={transferNote} onChange={e => setTransferNote(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <i className="fas fa-shield-halved text-blue-500"></i>
                Çdo transfertë analizohet nga GuardianAI në kohë reale. Shumat ≥ €8,000 bllokohen automatikisht.
              </p>
              <button type="submit" disabled={transferLoading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm transition hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {transferLoading ? <><i className="fas fa-spinner fa-spin"></i>Duke analizuar…</> : <><i className="fas fa-shield-halved"></i>Ekzekuto me GuardianAI</>}
              </button>
            </form>
          </div>

          {transferResult && (() => {
            const s = ACTION_STYLE[transferResult.decision] || {
              bg: 'bg-slate-50 dark:bg-slate-800',
              border: 'border-slate-300 dark:border-slate-600',
              text: 'text-slate-600 dark:text-slate-300',
              badge: 'bg-slate-400',
              icon: 'fa-circle-question',
            };
            return (
              <div className={`rounded-xl border-2 ${s.bg} ${s.border} p-4 space-y-2`}>
                <div className="flex items-center gap-4">
                  <div className={`${s.badge} text-white w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <i className={`fas ${s.icon} text-lg`}></i>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xl font-black ${s.text}`}>{transferResult.decision?.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-400">
                      €{transferResult.amount?.toFixed(2)} → {transferResult.recipient}
                      {transferResult.new_balance != null && <span className="ml-2 text-green-600 font-semibold">· Bilanci: €{Number(transferResult.new_balance).toFixed(2)}</span>}
                    </p>
                  </div>
                  <RiskGauge decision={transferResult.decision} riskScore={transferResult.risk_score ?? 0} />
                </div>
                {transferResult.reason && <p className={`text-xs leading-relaxed ${s.text}`}>{transferResult.reason}</p>}
              </div>
            );
          })()}
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
  );
}
