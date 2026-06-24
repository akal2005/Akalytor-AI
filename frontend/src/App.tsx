import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { AI } from './pages/AI';
import { Expenses } from './pages/Expenses';
import { Notes } from './pages/Notes';
import { Login } from './pages/Login';
import { getToken, apiFetch } from './lib/api';
import { Terminal, ShieldCheck } from 'lucide-react';

// A wrapper to handle conditional layout routing and authentication
const AppContent: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const token = getToken();

  // Global Player States for Gamification
  const [username, setUsername] = useState('Operator');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  // Global Notification HUD Banner
  const [hudMessage, setHudMessage] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setHudMessage(msg);
  };

  // Automatically fade out notification banner
  useEffect(() => {
    if (hudMessage) {
      const timer = setTimeout(() => setHudMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [hudMessage]);

  const updateStats = (user: string, newLevel: number, newXp: number) => {
    setUsername(user);
    setLevel(newLevel);
    setXp(newXp);
  };

  // Helper to re-trigger dashboard stats fetch when actions complete
  const handleActionExecuted = async () => {
    try {
      const res = await apiFetch('/api/v1/analytics/dashboard');
      if (res.ok) {
        const json = await res.json();
        updateStats(username, json.level, json.xp);
      }
    } catch {}
  };

  // Authentication Guard
  if (!token && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#08080a]">
      {/* Sidebar Layout */}
      {!isLoginPage && (
        <Sidebar username={username} level={level} xp={xp} />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen ${!isLoginPage ? 'ml-64 p-8 pt-20' : ''}`}>
        {/* Top Header Banner for Operations */}
        {!isLoginPage && (
          <div className="fixed top-0 left-64 right-0 h-14 bg-[#0a0a0c]/80 backdrop-blur border-b border-[#1e1e22] z-30 flex items-center justify-between px-8 select-none">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-zinc-500" />
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">WORKSPACE SHELL CONSOLE</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={14} className="text-[#32d74b]" />
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">ENCRYPTED NODE SECURE</span>
            </div>
          </div>
        )}

        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                onUpdateStats={updateStats} 
                triggerNotification={triggerNotification} 
              />
            } 
          />
          <Route 
            path="/tasks" 
            element={
              <Tasks 
                triggerNotification={triggerNotification} 
                onActionExecuted={handleActionExecuted} 
              />
            } 
          />
          <Route 
            path="/ai" 
            element={
              <AI 
                triggerNotification={triggerNotification} 
                onActionExecuted={handleActionExecuted} 
              />
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <Expenses 
                triggerNotification={triggerNotification} 
                onActionExecuted={handleActionExecuted} 
              />
            } 
          />
          <Route 
            path="/notes" 
            element={
              <Notes 
                triggerNotification={triggerNotification} 
                onActionExecuted={handleActionExecuted} 
              />
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global HUD Alert Pop-up */}
      {hudMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-black/90 backdrop-blur-xl border border-white p-4 rounded shadow-2xl flex items-center gap-3 max-w-sm select-none">
            <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
            <div className="text-xs font-mono text-white uppercase tracking-wider">
              {hudMessage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};
