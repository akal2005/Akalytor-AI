import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  DollarSign, 
  Tag, 
  Loader2,
  Calendar,
  Wallet
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface ExpensesProps {
  triggerNotification: (msg: string) => void;
  onActionExecuted: () => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ triggerNotification, onActionExecuted }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New expense form
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await apiFetch('/api/v1/expenses/');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      } else {
        setError('Error loading expense data.');
      }
    } catch (err) {
      setError('Connection error: Unable to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/v1/expenses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category: category || 'General',
          description: description,
          date: new Date().toISOString()
        }),
      });

      if (res.ok) {
        triggerNotification('Expense logged successfully.');
        setAmount('');
        setCategory('General');
        setDescription('');
        setShowAddForm(false);
        fetchExpenses();
        onActionExecuted();
      } else {
        triggerNotification('Failed to log expense.');
      }
    } catch (err) {
      triggerNotification('Connection error: Failed to contact ledger.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 select-none">
        <Loader2 className="animate-spin text-white" size={32} />
        <span className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">Synchronizing ledger...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-red-500 font-mono text-sm uppercase">⚠️ {error}</div>
        <button onClick={fetchExpenses} className="mono-btn-secondary text-xs uppercase font-mono mt-2">
          Retry Handshake
        </button>
      </div>
    );
  }

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 select-none">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">Ledger Database</h2>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">FINANCIAL REVENUE & OUTFLOW LOGS</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mono-btn text-xs font-mono uppercase"
        >
          <Plus size={14} />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Stats Summary & Add Expense Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Summary panel */}
          <div className="mono-panel p-6 bg-[#111113] flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">TOTAL tracked spend</span>
              <Wallet size={16} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mb-0.5">
                ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[9px] text-zinc-500 font-mono uppercase">Cumulative outflow database index</p>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mono-panel p-6 bg-[#0c0c0e] border-[#33333a] animate-in slide-in-from-top-2 duration-300">
              <h3 className="font-heading text-sm font-semibold tracking-wider text-white uppercase mb-4">log transaction</h3>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="mono-input w-full text-xs font-mono"
                    placeholder="e.g. 12.50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Category</label>
                  <input
                    type="text"
                    className="mono-input w-full text-xs font-mono"
                    placeholder="e.g. Food, Transportation, Entertainment"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Description</label>
                  <input
                    type="text"
                    className="mono-input w-full text-xs font-mono"
                    placeholder="e.g. Pizza lunch with team"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
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
                    {submitting ? 'Recording...' : 'Commit log'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 mono-panel p-6 bg-[#0c0c0e] flex flex-col h-[65vh]">
          <div className="pb-3 border-b border-[#1e1e22] mb-4">
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">TRANSACTION QUEUE</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
            {expenses.length > 0 ? (
              expenses.map((exp, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-[#111113] border border-[#1e1e22] rounded flex justify-between items-center hover:border-zinc-500 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 group-hover:text-white transition-colors">
                      <DollarSign size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-semibold text-white truncate">{exp.description || 'No description'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Tag size={8} />
                          <span>{exp.category}</span>
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1">
                          <Calendar size={9} />
                          <span>{new Date(exp.date).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-white">-${exp.amount.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs italic text-zinc-500">Transaction ledger is empty.</p>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">No items logged.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
