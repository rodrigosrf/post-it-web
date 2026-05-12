import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { githubService } from '../services/githubService';
import { Search, RefreshCw, FileText, ChevronRight, Settings as SettingsIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import '../styles/Dashboard.css';

const Dashboard = ({ onSelectNote, onOpenSettings }) => {
  const { config, notes, setNotes, loading, setLoading, error, setError } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);

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


      const sortedData = notesData
        .filter(n => n !== null)
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || a.date || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || b.date || 0);
          return dateB - dateA;
        });
      setNotes(sortedData);
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

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || a.date || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || b.date || 0);
      return dateB - dateA;
    });
  }, [notes]);

  const filteredNotes = searchQuery 
    ? fuse.search(searchQuery).map(result => result.item)
    : sortedNotes;

  const quickNotes = filteredNotes.filter(n => !!n.isQuickNote);
  const regularNotes = filteredNotes.filter(n => !n.isQuickNote);

  const handleQuickAdd = async () => {
    if (!quickAddText.trim() || quickNotes.length === 0) return;
    
    setIsSubmittingQuickAdd(true);
    const targetNote = quickNotes[0];
    
    try {
      // Prepare new content: new text + separator + old text
      const newContent = `${quickAddText.trim()}<br><hr><br>${targetNote.text || ''}`;
      
      const updatedNote = {
        ...targetNote,
        text: newContent,
        updatedAt: Date.now()
      };

      // Remove internal helper fields before saving to GitHub
      const { id, sha, name, ...githubNote } = updatedNote;

      const response = await githubService.updateFile(
        config.owner, 
        config.repo, 
        config.path + '/' + targetNote.name, 
        githubNote, 
        targetNote.sha, 
        config.token
      );

      // Update local state
      const updatedNoteWithSha = { ...updatedNote, sha: response.content.sha };
      setNotes(prev => prev.map(n => n.name === targetNote.name ? updatedNoteWithSha : n));
      
      // Reset state and close modal
      setQuickAddText('');
      setShowQuickAdd(false);
    } catch (err) {
      console.error('Error in quick add:', err);
      
      // Handle SHA mismatch (conflict)
      if (err.message.includes('does not match') || err.message.includes('409') || err.message.includes('conflict')) {
        setError('Conflito de versão detectado. Atualizando notas automaticamente...');
        await fetchNotes();
        setError('Notas atualizadas. Por favor, tente adicionar novamente.');
      } else {
        setError('Erro ao adicionar texto rápido: ' + err.message);
      }
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };



  return (
    <div className="dashboard animate-fade-in">
      <motion.div 
        className="top-bar glass-panel"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
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
      </motion.div>

      <div className="dashboard-content">
        {error && <div className="error-msg">{error}</div>}

        {loading && notes.length === 0 ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spinning" style={{ marginBottom: 16 }} />
            <p>Carregando suas notas...</p>
          </div>
        ) : (
          <>
            {quickNotes.length > 0 && (
              <motion.section 
                className="notes-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="list-header">
                  <h2>Notas Rápidas</h2>
                  <div className="header-actions">
                    <button 
                      className="quick-add-btn" 
                      onClick={() => setShowQuickAdd(true)}
                      title="Adicionar rapidamente"
                    >
                      <Plus size={18} />
                    </button>
                    <button className="refresh-btn" onClick={fetchNotes} disabled={loading}>
                      <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                    </button>
                  </div>
                </div>
                <div className="notes-list quick-notes">
                  {quickNotes.map((note, index) => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onClick={() => onSelectNote(note)} 
                      isQuick 
                      index={index}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            <motion.section 
              className="notes-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
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
                  regularNotes.map((note, index) => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onClick={() => onSelectNote(note)} 
                      index={index}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <FileText size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
                    <p>{searchQuery ? 'Nenhuma nota encontrada.' : 'Sua lista de notas está vazia.'}</p>
                  </div>
                )}
              </div>
            </motion.section>
          </>
        )}
      </div>
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-container glass-panel"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <h3>Adicionar à Nota Rápida</h3>
              <textarea 
                placeholder="O que você quer anotar?"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                autoFocus
                disabled={isSubmittingQuickAdd}
              />
              <div className="modal-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowQuickAdd(false)}
                  disabled={isSubmittingQuickAdd}
                >
                  Cancelar
                </button>
                <button 
                  className="confirm-btn" 
                  onClick={handleQuickAdd}
                  disabled={isSubmittingQuickAdd || !quickAddText.trim()}
                >
                  {isSubmittingQuickAdd ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NoteCard = ({ note, onClick, isQuick, index }) => (
  <motion.div 
    className={`note-card glass-panel ${isQuick ? 'quick-note-card' : ''}`}
    onClick={onClick}
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
  >
    <div className="note-info">
      <div className="note-title-row">
        <FileText size={16} className="note-icon" />
        <h3>{isQuick ? 'Notas Rápidas' : (note.text ? note.text.split(/<br>|<\/div>|<div>/)[0].replace(/<[^>]*>/g, '') || 'Sem título' : 'Sem título')}</h3>
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
  </motion.div>
);


export default Dashboard;
