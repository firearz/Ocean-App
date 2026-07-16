import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { useOceanStore } from '../store/useOceanStore';
import { PrimaryButton } from '../components/Buttons';
import { useShallow } from 'zustand/react/shallow';

const INCONSISTENT_MESSAGES = [
  "You need to be more consistent. Let's try again.",
  "Focus is a muscle. Keep training it.",
  "Distractions happen. Don't let them win next time.",
  "Every minute counts. Try to stick it out.",
  "It's okay to struggle, just don't give up."
];

const APPRECIATIVE_MESSAGES = [
  "I think that's all for today. Hmm, good efforts huh!",
  "You've already done great work today. Rest up.",
  "It's okay to call it early. You've earned some rest.",
  "Sometimes your brain just says 'enough'. Good job today.",
  "You've crushed it already. Take a well-deserved break."
];

const EndedEarlyScreen: React.FC = () => {
  const { activeSession, dismissEndedEarly } = useOceanStore(
    useShallow((s) => ({
      activeSession: s.activeSession,
      dismissEndedEarly: s.dismissEndedEarly,
    }))
  );

  const sessionCount = activeSession?.sessionCount || 0;

  const message = useMemo(() => {
    const pool = sessionCount > 0 ? APPRECIATIVE_MESSAGES : INCONSISTENT_MESSAGES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [sessionCount]);

  return (
    <div
      className="screen screen--centered"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-canvas)',
        gap: 'var(--space-6)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', maxWidth: 400 }}
      >
        <h1 className="text-h1" style={{ color: 'var(--text-primary)', marginBottom: 12 }}>
          {sessionCount > 0 ? "Session Ended" : "Session Aborted"}
        </h1>
        <p className="text-secondary text-body" style={{ lineHeight: 1.5 }}>
          {message}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PrimaryButton onClick={dismissEndedEarly} icon={<Home size={18} />}>
          Return Home
        </PrimaryButton>
      </motion.div>
    </div>
  );
};

export default EndedEarlyScreen;
