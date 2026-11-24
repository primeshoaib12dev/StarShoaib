/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { GameWorld3D } from './components/GameWorld3D';
import { LoadingScreen } from './components/LoadingScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { SplashScreen } from './components/SplashScreen';
import {
  AppFlowStage,
  DEFAULT_GAME_SAVE,
  GAME_STORAGE_KEY,
  PersistedGameSave,
  orderCarFromCatalog,
  unlockOrEquipOutfit,
} from './game/worldLogic';
import { soundEngine } from './utils/audioEngine';

function loadGameSave(): PersistedGameSave {
  if (typeof window === 'undefined') return DEFAULT_GAME_SAVE;
  try {
    const raw = window.localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) return DEFAULT_GAME_SAVE;
    const parsed = JSON.parse(raw) as Partial<PersistedGameSave>;
    return {
      ...DEFAULT_GAME_SAVE,
      ...parsed,
      unlockedOutfitIds: Array.isArray(parsed.unlockedOutfitIds)
        ? parsed.unlockedOutfitIds
        : DEFAULT_GAME_SAVE.unlockedOutfitIds,
      ownedCarIds: Array.isArray(parsed.ownedCarIds)
        ? parsed.ownedCarIds
        : DEFAULT_GAME_SAVE.ownedCarIds,
    };
  } catch {
    return DEFAULT_GAME_SAVE;
  }
}

export default function App() {
  const [save, setSave] = useState<PersistedGameSave>(loadGameSave);
  const [stage, setStage] = useState<AppFlowStage>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'splash';
  });

  // Sync audio mute state
  useEffect(() => {
    soundEngine.setMuted(save.muted);
  }, [save.muted]);

  // Unlock Web Audio on first user interaction
  useEffect(() => {
    const unlock = () => {
      soundEngine.unlock();
      if (!save.muted && (stage === 'loading' || stage === 'lobby' || stage === 'playing')) {
        soundEngine.startMusic();
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [save.muted, stage]);

  // Mirror game state to document.body.dataset.state & dataset.appStage
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.dataset.appStage = stage;
    document.body.dataset.state =
      stage === 'playing'
        ? 'playing'
        : stage === 'paused'
          ? 'paused'
          : 'title';
  }, [stage]);

  // Persist save to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Ignore storage errors
    }
  }, [save]);

  const handleSplashComplete = useCallback(() => {
    setStage('loading');
    soundEngine.startMusic();
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setStage('lobby');
  }, []);

  const handleStartGame = useCallback(() => {
    soundEngine.playClick();
    soundEngine.startMusic();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setStage('playing');
  }, []);

  const handleReplayIntro = useCallback(() => {
    soundEngine.playSplashSting();
    setStage('splash');
  }, []);

  const handleToggleMute = useCallback(() => {
    setSave((prev) => {
      const nextMuted = !prev.muted;
      soundEngine.setMuted(nextMuted);
      if (!nextMuted) {
        soundEngine.startMusic();
      }
      return { ...prev, muted: nextMuted };
    });
  }, []);

  const handleSelectOutfit = useCallback(
    (outfitId: string) => {
      const res = unlockOrEquipOutfit(save, outfitId);
      if (res.status === 'unlocked') soundEngine.playCoin();
      else if (res.status === 'equipped') soundEngine.playClick();
      setSave(res.save);
      return { status: res.status };
    },
    [save]
  );

  const handleAddCoins = useCallback((amount: number) => {
    setSave((prev) => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  const handleOrderCar = useCallback(
    (catalogId: string) => {
      const res = orderCarFromCatalog(save, catalogId);
      setSave(res.save);
      return { status: res.status, car: res.car };
    },
    [save]
  );

  const handleSetPaused = useCallback((nextPaused: boolean) => {
    if (nextPaused) {
      soundEngine.stopMusic();
      setStage('paused');
    } else {
      soundEngine.startMusic();
      setStage('playing');
    }
  }, []);

  const handleBackToLobby = useCallback(() => {
    soundEngine.startMusic();
    setStage('lobby');
  }, []);

  if (stage === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (stage === 'loading') {
    return (
      <LoadingScreen
        muted={save.muted}
        onToggleMute={handleToggleMute}
        onComplete={handleLoadingComplete}
      />
    );
  }

  if (stage === 'lobby') {
    return (
      <LobbyScreen
        save={save}
        onSelectOutfit={handleSelectOutfit}
        onStartGame={handleStartGame}
        onToggleMute={handleToggleMute}
        onReplayIntro={handleReplayIntro}
      />
    );
  }

  return (
    <GameWorld3D
      save={save}
      paused={stage === 'paused'}
      onSetPaused={handleSetPaused}
      onAddCoins={handleAddCoins}
      onSelectOutfit={handleSelectOutfit}
      onOrderCar={handleOrderCar}
      onToggleMute={handleToggleMute}
      onBackToLobby={handleBackToLobby}
    />
  );
}
