// Ocean — App Shell Layout
// Part 2 § 1.1: Main window, NavRail, content routing.
// Part 2 § 3: Responsive breakpoints.

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BarChart2, Tag, Settings, Menu, X, CheckSquare
} from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import { IconButton } from '../components/Buttons';
import { ToastContainer } from '../components/Primitives';


const NAV_ITEMS = [
  { path: '/',          label: 'Home',      icon: Home        },
  { path: '/tasks',     label: 'Tasks',     icon: CheckSquare },
  { path: '/analytics', label: 'Analytics', icon: BarChart2   },
  { path: '/categories',label: 'Categories',icon: Tag         },
  { path: '/settings',  label: 'Settings',  icon: Settings    },
] as const;

// ── Title bar brand ring icon ──────────────────────────────────────────────
const BrandRing: React.FC<{ progress?: number }> = ({ progress = 0.75 }) => (
  <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx={10} cy={10} r={8} fill="none" stroke="var(--border-subtle)" strokeWidth={2.5} />
    <circle
      cx={10} cy={10} r={8}
      fill="none" stroke="var(--accent-focus)" strokeWidth={2.5}
      strokeDasharray={`${2 * Math.PI * 8 * progress} ${2 * Math.PI * 8}`}
      strokeLinecap="round"
      style={{ transform: 'rotate(-90deg)', transformOrigin: '10px 10px' }}
    />
  </svg>
);

// ── AppShell ───────────────────────────────────────────────────────────────
import { useShallow } from 'zustand/react/shallow';

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { navExpanded, setNavExpanded, toasts, removeToast, phase, remaining, activeSession, settings } = useOceanStore(
    useShallow((s) => ({
      navExpanded: s.navExpanded,
      setNavExpanded: s.setNavExpanded,
      toasts: s.toasts,
      removeToast: s.removeToast,
      phase: s.phase,
      remaining: s.remaining,
      activeSession: s.activeSession,
      settings: s.settings,
    }))
  );
  const location = useLocation();

  // Hide nav rail during immersive screens
  const immersive = ['breathing', 'focusing', 'paused', 'onBreak', 'longBreak', 'reflecting'].includes(phase);

  const totalSec = (activeSession?.durationMin ?? 25) * 60;
  const ringProgress = totalSec > 0 ? remaining / totalSec : 0;

  // Apply theme on mount
  React.useEffect(() => {
    const { theme } = settings;
    const root = document.documentElement;
    if (theme === 'dark')  root.setAttribute('data-theme', 'dark');
    else if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
  }, [settings.theme]);

  return (
    <div className="app-shell">
      {/* ── Title bar ─────────────────────────────────────────────────── */}
      <div className="titlebar" data-tauri-drag-region>
        <div className="titlebar__brand">
          <BrandRing progress={phase === 'focusing' ? ringProgress : 0.75} />
          <span className="titlebar__wordmark">ocean</span>
          {phase === 'focusing' && activeSession && (
            <span style={{
              fontSize: 'var(--fs-micro)', background: 'var(--accent-focus-subtle)',
              color: 'var(--accent-focus)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
              fontWeight: 600
            }}>
              {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
            </span>
          )}
          {phase === 'onBreak' && (
            <span style={{
              fontSize: 'var(--fs-micro)', background: 'var(--accent-break-subtle)',
              color: 'var(--accent-break)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
              fontWeight: 600
            }}>
              on break
            </span>
          )}
        </div>

        <div className="titlebar__actions">
          {!immersive && (
            <IconButton
              label={navExpanded ? 'Collapse navigation' : 'Expand navigation'}
              onClick={() => setNavExpanded(!navExpanded)}
              style={{ width: 32, height: 32, background: 'transparent', border: 'none', boxShadow: 'none' }}
            >
              {navExpanded ? <X size={15} /> : <Menu size={15} />}
            </IconButton>
          )}
        </div>
      </div>

      {/* ── Nav Rail ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!immersive && (
          <motion.nav
            initial={false}
            animate={{ width: navExpanded ? 220 : 72 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`nav-rail ${navExpanded ? 'nav-rail--expanded' : 'nav-rail--collapsed'}`}
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
              return (
                <NavLink
                  key={path}
                  to={path}
                  className={`nav-rail__item${isActive ? ' nav-rail__item--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  title={!navExpanded ? label : undefined}
                >
                  <span className="nav-rail__item-icon">
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
                  </span>
                  <motion.span
                    className="nav-rail__item-label"
                    animate={{ opacity: navExpanded ? 1 : 0, width: navExpanded ? 'auto' : 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {label}
                  </motion.span>
                </NavLink>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main
        className={`main-content ${!immersive ? (navExpanded ? 'main-content--expanded' : 'main-content--collapsed') : ''}`}
        style={immersive ? { marginLeft: 0 } : undefined}
      >
        {children}
      </main>

      {/* ── Toast container ───────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default AppShell;
