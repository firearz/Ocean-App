// Ocean — useAmbientAudio Hook
// Bridges Zustand ambient settings → ambientEngine singleton.
// Mount this once at the App level to keep audio alive across all screens.

import { useEffect } from 'react';
import { useOceanStore } from '../store/useOceanStore';
import { useShallow } from 'zustand/react/shallow';
import { ambientEngine } from '../engine/ambientAudio';

export function useAmbientAudio(): void {
  const { ambientSound, ambientVolume } = useOceanStore(
    useShallow((s) => ({
      ambientSound: s.settings.ambientSound,
      ambientVolume: s.settings.ambientVolume,
    }))
  );

  useEffect(() => {
    ambientEngine.setVolume(ambientVolume);
  }, [ambientVolume]);

  useEffect(() => {
    if (ambientSound === 'none') {
      ambientEngine.stop();
    } else {
      ambientEngine.play(ambientSound);
    }
  }, [ambientSound]);
}
