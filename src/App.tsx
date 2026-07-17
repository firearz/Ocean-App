// Ocean — Main App Router
// Part 2: State-based routing, AppShell, and immersive screens.

import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Shell & Layouts
import AppShell from './layouts/AppShell';

// Views
import Onboarding from './views/Onboarding';
import HomeScreen from './views/HomeScreen';
import AnalyticsScreen from './views/AnalyticsScreen';
import CategoriesScreen from './views/CategoriesScreen';
import SettingsScreen from './views/SettingsScreen';
import TasksScreen from './views/TasksScreen';
import BreatheScreen from './views/BreatheScreen';
import ActiveSessionScreen from './views/ActiveSessionScreen';
import BreakScreen from './views/BreakScreen';
import ReflectionSheet from './views/ReflectionSheet';
import MiniPlayerScreen from './views/MiniPlayerScreen';
import EndedEarlyScreen from './views/EndedEarlyScreen';
import ContextMenu from './components/ContextMenu';

// Store
import { useOceanStore } from './store/useOceanStore';
import { useShallow } from 'zustand/react/shallow';
import { useAmbientAudio } from './hooks/useAmbientAudio';

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
};

const AppContent: React.FC = () => {
  const { settings, phase, updateSettings } = useOceanStore(
    useShallow((s) => ({
      settings: s.settings,
      phase: s.phase,
      updateSettings: s.updateSettings,
    }))
  );
  const location = useLocation();

  // Keep ambient audio engine in sync with settings
  useAmbientAudio();

  // Make body transparent for mini player so it looks like a pill
  useEffect(() => {
    if (location.pathname === '/mini') {
      document.body.style.background = 'transparent';
      document.documentElement.style.background = 'transparent';
    } else {
      document.body.style.background = '';
      document.documentElement.style.background = '';
    }
  }, [location.pathname]);

  // 1. Onboarding
  if (!settings.hasCompletedOnboarding && location.pathname !== '/mini') {
    return (
      <Onboarding
        onComplete={() => updateSettings({ hasCompletedOnboarding: true })}
      />
    );
  }

  // 1.5 Mini Player mode
  if (location.pathname === '/mini') {
    return <MiniPlayerScreen />;
  }

  // 2. Immersive Screens (take over the entire UI, bypassing router)

  return (
    <>
      <AppShell>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><HomeScreen /></PageWrapper>} />
            <Route path="/tasks" element={<PageWrapper><TasksScreen /></PageWrapper>} />
            <Route path="/analytics" element={<PageWrapper><AnalyticsScreen /></PageWrapper>} />
            <Route path="/categories" element={<PageWrapper><CategoriesScreen /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsScreen /></PageWrapper>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </AppShell>

      {/* Immersive overlays */}
      <AnimatePresence mode="wait">
        {phase === 'breathing' && (
          <motion.div key="breathe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
            <BreatheScreen />
          </motion.div>
        )}
        {(phase === 'focusing' || phase === 'paused') && (
          <motion.div key="focus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
            <ActiveSessionScreen />
          </motion.div>
        )}
        {phase === 'onBreak' && (
          <motion.div key="break" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
            <BreakScreen />
          </motion.div>
        )}
        {phase === 'endedEarly' && (
          <EndedEarlyScreen key="endedEarly" />
        )}
        {phase === 'reflecting' && (
          <ReflectionSheet key="reflecting" />
        )}
      </AnimatePresence>
      <ContextMenu />
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
