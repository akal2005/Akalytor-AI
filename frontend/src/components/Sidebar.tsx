import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Brain, 
  DollarSign, 
  FileText, 
  LogOut
} from 'lucide-react';
import { removeToken } from '../lib/api';

interface SidebarProps {
  username: string;
  level: number;
  xp: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ username, level, xp }) => {
  const navigate = useNavigate();
  const nextLevelXp = level * 100;
  const xpPercentage = Math.min((xp / nextLevelXp) * 100, 100);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'MONI AI', icon: Brain, path: '/ai' },
    { name: 'Expenses', icon: DollarSign, path: '/expenses' },
    { name: 'Notes', icon: FileText, path: '/notes' },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#0f0f11] border-r border-[#1e1e22] flex flex-col p-4 z-40 select-none">
      {/* Title */}
      <div className="flex items-center gap-3 py-6 px-2 border-b border-[#1e1e22]">
        <div className="w-8 h-8 rounded border border-white flex items-center justify-center bg-black">
          <span className="font-mono text-lg font-bold text-white">M</span>
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold tracking-widest text-white">MANITOR OS</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">v1.0.0 // ONLINE</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 mt-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 ${
                  isActive 
                    ? 'bg-white text-black font-medium' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile & Gamification Stats Widget */}
      <div className="mt-auto border-t border-[#1e1e22] pt-4">
        {/* User Card */}
        <div className="flex items-center gap-3 p-2 bg-[#151518] border border-[#1e1e22] rounded mb-3">
          <div className="w-9 h-9 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold font-mono">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate font-mono">{username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="led-indicator xp"></span>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Operator</p>
            </div>
          </div>
        </div>

        {/* Gamification Progress */}
        <div className="px-2 mb-4 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
            <span>LVL {level}</span>
            <span>{xp} / {nextLevelXp} XP</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white border border-transparent hover:border-[#1e1e22] hover:bg-zinc-950 py-2 rounded text-xs transition-all font-mono"
        >
          <LogOut size={14} />
          <span>TERMINATE SESSION</span>
        </button>
      </div>
    </aside>
  );
};
