# Testing As Spec

The tests in this repo are not just sanity checks. They are the executable version of several product and UI contracts that have already regressed in the past.

## Test Suite Map

| Test file | What it specifies | Why it matters |
| --- | --- | --- |
| `tests/simulation.test.ts` | Failure gates, terrain-aware placement/explosion behavior, brush footprints, medal thresholds, reset seed behavior, and import/export validation | Protects gameplay rules and level file contracts |
| `tests/audio.test.ts` | Audio runtime state, gameplay cue detection, and button click sound gating | Protects the lean audio layer without requiring browser playback in tests |
| `tests/i18n.test.ts` | Locale runtime state, translated helper copy, built-in level names, and localized file-boundary errors | Protects the shipped EN/CN contract and keeps localized copy out of scene-local string drift |
| `tests/ui-layout.test.ts` | Sidebar/HUD centering, overlay bounds, obstacle sidebar copy, progress meter layout, stat slot placement, and summary dialog fit | Protects pixel geometry and spacing decisions that repeatedly regressed |
| `tests/ui-rendering.test.ts` | Grass/terrain/roof texture richness, terrain layer ordering, thumbnail rendering, and selected-button outline order/strength | Protects visual contracts that are easy to weaken during refactors |
| `tests/fire-animation.test.ts` | Fire animation frame helper behavior | Keeps animation helpers stable without coupling everything to a scene |
| `tests/typography.test.ts` | Font family/loading and global font size helpers | Protects readability decisions and font initialization behavior |

## What Future Changes Should Assume

| If you change... | Expect to update... | Reason |
| --- | --- | --- |
| Brush behavior or resource placement | `tests/simulation.test.ts` | Brush sizes and edge clamping are part of gameplay behavior |
| Terrain types or TNT breach rules | `tests/simulation.test.ts`, `tests/ui-rendering.test.ts`, and likely docs | Obstacles are both gameplay and rendering contracts now |
| Score/rank/completion logic | `tests/simulation.test.ts` and possibly docs | The end-of-run contract is user-visible gameplay, not an internal detail |
| Sidebar/HUD/editor geometry | `tests/ui-layout.test.ts` | Layout helpers are intentionally test-backed |
| Button visuals or selection affordances | `tests/ui-rendering.test.ts` | Selected-state visibility is a known regression area |
| Fonts or font sizes | `tests/typography.test.ts` and likely layout tests | Readability changes often have layout consequences |
| Localized copy, locale state, or built-in level naming | `tests/i18n.test.ts`, `tests/ui-layout.test.ts`, and likely docs | The game now ships a real locale surface, not just hard-coded English labels |
| Overlay layering | `tests/ui-layout.test.ts` and possibly `tests/ui-rendering.test.ts` | Modal and selected-state depth rules should stay explicit |
| Mute toggle placement or audio runtime helpers | `tests/audio.test.ts`, `tests/ui-layout.test.ts`, and likely docs | Audio UX is now part of the fixed-panel contract, not an incidental extra |

## What The Tests Do Not Try To Do

| Non-goal | Current approach |
| --- | --- |
| Full screenshot approval coverage | The repo mostly asserts layout/math/rendering invariants directly instead |
| End-to-end browser replay for every scene transition | The code favors pure helper tests plus targeted manual verification when needed |
| Exhaustive content tuning | Tests protect rules and layout; level design quality is still an authored choice |

## Practical Reading Order For A Future LLM

1. Read [`current-state.md`](current-state.md).
2. Read [`architecture.md`](architecture.md).
3. Skim this file to see which tests are acting as product contracts.
4. Open the corresponding helper/module files before editing scenes directly.

## Acceptance Standard

If a future change breaks a test here, the default assumption should be:

- the test is protecting an intentional behavior, or
- the change needs a documented contract update, not a casual test deletion

Only remove or relax a test after the intended product/design change is explicit in code and docs.
