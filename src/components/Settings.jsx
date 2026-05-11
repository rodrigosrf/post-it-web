import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Settings as SettingsIcon, Save, Key, User, Folder, Database } from 'lucide-react';
import '../styles/Settings.css';

const Settings = ({ onComplete }) => {
  const { config, updateConfig } = useAppContext();
  const [localConfig, setLocalConfig] = useState(config);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateConfig(localConfig);
    if (onComplete) onComplete();
  };

  return (
    <div className="settings-container animate-fade-in">
      <div className="header">
        <SettingsIcon size={24} />
        <h1>Configuração</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="glass-panel settings-form">
        <div className="input-group">
          <label><Key size={16} /> GitHub Token</label>
          <input 
            type="password" 
            value={localConfig.token}
            onChange={(e) => setLocalConfig({...localConfig, token: e.target.value})}
            placeholder="ghp_..."
            required
          />
        </div>

        <div className="input-group">
          <label><User size={16} /> Usuário/Dono</label>
          <input 
            type="text" 
            value={localConfig.owner}
            onChange={(e) => setLocalConfig({...localConfig, owner: e.target.value})}
            placeholder="ex: rodri"
            required
          />
        </div>

        <div className="input-group">
          <label><Folder size={16} /> Repositório</label>
          <input 
            type="text" 
            value={localConfig.repo}
            onChange={(e) => setLocalConfig({...localConfig, repo: e.target.value})}
            placeholder="ex: post-it-notes"
            required
          />
        </div>

        <div className="input-group">
          <label><Database size={16} /> Pasta de Notas</label>
          <input 
            type="text" 
            value={localConfig.path}
            onChange={(e) => setLocalConfig({...localConfig, path: e.target.value})}
            placeholder="padrão: notes_db"
          />
        </div>

        <button type="submit" className="save-btn">
          <Save size={18} />
          Salvar e Continuar
        </button>
      </form>
    </div>
  );
};

export default Settings;
