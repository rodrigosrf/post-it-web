import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('postit_web_config');
    return saved ? JSON.parse(saved) : { token: '', owner: '', repo: '', path: 'notes_db' };
  });

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem('postit_web_config', JSON.stringify(config));
  }, [config]);

  const updateConfig = (newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <AppContext.Provider value={{ 
      config, 
      updateConfig, 
      notes, 
      setNotes, 
      loading, 
      setLoading, 
      error, 
      setError 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
