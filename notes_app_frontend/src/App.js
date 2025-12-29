import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

// Utilities
const STORAGE_KEY = 'notes_app_data_v1';
const THEME_KEY = 'notes_app_theme_v1';

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((n) => ({
      id: n.id || generateId(),
      title: n.title || '',
      body: n.body || '',
      createdAt: n.createdAt || Date.now(),
      updatedAt: n.updatedAt || n.createdAt || Date.now(),
    }));
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // ignore quota errors
  }
}

function formatDate(ts) {
  try {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  } catch {
    return '';
  }
}

/** Determine initial theme based on localStorage or system preference. */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Safely creates highlighted React nodes for all occurrences of query in text.
 * Case-insensitive. Returns the original string when query is falsy.
 */
function highlightMatches(text, query) {
  const safeText = String(text ?? '');
  const q = String(query ?? '').trim();
  if (!q) return [safeText];

  const lower = safeText.toLowerCase();
  const target = q.toLowerCase();

  const parts = [];
  let index = 0;
  let matchIndex = lower.indexOf(target);

  while (matchIndex !== -1) {
    if (matchIndex > index) {
      parts.push(safeText.slice(index, matchIndex));
    }
    const matched = safeText.slice(matchIndex, matchIndex + target.length);
    parts.push(
      <mark key={`${matchIndex}-${matched}`} className="highlight">
        {matched}
      </mark>
    );
    index = matchIndex + target.length;
    matchIndex = lower.indexOf(target, index);
  }
  if (index < safeText.length) {
    parts.push(safeText.slice(index));
  }
  return parts.length ? parts : [safeText];
}

