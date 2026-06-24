import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Tag, 
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
}

interface NotesProps {
  triggerNotification: (msg: string) => void;
  onActionExecuted: () => void;
}

export const Notes: React.FC<NotesProps> = ({ triggerNotification, onActionExecuted }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New note form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await apiFetch('/api/v1/notes/');
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      } else {
        setError('Error loading knowledge base notes.');
      }
    } catch (err) {
      setError('Connection error: Unable to communicate with note index.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/v1/notes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          tags: tags || 'General'
        }),
      });

      if (res.ok) {
        triggerNotification('Note stored in knowledge base.');
        setTitle('');
        setContent('');
        setTags('');
        setShowAddForm(false);
        fetchNotes();
        onActionExecuted();
      } else {
        triggerNotification('Failed to save note.');
      }
    } catch (err) {
      triggerNotification('Connection error: Failed to contact index server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 select-none">
        <Loader2 className="animate-spin text-white" size={32} />
        <span className="font-mono text-xs tracking-[0.2em] text-zinc-500 uppercase">Synchronizing knowledge base...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-red-500 font-mono text-sm uppercase">⚠️ {error}</div>
        <button onClick={fetchNotes} className="mono-btn-secondary text-xs uppercase font-mono mt-2">
          Retry Handshake
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 select-none">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">Knowledge Index</h2>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">SEMANTIC KNOWLEDGE BASE & PERSONAL NOTES</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mono-btn text-xs font-mono uppercase"
        >
          <Plus size={14} />
          <span>New Note</span>
        </button>
      </div>

      {/* Add Form / Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Index summary panel */}
          <div className="mono-panel p-6 bg-[#111113] flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">TOTAL LOGGED NOTES</span>
              <Layers size={16} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mb-0.5">
                {notes.length} Node{notes.length !== 1 ? 's' : ''}
              </p>
              <p className="text-[9px] text-zinc-500 font-mono uppercase">Indexed knowledge partitions</p>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mono-panel p-6 bg-[#0c0c0e] border-[#33333a] animate-in slide-in-from-top-2 duration-300">
              <h3 className="font-heading text-sm font-semibold tracking-wider text-white uppercase mb-4">create node</h3>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Title</label>
                  <input
                    type="text"
                    required
                    className="mono-input w-full text-xs font-mono"
                    placeholder="e.g. Ideas on microservice patterns"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Tags</label>
                  <input
                    type="text"
                    className="mono-input w-full text-xs font-mono"
                    placeholder="e.g. Architecture, Tech, Ideas"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Content</label>
                  <textarea
                    required
                    rows={4}
                    className="mono-input w-full text-xs font-mono resize-none"
                    placeholder="Write note contents here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
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
                    {submitting ? 'Indexing...' : 'Index Note'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Notes Grid Display */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
          {notes.length > 0 ? (
            notes.map((note, idx) => (
              <div 
                key={idx}
                className="mono-panel p-5 bg-[#0c0c0e] flex flex-col justify-between h-[210px] hover:border-zinc-500 transition-all group"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Tag size={8} />
                      <span>{note.tags || 'General'}</span>
                    </span>
                    <FileText size={14} className="text-zinc-500" />
                  </div>
                  <h4 className="text-xs font-mono font-bold text-white mt-3 truncate group-hover:text-white transition-colors">
                    {note.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono mt-2 line-clamp-3 leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1e1e22] text-[9px] font-mono text-zinc-500 flex items-center gap-1.5">
                  <Calendar size={10} />
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 mono-panel p-6 bg-[#0c0c0e] h-full flex flex-col items-center justify-center text-center text-zinc-500">
              <FileText size={24} className="opacity-40 mb-2" />
              <p className="text-xs italic">Knowledge index is empty.</p>
              <p className="text-[10px] text-zinc-600 font-mono mt-1">No nodes cataloged.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
