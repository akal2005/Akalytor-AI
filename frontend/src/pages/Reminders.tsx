import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Bell, 
  Trash2, 
  Calendar, 
  Clock, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: string;
  is_recurring: boolean;
}

interface RemindersProps {
  triggerNotification: (msg: string) => void;
  onActionExecuted: () => void;
}

export const Reminders: React.FC<RemindersProps> = ({ triggerNotification, onActionExecuted }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New reminder form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [isRecurring, setIsRecurring] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchReminders = async () => {
    try {
      const res = await apiFetch('/api/v1/reminders/');
      if (res.ok) {
        const data = await res.json();
        // Sort reminders by due date
        const sorted = data.sort((a: Reminder, b: Reminder) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );
        setReminders(sorted);
      } else {
        setError('Error loading reminders database.');
      }
    } catch (err) {
      setError('Connection error: Unable to contact reminder system.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    setSubmitting(true);

    try {
      const formattedDate = new Date(dueDate).toISOString();

      const res = await apiFetch('/api/v1/reminders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || '',
          due_date: formattedDate,
          priority,
          is_recurring: isRecurring
        }),
      });

      if (res.ok) {
        triggerNotification('Reminder set successfully.');
        setTitle('');
        setDescription('');
        setDueDate('');
        setPriority('Medium');
        setIsRecurring(false);
        setShowAddForm(false);
        fetchReminders();
        onActionExecuted();
      } else {
        triggerNotification('Failed to set reminder.');
      }
    } catch (err) {
      triggerNotification('Connection error: Failed to schedule reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      const res = await apiFetch(`/api/v1/reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        triggerNotification('Reminder cleared.');
        fetchReminders();
        onActionExecuted();
      } else {
        triggerNotification('Failed to clear reminder.');
      }
    } catch (err) {
      triggerNotification('Connection error: Failed to delete reminder.');
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 select-none">
        <Loader2 className="animate-spin text-white" size={32} />
        <span className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">Synchronizing alerts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-red-500 font-mono text-sm uppercase">⚠️ {error}</div>
        <button onClick={fetchReminders} className="mono-btn-secondary text-xs uppercase font-mono mt-2">
          Retry Handshake
        </button>
      </div>
    );
  }

  const getPriorityColor = (p: string) => {
    switch (p.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-950/20 border-red-900/40';
      case 'low': return 'text-zinc-500 bg-zinc-900/30 border-zinc-800/40';
      default: return 'text-zinc-300 bg-zinc-900/60 border-zinc-800/80';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 select-none">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">Reminder System</h2>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">CHRONOLOGICAL ALERTS & WORK NOTIFICATIONS</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mono-btn text-xs font-mono uppercase"
        >
          <Plus size={14} />
          <span>New Alert</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Summary & Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active summary */}
          <div className="mono-panel p-6 bg-[#111113] flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">ACTIVE ALERTS</span>
              <Bell size={16} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mb-0.5">
                {reminders.length} Scheduled
              </p>
              <p className="text-[9px] text-zinc-500 font-mono uppercase">Pending time-critical nodes</p>
            </div>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="mono-panel p-6 bg-[#0c0c0e] border-[#33333a] animate-in slide-in-from-top-2 duration-300">
              <h3 className="font-heading text-sm font-semibold tracking-wider text-white uppercase mb-4">schedule alert</h3>
              <form onSubmit={handleAddReminder} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Alert Title</label>
                  <input
                    type="text"
                    required
                    className="mono-input w-full text-xs font-mono"
                    placeholder="e.g. Turn in weekly report"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Description (optional)</label>
                  <input
                    type="text"
                    className="mono-input w-full text-xs font-mono"
                    placeholder="e.g. Email it to supervisor"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Alert Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="mono-input w-full text-xs font-mono text-zinc-400"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Priority</label>
                    <select
                      className="mono-input w-full text-xs font-mono bg-[#0c0c0e]"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    className="w-3.5 h-3.5 rounded bg-black border border-[#1e1e22] accent-white"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                  <label htmlFor="isRecurring" className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 cursor-pointer uppercase select-none">
                    Recurring Weekly Alert
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="mono-btn-secondary text-[10px] font-mono uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mono-btn text-[10px] font-mono uppercase"
                  >
                    {submitting ? 'Scheduling...' : 'Set Alert'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Alerts list */}
        <div className="lg:col-span-2 mono-panel p-6 bg-[#0c0c0e] flex flex-col h-[65vh]">
          <div className="pb-3 border-b border-[#1e1e22] mb-4">
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">ALERTS TIMELINE</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            {reminders.length > 0 ? (
              reminders.map((rem) => {
                const isOverdue = new Date(rem.due_date) < new Date();
                return (
                  <div 
                    key={rem.id}
                    className={`p-4 bg-[#111113] border rounded flex justify-between items-center hover:border-zinc-400 transition-all group ${
                      isOverdue ? 'border-red-950/40' : 'border-[#1e1e22]'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`p-2 rounded border mt-0.5 ${
                        isOverdue 
                          ? 'bg-red-950/20 text-red-500 border-red-900/30' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-white transition-colors'
                      }`}>
                        <Bell size={14} className={isOverdue ? 'animate-bounce' : ''} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <p className="text-xs font-mono font-bold text-white truncate">{rem.title}</p>
                          <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${getPriorityColor(rem.priority)}`}>
                            {rem.priority}
                          </span>
                          {rem.is_recurring && (
                            <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                              Recurring
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono mt-1 leading-normal truncate">{rem.description || 'No description'}</p>
                        <div className="flex items-center gap-3.5 mt-2.5 text-[9px] font-mono text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            <span>{new Date(rem.due_date).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            <span>{new Date(rem.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                          {isOverdue && (
                            <span className="flex items-center gap-1 text-red-400 font-bold uppercase">
                              <AlertTriangle size={10} />
                              <span>Overdue</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-950/20 rounded border border-transparent hover:border-red-900/30 transition-all flex-shrink-0"
                      title="Clear Alert"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Bell size={24} className="opacity-40 text-zinc-600 mb-2" />
                <p className="text-xs italic text-zinc-500">No scheduled alerts.</p>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">Timeline fully synchronized.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
