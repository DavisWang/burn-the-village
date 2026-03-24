# Burn the Village

Burn the Village is a Phaser + TypeScript web game built around a fixed pixel-art panel: lay hay, place TNT, route fire across a 32x32 map, and destroy enough structures to clear the level efficiently.

## Canon

| Source | Role | How to use it |
| --- | --- | --- |
| `src/` + `tests/` | Canonical implementation truth | Use this first when behavior or UI details matter. |
| [`docs/current-state.md`](docs/current-state.md) | Human/LLM summary of what is actually shipped | Use this to get oriented before diving into code. |
| [`Burn the Village.md`](Burn%20the%20Village.md) | Original concept and future-direction context | Treat this as intent/history, not the final implementation contract. |

## Current Scope

| Area | Status | Notes |
| --- | --- | --- |
| Splash menu | Shipped | Canvas-rendered title screen with entry points to level select and editor. |
| Level select | Shipped | Built-in levels plus JSON import into the local session. |
| Gameplay | Shipped | Fire spread, hay brush placement, TNT fuse/explosion, terrain obstacles (`deep water`, `marsh`, `walls`), score, rank, end-of-run summary, and gameplay SFX cues. |
| Level editor | Shipped | In-canvas authoring for fires, structures, terrain obstacles, resource budgets, goal, import/export, and play test. |
| EN/CN localization | Shipped | Splash-screen locale toggle, Simplified Chinese translations for shipped UI/copy, and a self-hosted Fusion Pixel Chinese font. |
| Custom level persistence | Limited | Lives only in in-memory session state for the current page load. |
| Audio / music / FX | Shipped | One looping music track, a shared mute control, and a lean set of UI/gameplay effects. |
| Mobile app wrapper | Not shipped | Mentioned in the concept doc only. |

## Run And Verify

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Local development server |
| `npm test` | Vitest regression suite |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview the production build locally |

## Documentation Map

| Document | Purpose |
| --- | --- |
| [`docs/current-state.md`](docs/current-state.md) | What exists today, what is intentionally incomplete, and where the current limits are |
| [`docs/architecture.md`](docs/architecture.md) | Scene flow, state flow, module boundaries, and helper ownership |
| [`docs/design-decisions.md`](docs/design-decisions.md) | Durable rationale for the repo structure and the choices that are easy to accidentally undo |
| [`docs/regressions-and-lessons.md`](docs/regressions-and-lessons.md) | Repeated failure modes, what fixed them, and where the guardrails now live |
| [`docs/future-direction.md`](docs/future-direction.md) | Plausible next steps and concept-doc ideas that are not yet shipped |
| [`docs/testing-as-spec.md`](docs/testing-as-spec.md) | How the tests encode gameplay, layout, readability, and draw-order contracts |

## Repo Map

| Path | Responsibility |
| --- | --- |
| `src/game/` | Pure game rules, level data, import/export, draft editing, and session state |
| `src/audio/` | Shared audio catalog, runtime state, and gameplay cue helpers |
| `src/i18n/` | Runtime locale state, translations, built-in level display names, and localized helper copy |
| `src/ui/` | Shared rendering, layout, typography, textures, buttons, and DOM bridge helpers |
| `src/scenes/` | Phaser scene orchestration for menu, level select, gameplay, and editor |
| `tests/` | Behavioral and regression specs for simulation, layout, rendering, animation, and typography |
| `tasks/` | Working memory from prior implementation passes; useful raw history, but not the main long-lived docs |
| `.github/workflows/` | GitHub Pages deployment automation |

## Working Rules For Future Changes

- Prefer current code and tests over older prose whenever they conflict.
- Keep shipped behavior and future ideas clearly separated in docs.
- Treat `src/ui/layout.ts` and the related layout tests as contracts, not optional cleanup targets.
- Treat typography, draw-order, and spacing helpers as hard-earned guardrails against repeated regressions.
