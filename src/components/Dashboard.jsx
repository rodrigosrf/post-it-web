import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { githubService } from '../services/githubService';
import { Search, RefreshCw, FileText, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import Fuse from 'fuse.js';
import '../styles/Dashboard.css';

const Dashboard = ({ onSelectNote, onOpenSettings }) => {
  const { config, notes, setNotes, loading, setLoading, error, setError } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotes = async () => {
    if (!config.token || !config.owner || !config.repo) return;
    
    setLoading(true);
    setError(null);
    try {
      const files = await githubService.fetchFiles(config.owner, config.repo, config.path, config.token);
      const jsonFiles = files.filter(f => f.name.endsWith('.json'));
      
      const notesData = await Promise.all(jsonFiles.map(async (file) => {
        try {
          console.log(`Fetching content for: ${file.name}`);
          const content = await githubService.fetchFileContent(file.url, config.token);
          return {
            id: content.id || file.sha,
            sha: file.sha,
            name: file.name,
            ...content
          };

        } catch (e) {
          console.error(`Error loading note ${file.name}:`, e);
          return null;
        }
      }));


      setNotes(notesData.filter(n => n !== null).sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date)));
    } catch (err) {
      setError('Erro ao carregar notas. Verifique suas configurações e conexão.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notes.length === 0 && config.token) {
      fetchNotes();
    }
  }, [config.token]);

  const fuse = useMemo(() => new Fuse(notes, {
    keys: ['title', 'content', 'tags'],
    threshold: 0.3
  }), [notes]);

  const filteredNotes = searchQuery 
    ? fuse.search(searchQuery).map(result => result.item)
    : notes;

  const quickNotes = filteredNotes.filter(n => !!n.isQuickNote);
  const regularNotes = filteredNotes.filter(n => !n.isQuickNote);



  return (
    <div className="dashboard animate-fade-in">
      <div className="top-bar glass-panel">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar notas..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="icon-btn" onClick={onOpenSettings}>
          <SettingsIcon size={20} />
        </button>
      </div>

      <div className="dashboard-content">
        {error && <div className="error-msg">{error}</div>}

        {loading && notes.length === 0 ? (
          <div className="loading-state">Carregando notas...</div>
        ) : (
          <>
            {quickNotes.length > 0 && (
              <section className="notes-section">
                <div className="list-header">
                  <h2>Notas Rápidas</h2>
                  <button className="refresh-btn" onClick={fetchNotes} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                  </button>
                </div>
                <div className="notes-list quick-notes">
                  {quickNotes.map(note => (
                    <NoteCard key={note.id} note={note} onClick={() => onSelectNote(note)} isQuick />
                  ))}
                </div>
              </section>
            )}

            <section className="notes-section">
              <div className="list-header">
                <h2>Suas Notas</h2>
                {quickNotes.length === 0 && (
                  <button className="refresh-btn" onClick={fetchNotes} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                  </button>
                )}
              </div>
              <div className="notes-list">
                {regularNotes.length > 0 ? (
                  regularNotes.map(note => (
                    <NoteCard key={note.id} note={note} onClick={() => onSelectNote(note)} />
                  ))
                ) : (
                  <div className="empty-state">
                    {searchQuery ? 'Nenhuma nota encontrada.' : 'Nenhuma nota disponível.'}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const NoteCard = ({ note, onClick, isQuick }) => (
  <div 
    className={`note-card glass-panel ${isQuick ? 'quick-note-card' : ''}`}
    onClick={onClick}
  >
    <div className="note-info">
      <div className="note-title-row">
        <FileText size={16} className="note-icon" />
        <h3>{note.text ? note.text.split(/<br>|<\/div>|<div>/)[0].replace(/<[^>]*>/g, '') || 'Sem título' : 'Sem título'}</h3>
      </div>
      <p className="note-preview">
        {note.text ? note.text.replace(/<[^>]*>/g, ' ').substring(0, 100) : '...'}...
      </p>
      <div className="note-meta">
        {note.tags?.slice(0, 3).map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
        <span className="date">
          {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
    <ChevronRight size={20} className="arrow-icon" />
  </div>
);


export default Dashboard;
