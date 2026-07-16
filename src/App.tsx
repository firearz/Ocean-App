// Ocean — Main App Router
// Part 2: State-based routing, AppShell, and immersive screens.

import React from 'react';
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
import BreatheScreen from './views/BreatheScreen';
import ActiveSessionScreen from './views/ActiveSessionScreen';
import BreakScreen from './views/BreakScreen';
import ReflectionSheet from './views/ReflectionSheet';
import MiniPlayerScreen from './views/MiniPlayerScreen';

// Store
import { useOceanStore } from './store/useOceanStore';

const AppContent: React.FC = () => {
  const { settings, phase, updateSettings } = useOceanStore();
  const location = useLocation();

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
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/analytics" element={<AnalyticsScreen />} />
          <Route path="/categories" element={<CategoriesScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>

      {/* Immersive overlays */}
      <AnimatePresence>
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
        {(phase === 'onBreak' || phase === 'longBreak') && (
          <motion.div key="break" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
            <BreakScreen />
          </motion.div>
        )}
        {phase === 'reflecting' && (
          <ReflectionSheet key="reflecting" />
        )}
      </AnimatePresence>
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
