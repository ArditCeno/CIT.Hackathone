import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const ALL_TRANSACTIONS = [
  { id: 'KA_E003', date: '2025-06-15 13:15', type: 'Transfer',  recipient: 'Unknown (Rome)',  amount: -5000.00, city: 'Rome',   device: 'Desktop_Windows', fraud: true },
  { id: 'KA_E002', date: '2025-06-15 13:00', type: 'Login',     recipient: 'IP 89.96.123.45', amount: null,     city: 'Rome',   device: 'Desktop_Windows', fraud: true },
  { id: 'KA_E001', date: '2025-06-15 10:00', type: 'Login',     recipient: 'Normal Session',  amount: null,     city: 'Tiranë', device: 'Desktop_Windows', fraud: false },
  { id: 'T001',    date: '2025-06-10 09:30', type: 'Payment',   recipient: 'OSHEE sh.a.',     amount: -125.50,  city: 'Tiranë', device: 'Mobile_iOS',      fraud: false },
  { id: 'T002',    date: '2025-06-08 14:20', type: 'Transfer',  recipient: 'Besnik Kola',     amount: -350.00,  city: 'Berat',  device: 'Desktop_Mac',     fraud: false },
  { id: 'T003',    date: '2025-06-05 11:05', type: 'Deposit',   recipient: 'Paga Mujore',     amount: +2100.00, city: 'Tiranë', device: 'Desktop_Mac',     fraud: false },
  { id: 'T004',    date: '2025-05-28 16:44', type: 'Payment',   recipient: 'UKT Ujësjellës',  amount: -48.20,   city: 'Tiranë', device: 'Mobile_iOS',      fraud: false },
  { id: 'T005',    date: '2025-05-20 10:10', type: 'Transfer',  recipient: 'Elona Dervishi',  amount: -200.00,  city: 'Tiranë', device: 'Desktop_Mac',     fraud: false },
  { id: 'T006',    date: '2025-04-18 02:33', type: 'Transfer',  recipient: 'Unknown',         amount: -1800.00, city: 'Berlin', device: 'Mobile_Android',  fraud: true },
  { id: 'T007',    date: '2025-04-01 09:00', type: 'Deposit',   recipient: 'Paga Mujore',     amount: +2100.00, city: 'Tiranë', device: 'Desktop_Mac',     fraud: false },
];

export default function TransactionsPage() {
  const { currentUser, userTransactions, mockData, triggerToast } = useApp();
  const [txSearch, setTxSearch] = useState('');

  const allTx = userTransactions || ALL_TRANSACTIONS;
  const filteredTx = allTx.filter(tx =>
    txSearch === '' ||
    tx.recipient.toLowerCase().includes(txSearch.toLowerCase()) ||
    tx.type.toLowerCase().includes(txSearch.toLowerCase())
  );

  const downloadCSV = () => {
    const headers = ['ID', 'Data', 'Tipi', 'Destinatari', 'Shuma (EUR)', 'Qyteti', 'Pajisja', 'Mashtrim'];
    const rows = allTx.map(tx => [
      tx.id, tx.date, tx.type, tx.recipient,
      tx.amount ?? '', tx.city ?? '', tx.device ?? '',
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

  return (
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
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex-shrink-0">
            <i className="fas fa-download"></i>
            <span className="hidden sm:inline">Shkarko CSV</span>
          </button>
        </div>
      </div>

      {/* Admin only: user risk table from mock data */}
      {currentUser?.role === 'admin' && mockData?.user_risk && (
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
  );
}