// PUBLIC_INTERFACE
function App() {
  /** The main application rendering the notes UI. */
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [titleError, setTitleError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme());

  // Load from localStorage on mount
  useEffect(() => {
    setNotes(loadNotes());
    setMounted(true);
  }, []);

  // Persist to localStorage whenever notes change
  useEffect(() => {
    if (!mounted) return;
    saveNotes(notes);
  }, [notes, mounted]);

  // Apply theme to document root and persist
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Sync with system preference changes if user hasn't explicitly set (only when no saved key)
  useEffect(() => {
    let media;
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        return; // user choice takes precedence
      }
    } catch {
      // continue to listen
    }
    if (window.matchMedia) {
      media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => setTheme(e.matches ? 'dark' : 'light');
      if (media.addEventListener) {
        media.addEventListener('change', listener);
      } else {
        media.addListener(listener);
      }
      return () => {
        if (media.removeEventListener) {
          media.removeEventListener('change', listener);
        } else {
          media.removeListener(listener);
        }
      };
    }
  }, []);

  // Debounce search input
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200);
    return () => clearTimeout(id);
  }, [query]);

  const openNewEditor = useCallback(() => {
    setCurrentNote({
      id: null,
      title: '',
      body: '',
    });
    setTitleError('');
    setEditorOpen(true);
  }, []);

  const openEditEditor = useCallback((note) => {
    setCurrentNote({ ...note });
    setTitleError('');
    setEditorOpen(true);
  }, []);

  const onCloseEditor = useCallback(() => {
    setEditorOpen(false);
    setCurrentNote(null);
    setTitleError('');
  }, []);

  const upsertNote = useCallback(() => {
    if (!currentNote) return;
    const title = (currentNote.title || '').trim();
    if (!title) {
      setTitleError('Title is required.');
      return;
    }
    const now = Date.now();
    if (currentNote.id) {
      // update
      setNotes((prev) =>
        prev.map((n) =>
          n.id === currentNote.id ? { ...n, title, body: currentNote.body || '', updatedAt: now } : n
        )
      );
    } else {
      // insert
      const newNote = {
        id: generateId(),
        title,
        body: currentNote.body || '',
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
    }
    setEditorOpen(false);
    setCurrentNote(null);
    setTitleError('');
  }, [currentNote]);

  const removeNote = useCallback((id) => {
    const ok = window.confirm('Delete this note? This action cannot be undone.');
    if (!ok) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Filter by title OR body, case-insensitive
  const filteredSortedNotes = useMemo(() => {
    const q = debouncedQuery;
    const items = notes.filter((n) => {
      if (!q) return true;
      const title = (n.title || '').toLowerCase();
      const body = (n.body || '').toLowerCase();
      return title.includes(q) || body.includes(q);
    });
    // Sort by last updated desc
    return items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [notes, debouncedQuery]);

  return (
    <div className="App app-root">
      <Header
        query={query}
        setQuery={setQuery}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />
      <main className="container">
        {filteredSortedNotes.length === 0 ? (
          <EmptyState onCreate={openNewEditor} />
        ) : (
          <NotesList
            notes={filteredSortedNotes}
            query={debouncedQuery}
            onEdit={openEditEditor}
            onDelete={removeNote}
          />
        )}
      </main>

      <FloatingActionButton onClick={openNewEditor} />

      <NoteEditor
        open={editorOpen}
        note={currentNote}
        setNote={setCurrentNote}
        onClose={onCloseEditor}
        onSave={upsertNote}
        titleError={titleError}
      />
    </div>
  );
}

function Header({ query, setQuery, theme, onToggleTheme }) {
  return (
    <header className="header">
      <h1 className="app-title" aria-label="Notes application title">
        Notes
      </h1>
      <div className="search-wrap">
        <label className="sr-only" htmlFor="search-input">Search notes by title or body</label>
        <input
          id="search-input"
          className="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          aria-label="Search notes by title or body"
        />
      </div>
      <button
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        <span className="icon" aria-hidden="true">
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
        <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>
    </header>
  );
}

function NotesList({ notes, query, onEdit, onDelete }) {
  return (
    <section className="notes-list" aria-label="Notes list">
      {notes.map((n) => (
        <NoteCard
          key={n.id}
          note={n}
          query={query}
          onEdit={() => onEdit(n)}
          onDelete={() => onDelete(n.id)}
        />
      ))}
    </section>
  );
}

function NoteCard({ note, query, onEdit, onDelete }) {
  return (
    <article className="note-card" role="article" aria-labelledby={`title-${note.id}`}>
      <div className="note-card-header">
        <h2 id={`title-${note.id}`} className="note-title">
          {highlightMatches(note.title, query)}
        </h2>
        <div className="note-actions">
          <button className="btn-ghost" onClick={onEdit} aria-label={`Edit note ${note.title}`}>
            ✏️ Edit
          </button>
          <button className="btn-danger" onClick={onDelete} aria-label={`Delete note ${note.title}`}>
            🗑️ Delete
          </button>
        </div>
      </div>
      {note.body && <p className="note-body">{highlightMatches(note.body, query)}</p>}
      <div className="note-meta">
        <span className="badge" title={`Created ${formatDate(note.createdAt)}`}>
          Created: {formatDate(note.createdAt)}
        </span>
        <span className="badge" title={`Updated ${formatDate(note.updatedAt)}`}>
          Updated: {formatDate(note.updatedAt)}
        </span>
      </div>
    </article>
  );
}

function EmptyState({ onCreate }) {
  return (
    <section className="empty-state" aria-label="No notes state">
      <div className="empty-card">
        <h2 className="empty-title">No notes yet</h2>
        <p className="empty-text">Create your first note to get started.</p>
        <button className="btn-primary" onClick={onCreate}>
          + New Note
        </button>
      </div>
    </section>
  );
}

function FloatingActionButton({ onClick }) {
  return (
    <button
      className="fab"
      onClick={onClick}
      aria-label="Create note"
      title="Create note (N)"
      onKeyDown={(e) => {
        if (e.key.toLowerCase() === 'enter' || e.key.toLowerCase() === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      +
    </button>
  );
}

function NoteEditor({ open, note, setNote, onClose, onSave, titleError }) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const lastFocused = useRef(null);

  // focus management for accessibility
  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement;
      setTimeout(() => titleRef.current && titleRef.current.focus(), 0);
      const onKey = (e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    } else if (lastFocused.current) {
      lastFocused.current.focus();
    }
  }, [open, onClose]);

  if (!open || !note) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="editor-title" ref={dialogRef}>
      <div className="modal">
        <div className="modal-header">
          <h2 id="editor-title">{note.id ? 'Edit note' : 'New note'}</h2>
        </div>

        <div className="modal-body">
          <div className="form-field">
            <label htmlFor="note-title">Title<span className="req">*</span></label>
            <input
              id="note-title"
              ref={titleRef}
              type="text"
              value={note.title}
              onChange={(e) => setNote((prev) => ({ ...prev, title: e.target.value }))}
              aria-invalid={!!titleError}
              aria-describedby={titleError ? 'title-error' : undefined}
              placeholder="Enter note title"
            />
            {titleError && (
              <div id="title-error" className="error-text" role="alert">
                {titleError}
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="note-body">Body</label>
            <textarea
              id="note-body"
              rows="6"
              value={note.body}
              onChange={(e) => setNote((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="Write your note..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose} aria-label="Cancel editing note">
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} aria-label="Save note">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
