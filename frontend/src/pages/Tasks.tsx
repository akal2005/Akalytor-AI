import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowRight,
  CheckCircle,
  FolderOpen,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Task {
  id: string;
  project_name: string;
  task_name: string;
  deadline: string;
  status: string;
}

interface TasksProps {
  triggerNotification: (msg: string) => void;
  onActionExecuted: () => void;
}

export const Tasks: React.FC<TasksProps> = ({ triggerNotification, onActionExecuted }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New task form state
  const [taskName, setTaskName] = useState('');
  const [projectName, setProjectName] = useState('General');
  const [deadline, setDeadline] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await apiFetch('/api/v1/work/');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        setError('Error synchronizing tasks database.');
      }
    } catch (err) {
      setError('Connection failure: Unable to communicate with task terminal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    setSubmitting(true);

    try {
      // Reformat deadline to ISO or date string expected by backend
      const deadlineDate = deadline ? new Date(deadline).toISOString() : new Date().toISOString();

      const res = await apiFetch('/api/v1/work/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_name: taskName,
          project_name: projectName || 'General',
          deadline: deadlineDate,
          status: 'To Do',
        }),
      });

      if (res.ok) {
        triggerNotification('Task successfully injected into database.');
        setTaskName('');
        setProjectName('General');
        setDeadline('');
        setShowAddForm(false);
        fetchTasks();
        onActionExecuted();
      } else {
        triggerNotification('Failed to inject task.');
      }
    } catch (err) {
      triggerNotification('Connection error: Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await apiFetch(`/api/v1/work/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const result = await res.json();
        
        let alertMsg = `Task updated to ${newStatus}.`;
        if (newStatus === 'Completed' && result.xp_gained) {
          alertMsg = `Task Completed! +50 XP Gained.`;
          if (result.level_up) {
            alertMsg = `🎉 LEVEL UP! You reached LEVEL ${result.current_level}!`;
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
        }
        triggerNotification(alertMsg);
        fetchTasks();
        onActionExecuted();
      }
    } catch (err) {
      triggerNotification('Failed to update task status.');
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 select-none">
        <Loader2 className="animate-spin text-white" size={32} />
        <span className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">Synchronizing task grid...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-red-500 font-mono text-sm uppercase">⚠️ {error}</div>
        <button onClick={fetchTasks} className="mono-btn-secondary text-xs uppercase font-mono mt-2">
          Retry Handshake
        </button>
      </div>
    );
  }

  const columns = [
    { title: 'To Do', status: 'To Do' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Completed', status: 'Completed' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 select-none">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">Task Matrix</h2>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">KANBAN METHODOLOGY TASK ROUTING</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mono-btn text-xs font-mono uppercase"
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>
      </div>

      {/* Add Task Form Modal */}
      {showAddForm && (
        <div className="mono-panel p-6 max-w-lg mx-auto bg-[#111113] border-[#33333a] relative animate-in slide-in-from-top-4 duration-300">
          <h3 className="font-heading text-sm font-semibold tracking-wider text-white uppercase mb-4">INJECT NEW TASK</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Task Name</label>
              <input
                type="text"
                required
                className="mono-input w-full text-xs font-mono"
                placeholder="e.g. Implement WebSocket routing module"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Project Category</label>
                <input
                  type="text"
                  className="mono-input w-full text-xs font-mono"
                  placeholder="e.g. Core System"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Deadline</label>
                <input
                  type="datetime-local"
                  className="mono-input w-full text-xs font-mono text-zinc-400"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
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
                {submitting ? 'Injecting...' : 'Inject Stack'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[65vh]">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.status);
          return (
            <div key={col.title} className="mono-panel p-4 flex flex-col h-full bg-[#0c0c0e]">
              {/* Column Title */}
              <div className="flex justify-between items-center pb-3 border-b border-[#1e1e22] mb-4">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">{col.title}</span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {colTasks.length > 0 ? (
                  colTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="p-3.5 bg-[#111113] border border-[#1e1e22] rounded flex flex-col justify-between gap-3 hover:border-zinc-500 transition-all group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                            <FolderOpen size={10} />
                            <span>{task.project_name}</span>
                          </span>
                          
                          {/* Task Action Arrows */}
                          <div className="flex items-center gap-1.5">
                            {col.status === 'To Do' && (
                              <button
                                onClick={() => handleUpdateStatus(task.id, 'In Progress')}
                                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                                title="Move to In Progress"
                              >
                                <ArrowRight size={12} />
                              </button>
                            )}
                            {col.status === 'In Progress' && (
                              <button
                                onClick={() => handleUpdateStatus(task.id, 'Completed')}
                                className="p-1 rounded hover:bg-zinc-800 text-white transition-colors"
                                title="Complete Task"
                              >
                                <CheckCircle size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <h4 className="text-xs font-mono text-white font-medium mt-2 leading-relaxed">
                          {task.task_name}
                        </h4>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#1e1e22] text-[9px] font-mono text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={10} />
                          <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date'}</span>
                        </div>
                        {col.status !== 'Completed' && (
                          <span className="text-zinc-600 font-bold group-hover:text-white transition-colors">+50 XP</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-600">
                    <AlertCircle size={18} className="opacity-40" />
                    <span className="text-[10px] font-mono mt-1.5">Empty Queue</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
