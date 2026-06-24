import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User, Terminal } from 'lucide-react';
import { API_URL, setToken, getToken } from '../lib/api';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (getToken()) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        setToken(data.access_token);
        navigate('/');
      } else {
        setError(data.detail || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Connection failure: Unable to communicate with authentication terminal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050507] flex items-center justify-center p-4 relative scanlines">
      {/* Background Subtle Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0e_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      {/* Terminal Form Container */}
      <div className="w-full max-w-[420px] bg-[#0c0c0e] border border-[#1e1e22] rounded overflow-hidden shadow-2xl relative z-10">
        {/* Terminal Header */}
        <div className="bg-[#111114] border-b border-[#1e1e22] px-4 py-3 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-zinc-500" />
            <span className="font-mono text-xs font-semibold tracking-wider text-zinc-400">SECURE SHELL v1.0.9</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-zinc-700 bg-zinc-900"></div>
            <div className="w-2.5 h-2.5 rounded-full border border-zinc-700 bg-zinc-900"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h2 className="font-heading text-lg font-bold tracking-widest uppercase mb-1 text-white">SYSTEM AUTHENTICATION</h2>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest">ACCESS LEVEL: SYSTEM OPERATOR ONLY</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">IDENTIFIER (USERNAME)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <User size={14} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manikandan"
                  className="mono-input w-full pl-9 text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">ACCESS DECRYPTOR (PASSWORD)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <KeyRound size={14} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="e.g. 63798"
                  className="mono-input w-full pl-9 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/60 rounded text-red-400 text-xs font-mono select-none">
                ❌ ERROR: {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mono-btn w-full font-mono text-xs uppercase py-3 mt-6"
            >
              {loading ? 'INITIALIZING SHAKE...' : 'ESTABLISH LINK'}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-8 pt-6 border-t border-[#1e1e22] text-center select-none">
            <span className="text-[9px] text-zinc-600 font-mono">
              CREDENTIALS: Manikandan // 63798
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
