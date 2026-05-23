import React, { createContext, useContext, useState, useEffect } from 'react';

export const TOKEN_KEY = 'guardian_token';
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser]           = useState(null);
  const [authLoading, setAuthLoading]           = useState(true);
  const [userTransactions, setUserTransactions] = useState(null);
  const [userAlerts, setUserAlerts]             = useState(null);
  const [myStats, setMyStats]                   = useState(null);
  const [adminStats, setAdminStats]             = useState(null);
  const [adminUsers, setAdminUsers]             = useState(null);
  const [adminEvents, setAdminEvents]           = useState(null);
  const [chartData, setChartData]               = useState(null);
  const [decisionBreakdown, setDecisionBreakdown] = useState(null);
  const [statsLoading, setStatsLoading]         = useState(false);
  const [mockData, setMockData]                 = useState(null);
  const [darkMode, setDarkMode]                 = useState(false);
  const [showToast, setShowToast]               = useState(false);
  const [toastMessage, setToastMessage]         = useState('');
  const [toastType, setToastType]               = useState('success');

  const _bearer = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` });

  const triggerToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

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
    } catch {}
  };

  const refreshCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: _bearer() });
      if (res.ok) setCurrentUser(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetch('/mock_data.json').then(r => r.json()).then(setMockData).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setAuthLoading(false); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(user => setCurrentUser(user))
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
    setUserTransactions(null);
    setUserAlerts(null);
    setMyStats(null);
    setAdminStats(null);
    setAdminUsers(null);
    setAdminEvents(null);
    setChartData(null);
    setDecisionBreakdown(null);
    setStatsLoading(false);
  };

  const markAlertRead = async (alertId) => {
    try {
      const res = await fetch(`/api/me/alerts/${alertId}/read`, {
        method: 'PATCH',
        headers: _bearer(),
      });
      if (res.ok) {
        setUserAlerts(prev =>
          prev ? prev.map(a => a.id === alertId ? { ...a, is_read: true } : a) : prev
        );
        return true;
      }
    } catch {}
    return false;
  };

  const unreadCount = userAlerts
    ? userAlerts.filter(a => !a.is_read).length
    : (myStats?.unread_alerts ?? 0);

  return (
    <AppContext.Provider value={{
      TOKEN_KEY,
      currentUser, setCurrentUser,
      authLoading,
      userTransactions, setUserTransactions,
      userAlerts, setUserAlerts,
      myStats, setMyStats,
      adminStats,
      adminUsers,
      adminEvents, setAdminEvents,
      chartData,
      decisionBreakdown,
      statsLoading,
      mockData,
      darkMode, setDarkMode,
      showToast, toastMessage, toastType, triggerToast,
      _bearer,
      handleLogout,
      loadUserData,
      refreshCurrentUser,
      markAlertRead,
      unreadCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
