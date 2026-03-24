export const AUDIO_ASSETS = {
  musicLoop: {
    type: "music",
    path: "audio/music-loop.wav",
    volume: 0.26
  },
  uiClick: {
    type: "sfx",
    path: "audio/ui-click.wav",
    volume: 0.32
  },
  hayPlace: {
    type: "sfx",
    path: "audio/hay-place.wav",
    volume: 0.28
  },
  tntPlace: {
    type: "sfx",
    path: "audio/tnt-place.wav",
    volume: 0.4
  },
  fuseStart: {
    type: "sfx",
    path: "audio/fuse-start.wav",
    volume: 0.34
  },
  explosion: {
    type: "sfx",
    path: "audio/explosion.wav",
    volume: 0.62
  },
  ignition: {
    type: "sfx",
    path: "audio/ignition.wav",
    volume: 0.24
  },
  levelClear: {
    type: "sfx",
    path: "audio/level-clear.wav",
    volume: 0.56
  },
  runFailed: {
    type: "sfx",
    path: "audio/run-failed.wav",
    volume: 0.48
  }
} as const;

export const DEFAULT_MUSIC_TRACK = "musicLoop";

export type AudioAssetKey = keyof typeof AUDIO_ASSETS;
export type MusicTrackKey = typeof DEFAULT_MUSIC_TRACK;
export type AudioCueKey = Exclude<AudioAssetKey, MusicTrackKey>;
