import React, { useState, useRef } from 'react';
import { ChevronLeft, Calendar, Tag, Edit3, Save, X } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAppContext } from '../AppContext';
import '../styles/NoteReader.css';

const NoteReader = ({ note, onBack, onNoteUpdate }) => {
  const { config, setNotes } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const contentRef = useRef(null);

  if (!note) return null;

  const defaultTitle = note.isQuickNote ? 'Notas Rápidas' : 'Sem título';
  const title = note.text 
    ? note.text.split(/<br>|<\/div>|<div>/)[0].replace(/<[^>]*>/g, '') || defaultTitle 
    : defaultTitle;

  const handleSave = async () => {
    if (!contentRef.current) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const updatedText = contentRef.current.innerHTML;
      const updatedNote = {
        ...note,
        text: updatedText,
        updatedAt: Date.now(),
        isQuickNote: note.isQuickNote // Explicitly preserve this
      };


      // Remove internal helper fields before saving to GitHub
      const { id, sha, name, ...githubNote } = updatedNote;

      const response = await githubService.updateFile(
        config.owner, 
        config.repo, 
        config.path + '/' + note.name, 
        githubNote, 
        note.sha, 
        config.token
      );

      // Update local state
      const updatedNoteWithSha = { ...updatedNote, sha: response.content.sha };
      setNotes(prev => prev.map(n => n.name === note.name ? updatedNoteWithSha : n));
      
      if (onNoteUpdate) {
        onNoteUpdate(updatedNoteWithSha);
      }

      setIsEditing(false);
    } catch (err) {
      setSaveError('Erro ao salvar no GitHub: ' + err.message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="note-reader animate-fade-in">
      <div className="nav-header">
        <button className="back-btn" onClick={onBack} disabled={isSaving}>
          <ChevronLeft size={24} />
        </button>
        
        <div className="note-actions">
          {isEditing ? (
            <>
              <button className="icon-btn cancel" onClick={() => setIsEditing(false)} disabled={isSaving}>
                <X size={20} />
              </button>
              <button className="save-action-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Salvando...' : <><Save size={18} /> Salvar</>}
              </button>
            </>
          ) : (
            <>
              {note.isQuickNote && (
                <button className="icon-btn edit" onClick={() => setIsEditing(true)}>
                  <Edit3 size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="reader-content">
        {saveError && <div className="save-error">{saveError}</div>}
        
        <h1 className="title">{title}</h1>
        
        <div className="note-meta-details">
          <div className="meta-item">
            <Calendar size={14} />
            <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
          </div>
          {note.tags && note.tags.length > 0 && (
            <div className="meta-item">
              <Tag size={14} />
              <div className="tags-list">
                {note.tags.map(tag => <span key={tag} className="tag-item">#{tag}</span>)}
              </div>
            </div>
          )}
        </div>

        <div 
          ref={contentRef}
          className={`html-content ${isEditing && note.isQuickNote ? 'editing-mode' : ''}`}
          contentEditable={isEditing && note.isQuickNote}
          dangerouslySetInnerHTML={{ __html: note.text }} 
          onInput={(e) => {
            // Optional: Handle input changes if needed
          }}
        />
      </div>
    </div>
  );
};

export default NoteReader;
