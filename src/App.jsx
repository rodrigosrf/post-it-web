import React, { useState } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import NoteReader from './components/NoteReader';

import { AnimatePresence, motion } from 'framer-motion';

const AppContent = () => {
  const { config } = useAppContext();
  const [view, setView] = useState(config.token ? 'dashboard' : 'settings');
  const [selectedNote, setSelectedNote] = useState(null);

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setView('reader');
  };

  const handleBack = () => {
    setSelectedNote(null);
    setView('dashboard');
  };

  const handleOpenSettings = () => {
    setView('settings');
  };

  return (
    <main>
      <AnimatePresence mode="wait">
        {view === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Settings onComplete={() => setView('dashboard')} />
          </motion.div>
        )}
        
        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Dashboard 
              onSelectNote={handleSelectNote} 
              onOpenSettings={handleOpenSettings}
            />
          </motion.div>
        )}

        {view === 'reader' && (
          <motion.div
            key="reader"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <NoteReader 
              note={selectedNote} 
              onBack={handleBack} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};


function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
