import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, TrendingUp, Trophy, BarChart3, Menu, X, User, Bell, Settings } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import FinancePage from './pages/FinancePage';
import SportsPage from './pages/SportsPage';
import MarketsPage from './pages/MarketsPage';
import AccountPage from './pages/AccountPage';
import AlertsPage from './pages/AlertsPage';
import SportSchedule from './pages/SportSchedule';
import UFCEventList from './pages/UFCEventList';
import UFCFightList from './pages/UFCFightList';
import MatchupDetail from './pages/MatchupDetail';
import FightDetail from './pages/FightDetail';
import MarketAnalysisPage from './pages/MarketAnalysisPage';
import NotificationsSettingsPage from './pages/NotificationsSettingsPage';

const Shell = ({ children }: { children: React.ReactNode }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon, path: '/home' },
    { id: 'finance', label: 'Finance', icon: TrendingUp, path: '/finance' },
    { id: 'sports', label: 'Sports', icon: Trophy, path: '/sports' },
    { id: 'markets', label: 'Markets', icon: BarChart3, path: '/markets' }
  ];

  const drawerItems = [
    { id: 'account', label: 'Account', icon: User, path: '/account' },
    { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts' },
    { id: 'notifications', label: 'Notification Settings', icon: Settings, path: '/settings/notifications' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col font-sans selection:bg-[#00C853]/20">
      {/* Header */}
      <header className="h-16 bg-[#12121a] px-6 flex items-center justify-between border-b border-white/5 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="HiLEX" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
          <span className="font-black text-2xl tracking-tighter italic uppercase text-white drop-shadow-md">HiLEX</span>
        </div>
        <button onClick={() => setIsDrawerOpen(true)} className="p-2 active:opacity-50 transition-opacity">
          <Menu size={24} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col overflow-y-auto">
        {children}
      </main>

      {/* Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-[280px] bg-[#0a0a0f] border-l border-white/5 transition-transform duration-500 ease-out transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Institutional Hub</span>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={22} className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-1">
              {drawerItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => { navigate(item.path); setIsDrawerOpen(false); }}
                  className="flex items-center gap-4 p-5 rounded-2xl active:bg-white/5 transition-all group cursor-pointer"
                >
                  <item.icon size={20} className="text-slate-500 group-active:text-[#00C853]" />
                  <span className="font-bold text-sm tracking-tight group-active:text-[#00C853]">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto pb-6">
              <p className="text-[8px] text-slate-800 font-black uppercase tracking-widest text-center italic">
                HiLEX Mobile Intelligence v1.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="h-20 bg-[#12121a] border-t border-white/5 px-4 flex items-center justify-around shrink-0 sticky bottom-0 z-40">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${isActive ? 'text-[#00C853]' : 'text-slate-600 opacity-60'}`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              {isActive && <div className="absolute bottom-1 w-1 h-1 bg-[#00C853] rounded-full shadow-[0_0_8px_#00C853]" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/home" element={<Shell><HomePage /></Shell>} />
        <Route path="/finance" element={<Shell><FinancePage /></Shell>} />
        <Route path="/sports" element={<Shell><SportsPage /></Shell>} />
        <Route path="/sports/ufc" element={<Shell><UFCEventList /></Shell>} />
        <Route path="/sports/ufc/event/:eventId" element={<Shell><UFCFightList /></Shell>} />
        <Route path="/sports/ufc/fight" element={<Shell><FightDetail /></Shell>} />
        <Route path="/sports/:sport" element={<Shell><SportSchedule /></Shell>} />
        <Route path="/sports/:sport/matchup" element={<Shell><MatchupDetail /></Shell>} />
        <Route path="/markets" element={<Shell><MarketsPage /></Shell>} />
        <Route path="/markets/analyze" element={<MarketAnalysisPage />} />
        <Route path="/account" element={<Shell><AccountPage /></Shell>} />
        <Route path="/alerts" element={<Shell><AlertsPage /></Shell>} />
        <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
