import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Trophy, BarChart3, Menu, X, User, Bell, Settings } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Empty Placeholder Pages
const Page = ({ title }: { title: string }) => <div className="flex-grow"></div>;

const Shell = ({ children }: { children: React.ReactNode }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/home' },
    { id: 'finance', label: 'Finance', icon: TrendingUp, path: '/finance' },
    { id: 'sports', label: 'Sports', icon: Trophy, path: '/sports' },
    { id: 'markets', label: 'Markets', icon: BarChart3, path: '/markets' }
  ];

  const drawerItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 bg-[#12121a] px-6 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center">
            <img src="/logo.png" alt="" className="w-5 h-5 object-contain opacity-80" />
          </div>
          <span className="font-bold text-xl tracking-tight">HiLEX</span>
        </div>
        <button onClick={() => setIsDrawerOpen(true)} className="p-2">
          <Menu size={24} />
        </button>
      </header>

      {/* Main Content Area (Empty for now) */}
      <main className="flex-grow flex flex-col">
        {children}
      </main>

      {/* Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60" onClick={() => setIsDrawerOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-[280px] bg-[#0a0a0f] border-l border-white/5 transition-transform duration-300 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6">
            <div className="flex justify-end mb-8">
              <button onClick={() => setIsDrawerOpen(false)}>
                <X size={24} className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-1">
              {drawerItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl active:bg-white/5 transition-colors">
                  <item.icon size={20} className="text-slate-500" />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="h-20 bg-[#12121a] border-t border-white/5 px-4 flex items-center justify-around shrink-0">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 flex-1 transition-colors ${isActive ? 'text-[#00C853]' : 'text-slate-500'}`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        
        <Route path="/home" element={<Shell><Page title="Home" /></Shell>} />
        <Route path="/finance" element={<Shell><Page title="Finance" /></Shell>} />
        <Route path="/sports" element={<Shell><Page title="Sports" /></Shell>} />
        <Route path="/markets" element={<Shell><Page title="Markets" /></Shell>} />
      </Routes>
    </Router>
  );
}
