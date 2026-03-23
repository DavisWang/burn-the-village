# Burn the Village TODO

## Plan

- [x] Scaffold `Vite + TypeScript + Phaser` project with test/build tooling.
- [x] Implement level types, validation, import/export, editor draft helpers, and session state.
- [x] Implement deterministic simulation engine for fire spread, TNT, scoring, and run outcomes.
- [x] Implement canvas-rendered Phaser scenes for menu, level select, gameplay, summary overlays, and editor.
- [x] Add built-in levels, GitHub Pages deployment workflow, and verify `npm test` + `npm run build`.
- [x] Rework editor typography and layout padding so the sidebar and HUD controls align inside their sections.

## Review

- Verified `npm test` passes.
- Verified `npm run build` passes and emits a production bundle.
- Verified the built app loads in a real browser with a Phaser canvas at `776x680`.
- Fixed the only browser-level issue found during verification: hidden DOM bridge inputs surfacing plus a missing favicon request.
- Verified editor-only UI follow-up fixes after user feedback: larger labels, centered sidebar action grid, and aligned HUD control columns.
- Verified the editor again in-browser after the latest typography/layout pass: sidebar controls stay within padding, medal controls render on the right HUD section, and no editor text is clipped.
