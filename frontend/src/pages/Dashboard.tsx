import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  TrendingUp, 
  CheckCircle, 
  PiggyBank, 
  Calendar, 
  Brain, 
  Loader2,
  Sparkles,
  Zap,
  Star
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { HabitHeatmap } from '../components/HabitHeatmap';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface TaskItem {
  id?: string;
  title: string;
  category: string;
  due: string;
}

interface DashboardData {
  productivity_score: string;
  tasks_completed: string;
  monthly_savings: string;
  upcoming_events: string;
  remaining_tasks: TaskItem[];
  chart_data: number[];
  xp: number;
  level: number;
}

interface DashboardProps {
  onUpdateStats: (username: string, level: number, xp: number) => void;
  triggerNotification: (msg: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onUpdateStats, triggerNotification }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await apiFetch('/api/v1/analytics/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Extract operator username from jwt payload or use default env settings
        const token = localStorage.getItem('manitor_token');
        let parsedUser = 'Operator';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            parsedUser = payload.sub || 'Operator';
          } catch {}
        }
        onUpdateStats(parsedUser, json.level, json.xp);
      } else {
        setError('Synchronizing error: Unable to load terminal data.');
      }
    } catch (err) {
      setError('Connection failure: Unable to communicate with core database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Quick Task Completion from Dashboard
  const handleCompleteTask = async (taskTitle: string) => {
    // Find task in local state to get its ID (we will need to retrieve all tasks from work router or fetch it)
    try {
      setCompletingTaskId(taskTitle);
      // Fetch all work tasks to find the task ID for this title
      const tasksRes = await apiFetch('/api/v1/work/');
      if (!tasksRes.ok) throw new Error();
      const allTasks = await tasksRes.json();
      
      const targetTask = allTasks.find((t: any) => t.task_name === taskTitle && t.status !== 'Completed');
      if (!targetTask) {
        // Fallback: If not found, show a mock message
        triggerNotification('Task reference not found in workspace.');
        setCompletingTaskId(null);
        return;
      }

      // Send PUT request to complete task
      const completeRes = await apiFetch(`/api/v1/work/${targetTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' }),
      });

      if (completeRes.ok) {
        const result = await completeRes.json();
        
        // Show XP and Level up alerts
        let alertMsg = `Task Completed! +50 XP Gained.`;
        if (result.level_up) {
          alertMsg = `🎉 LEVEL UP! You reached LEVEL ${result.current_level}!`;
          // Play a nice browser system beep sound if allowed
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          } catch {}
        }
        triggerNotification(alertMsg);
        
        // Refetch dashboard
        await fetchDashboardData();
      }
    } catch (err) {
      triggerNotification('Failed to update task status on backend database.');
    } finally {
      setCompletingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 select-none">
        <Loader2 className="animate-spin text-white" size={32} />
        <span className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">Synchronizing secure connection...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-red-500 font-mono text-sm uppercase">⚠️ {error || 'Terminal Fetch Failed'}</div>
        <button onClick={fetchDashboardData} className="mono-btn-secondary text-xs uppercase font-mono mt-2">
          Retry Handshake
        </button>
      </div>
    );
  }

  // Format Recharts data
  const formattedChartData = data.chart_data.map((value, index) => ({
    name: `W${index + 1}`,
    value: value
  }));

  const metrics = [
    { title: 'Productivity Index', value: data.productivity_score, icon: TrendingUp, detail: 'Task completion ratio' },
    { title: 'Completed Actions', value: data.tasks_completed, icon: CheckCircle, detail: 'Finished / Total' },
    { title: 'Reserve Funds', value: data.monthly_savings, icon: PiggyBank, detail: 'Current tracked savings' },
    { title: 'Calendar Grid', value: data.upcoming_events, icon: Calendar, detail: 'Due events today' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 select-none">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1.5 font-heading">
            Good Evening, Operator
          </h2>
          <p className="text-zinc-500 text-xs font-mono">
            OPERATING SYSTEM CONSOLE // DOCK STATUS: STABLE
          </p>
        </div>
        <NavLink to="/ai" className="mono-btn text-xs font-mono uppercase py-2.5 px-5">
          <Brain size={14} />
          <span>Engage Moni AI</span>
        </NavLink>
      </header>

      {/* Grid Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="mono-panel p-5 flex flex-col justify-between h-[130px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">{card.title}</span>
                <Icon size={16} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono tracking-tight text-white mb-0.5">{card.value}</p>
                <p className="text-[9px] text-zinc-500 font-mono uppercase">{card.detail}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Heatmap Section */}
      <section>
        <HabitHeatmap />
      </section>

      {/* Charts & Tasks Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Chart */}
        <div className="lg:col-span-2 mono-panel p-6 flex flex-col h-[380px]">
          <div className="mb-4">
            <h3 className="font-heading text-sm font-semibold tracking-wider text-white uppercase">Expense Index Trend</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Weekly financial burn index representation</p>
          </div>
          <div className="flex-1 w-full text-xs font-mono mt-2">
            <ResponsiveContainer width="100%" height="95%">
              <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#17171a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" tickLine={false} />
                <YAxis stroke="#52525b" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid #1e1e22', borderRadius: '4px' }}
                  labelStyle={{ color: '#fff', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                />
                <Bar dataKey="value" fill="#ffffff" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Queue */}
        <div className="mono-panel p-6 flex flex-col h-[380px]">
          <div className="mb-4">
            <h3 className="font-heading text-sm font-semibold tracking-wider text-white uppercase">Queue Tasks</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Pending system actions</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {data.remaining_tasks.length > 0 ? (
              data.remaining_tasks.map((task, idx) => (
                <div 
                  key={idx}
                  onClick={() => !completingTaskId && handleCompleteTask(task.title)}
                  className={`p-3 bg-[#0c0c0e] border border-[#1e1e22] rounded flex items-center justify-between gap-3 group cursor-pointer hover:border-white transition-all ${
                    completingTaskId === task.title ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-4 h-4 rounded-full border border-zinc-600 flex-shrink-0 flex items-center justify-center group-hover:border-white transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-white transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-white truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {task.category}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">{task.due}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 group-hover:text-white transition-colors font-bold">+50 XP</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs italic text-zinc-500">Queue is completely synchronized.</p>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">No tasks pending.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="mono-panel p-6">
        <h3 className="font-heading text-sm font-semibold tracking-wider text-white uppercase mb-4 flex items-center gap-2">
          <Zap size={14} className="text-white" />
          <span>System Insights</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#0a0a0c] border border-[#1e1e22] rounded flex items-start gap-3">
            <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-white mt-0.5">
              <Sparkles size={12} />
            </div>
            <div>
              <p className="text-xs font-medium text-white font-mono">Performance Metric</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Your consistency rating has increased by 8% this week. Maintaining this trajectory will level you up twice as fast.
              </p>
            </div>
          </div>
          <div className="p-4 bg-[#0a0a0c] border border-[#1e1e22] rounded flex items-start gap-3">
            <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-white mt-0.5">
              <Star size={12} />
            </div>
            <div>
              <p className="text-xs font-medium text-white font-mono">Optimizer Recommendation</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                You have 3 high-priority tasks due within 48 hours. Try using Moni AI's voice scheduling to block out hours in your schedule.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
