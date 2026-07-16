// Ocean — Reflection Sheet
// Part 2 § 2.6: Modal sheet, "Nice work.", optional note, 1-5 dot rating, Save & Continue.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOceanStore } from '../store/useOceanStore';
import { PrimaryButton, GhostButton } from '../components/Buttons';

const ReflectionSheet: React.FC = () => {
  const { activeSession, saveSession, completePhase } = useOceanStore();

  const [note,   setNote]   = useState('');
  const [rating, setRating] = useState<number | null>(null);

  const handleSave = () => {
    if (activeSession) {
      const endedAt = new Date();
      const startedAt = activeSession.startedAt;
      const actualSec = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

      saveSession({
        intention:          activeSession.intention,
        categoryId:         activeSession.categoryId,
        phaseType:          'focus',
        plannedDurationSec: activeSession.durationMin * 60,
        actualDurationSec:  actualSec,
        overflowSec:        activeSession.overflowMs ? Math.round(activeSession.overflowMs / 1000) : 0,
        startedAt:          startedAt.toISOString(),
        endedAt:            endedAt.toISOString(),
        status:             'completed',
        reflectionNote:     note.trim() || null,
        focusRating:        rating,
        source:             'manual',
      });
    }
    completePhase();
  };

  const handleSkip = () => {
    // Save session without reflection
    if (activeSession) {
      const endedAt = new Date();
      const actualSec = Math.round((endedAt.getTime() - activeSession.startedAt.getTime()) / 1000);
      saveSession({
        intention:          activeSession.intention,
        categoryId:         activeSession.categoryId,
        phaseType:          'focus',
        plannedDurationSec: activeSession.durationMin * 60,
        actualDurationSec:  actualSec,
        overflowSec:        0,
        startedAt:          activeSession.startedAt.toISOString(),
        endedAt:            endedAt.toISOString(),
        status:             'completed',
        reflectionNote:     null,
        focusRating:        null,
        source:             'manual',
      });
    }
    completePhase();
  };

  return (
    <div className="reflection-overlay">
      <motion.div
        className="reflection-sheet"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      >
        {/* Header */}
        <div>
          <h1 className="text-h1" style={{ marginBottom: 6 }}>Nice work.</h1>
          <p className="text-caption text-secondary">
            {activeSession?.intention && `"${activeSession.intention}"`}
          </p>
        </div>

        {/* Reflection note */}
        <div>
          <label
            htmlFor="reflection-note"
            className="text-caption"
            style={{ marginBottom: 8, display: 'block' }}
          >
            What did you get done? What did you learn?
            <span style={{ color: 'var(--text-tertiary)', marginLeft: 6 }}>(optional)</span>
          </label>
          <textarea
            id="reflection-note"
            className="reflection-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Finished the design review, spotted 3 edge cases to fix…"
            rows={4}
          />
        </div>

        {/* Focus quality rating */}
        <div>
          <p className="text-caption" style={{ marginBottom: 10 }}>
            How was your focus quality?
            <span style={{ color: 'var(--text-tertiary)', marginLeft: 6 }}>(optional)</span>
          </p>
          <div
            className="rating-dots"
            role="group"
            aria-label="Focus quality rating 1 to 5"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(rating === n ? null : n)}
                aria-label={`Rate focus quality ${n} of 5${rating === n ? ', selected' : ''}`}
                aria-pressed={rating !== null && n <= rating}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${rating !== null && n <= rating ? 'var(--accent-focus)' : 'var(--border-medium)'}`,
                  background: rating !== null && n <= rating ? 'var(--accent-focus)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s var(--ease-spring)',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  if (rating === null || n > (rating ?? 0)) {
                    (e.target as HTMLElement).style.transform = 'scale(1.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                }}
              />
            ))}
            {rating !== null && (
              <span className="text-caption text-focus" style={{ marginLeft: 8 }}>
                {['', 'Distracted', 'Low', 'Decent', 'Good', 'Deep flow'][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <GhostButton onClick={handleSkip}>Skip</GhostButton>
          <PrimaryButton onClick={handleSave}>Save & Continue</PrimaryButton>
        </div>
      </motion.div>
    </div>
  );
};

export default ReflectionSheet;
