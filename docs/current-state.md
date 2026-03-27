# Current State

This document describes what the repo ships today. When this file conflicts with older planning or concept docs, treat the current code and tests as the source of truth.

## What Exists Today

| Area | Shipped behavior | Notes |
| --- | --- | --- |
| Boot flow | `main.ts` waits for the pixel font, creates the Phaser game, then enters `BootScene` and `MenuScene` | Avoids a system-font flash on first render. |
| Menu | Full-panel splash screen with `LEVEL SELECT`, `HOW TO PLAY`, `LEVEL EDITOR`, and a bottom-right `EN | CN` locale toggle | No empty sidebar/HUD framing on the menu. |
| How to play | Single-screen reference scene with a labeled mechanic preview board plus short localized guidance for objective, tools, terrain, controls, structures, and scoring | Non-interactive aside from `LEVEL SELECT` and `BACK` navigation; label placement and copy fit are protected by tests. |
| Level select | Shows built-in levels, scrolls long lists, imports JSON level files into the current session, and localizes shipped copy in English or Simplified Chinese | Imported levels are available immediately, but only for the current page load. |
| Gameplay | Fixed 32x32 board, hay brush sizes `1x1`, `2x2` top-left anchored, and `3x3`, TNT placement, speed control, score, rank, progress meter, obstacle terrain (`deepWater`, `wetTerrain`, `wall`), localized HUD/summary copy, and gameplay SFX | Fire spread is probabilistic, but seeded per run/tick so the simulation is still reproducible from state. |
| Level editor | Places fire sources, structures, and terrain obstacles; edits hay/TNT budgets and completion goal; imports/exports JSON; localizes overlays/status copy; and play-tests directly into `GameScene` | Editing is still constrained to the existing structure catalog, obstacle tile set, and fixed grid size. |
| Audio | One looping music track, a shared speaker-style mute toggle, `M` shortcut support, and lean UI/gameplay SFX | Audio unlocks on first user interaction and persists across scene changes for the current page load. |
| Localization + typography | `en` and Simplified Chinese (`zhHans`) ship today, with Fusion Pixel used for Chinese canvas text | The selected locale is runtime-only and lasts for the current page load. |
| Built-in content | 20 generated campaign levels with localized names, a 10-level mechanic tutorial, and a 10-level harder final test | Generated into `src/game/generated-campaign.ts` and exposed via `src/game/levels.ts`. |
| Deployment | GitHub Pages workflow present | Intended hosting path for the web build. |

## Current Constraints

| Constraint | Current behavior | Why it matters |
| --- | --- | --- |
| Persistence | Custom levels live only in `GameSession` memory | A refresh clears imported levels and the editor draft. |
| Canvas-first UI | Primary interface is drawn inside Phaser, not built from visible DOM controls | Retro style consistency matters more than HTML form convenience. |
| Locale switching | Only the splash menu exposes the `EN | CN` toggle in v1 | Other scenes follow the active runtime locale, but do not expose their own switcher yet. |
| Text entry | Name and budget entry still rely on hidden DOM inputs via `domBridge` | This is a practical bridge for input inside a canvas-driven app, not the final UX ideal. |
| Fixed geometry | Layout assumes the current panel/map/sidebar/HUD proportions | Most UI regressions happened when geometry drifted without shared helpers/tests. |
| Editor validation | Structural validity is enforced; "is this goal/budget reasonable?" is not | The editor prevents malformed levels, not unfun levels. |
| Terrain authoring | Obstacles are tile-authored only and cannot overlap fires or structures | Terrain changes board routing and TNT behavior without adding new runtime tools. |

## Intentionally Incomplete Or Deferred

| Area | Status | Evidence in repo |
| --- | --- | --- |
| Persistent level storage / DB | Not shipped | The concept doc mentions a DB, but `src/game/session.ts` is intentionally in-memory only. |
| Mobile wrapper / iOS app | Not shipped | Mentioned only as a future possibility in the concept doc. |
| Built-in campaign attainability validation | Shipped for the generated campaign only | `npm run generate:levels -- 20` solves each generated level against its authored completion goal under the offline deterministic solver, replay-checks the plan across multiple live seeds, tunes budgets against replay-success and difficulty windows, and emits `docs/generated-campaign-report.md`. |
| Editor plausibility validation | Not shipped | The editor still blocks malformed budgets/goals, not "is this custom level fun or beatable?" |
| More languages / richer locale controls | Not shipped | The repo currently ships only English and Simplified Chinese, with the toggle on the menu only. |
| Advanced content pipeline / asset toolchain | Not shipped | Visuals are mostly code-driven textures and Phaser drawing helpers today. |

## What Is Working Well

- The game loop, editor, and level import/export are all present inside one coherent canvas-first flow.
- Shared helpers now own most layout, typography, texture, and draw-order decisions that previously regressed when embedded directly in scenes.
- The tests cover logic and visual invariants together, which is why the repo can now move faster without re-breaking the same UI details.

## What To Keep In Mind Later

- The concept doc still matters, but mostly as product direction and future inspiration.
- The working implementation has already diverged from the original plan in practical ways, especially around persistence, polish, and authoring scope.
- If a future LLM needs to extend the game, it should start with [`architecture.md`](architecture.md) and [`testing-as-spec.md`](testing-as-spec.md), not the concept doc alone.
