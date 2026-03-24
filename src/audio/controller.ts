import type Phaser from "phaser";

import { AUDIO_ASSETS, DEFAULT_MUSIC_TRACK, type AudioCueKey, type MusicTrackKey } from "./catalog";

export type AudioRuntimeState = {
  muted: boolean;
  unlocked: boolean;
  activeMusicTrack: MusicTrackKey | null;
};

let runtimeState = createAudioRuntimeState();
let activeMusic: Phaser.Sound.BaseSound | null = null;

export function createAudioRuntimeState(): AudioRuntimeState {
  return {
    muted: false,
    unlocked: false,
    activeMusicTrack: null
  };
}

export function unlockAudioState(state: AudioRuntimeState): AudioRuntimeState {
  if (state.unlocked) {
    return state;
  }
  return {
    ...state,
    unlocked: true,
    activeMusicTrack: state.activeMusicTrack ?? DEFAULT_MUSIC_TRACK
  };
}

export function toggleAudioMuteState(state: AudioRuntimeState): AudioRuntimeState {
  return {
    ...state,
    muted: !state.muted
  };
}

export function getDesiredMusicTrack(state: AudioRuntimeState): MusicTrackKey | null {
  return state.unlocked && !state.muted ? (state.activeMusicTrack ?? DEFAULT_MUSIC_TRACK) : null;
}

export function getAudioRuntimeState(): AudioRuntimeState {
  return { ...runtimeState };
}

export function preloadAudioAssets(scene: Phaser.Scene) {
  (Object.entries(AUDIO_ASSETS) as Array<[keyof typeof AUDIO_ASSETS, (typeof AUDIO_ASSETS)[keyof typeof AUDIO_ASSETS]]>).forEach(
    ([key, asset]) => {
      scene.load.audio(key, asset.path);
    }
  );
}

export function syncAudio(scene: Phaser.Scene): AudioRuntimeState {
  scene.sound.mute = runtimeState.muted;
  ensureMusic(scene);
  return getAudioRuntimeState();
}

export function unlockAudio(scene: Phaser.Scene): AudioRuntimeState {
  runtimeState = unlockAudioState(runtimeState);
  return syncAudio(scene);
}

export function toggleMute(scene: Phaser.Scene): AudioRuntimeState {
  runtimeState = toggleAudioMuteState(runtimeState);
  return syncAudio(scene);
}

export function playCue(scene: Phaser.Scene, cue: AudioCueKey): boolean {
  if (!runtimeState.unlocked || runtimeState.muted || !scene.cache.audio.exists(cue)) {
    return false;
  }
  const asset = AUDIO_ASSETS[cue];
  scene.sound.play(cue, {
    volume: asset.volume
  });
  return true;
}

export function bindSceneAudioInput(
  scene: Phaser.Scene,
  onStateChange?: (state: AudioRuntimeState) => void
) {
  const emit = () => {
    onStateChange?.(getAudioRuntimeState());
  };
  const handlePointerDown = () => {
    unlockAudio(scene);
    emit();
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === "m") {
      return;
    }
    unlockAudio(scene);
    emit();
  };
  const handleToggleMute = () => {
    toggleMute(scene);
    emit();
  };

  syncAudio(scene);
  emit();
  scene.input.on("pointerdown", handlePointerDown);
  scene.input.keyboard?.on("keydown", handleKeyDown);
  scene.input.keyboard?.on("keydown-M", handleToggleMute);

  scene.events.once("shutdown", () => {
    scene.input.off("pointerdown", handlePointerDown);
    scene.input.keyboard?.off("keydown", handleKeyDown);
    scene.input.keyboard?.off("keydown-M", handleToggleMute);
  });
}

function ensureMusic(scene: Phaser.Scene) {
  const desiredTrack = getDesiredMusicTrack(runtimeState);
  if (!desiredTrack || !scene.cache.audio.exists(desiredTrack)) {
    return;
  }

  if (activeMusic && activeMusic.key === desiredTrack) {
    if (!activeMusic.isPlaying) {
      try {
        activeMusic.play({
          loop: true,
          volume: AUDIO_ASSETS[desiredTrack].volume
        });
      } catch {
        activeMusic = null;
      }
    }
    return;
  }

  if (activeMusic) {
    try {
      activeMusic.stop();
      activeMusic.destroy();
    } catch {
      // Ignore stale sound handles and recreate the music loop below.
    }
    activeMusic = null;
  }

  activeMusic = scene.sound.add(desiredTrack, {
    loop: true,
    volume: AUDIO_ASSETS[desiredTrack].volume
  });
  activeMusic.play();
}
