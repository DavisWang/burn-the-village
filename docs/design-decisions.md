# Design Decisions

This file captures the "why" behind the current repo shape. Future edits should use it as a guardrail against accidentally undoing hard-won decisions that solved repeated problems.

## Core Decisions

| Decision | Why it was made | Tradeoff | Do not accidentally undo |
| --- | --- | --- | --- |
| Keep the primary UI inside Phaser/canvas | The retro look depends on one consistent rendered surface rather than visible DOM controls | Input and text entry are a little more awkward | Do not quietly move core HUD/sidebar/editor controls into visible HTML just because it is easier |
| Centralize layout math in `src/ui/layout.ts` | Sidebar/HUD centering, control fit, and overlay bounds regressed repeatedly when each scene owned its own geometry | Shared helpers feel more formal than ad hoc numbers | Do not "just tweak one scene" without deciding whether the shared layout contract also needs to change |
| Treat tests as behavioral contracts for UI, not only logic | Many costly bugs were visual or spatial, not algorithmic | More helper extraction and more pure test targets | Do not delete a layout or rendering test because it looks cosmetic |
| Keep scenes thin and helpers rich | The same simulation, drawing, and layout rules need to stay consistent across gameplay/editor/select flows | More files to understand at first | Do not pile new rule logic directly into scenes |
| Centralize typography and wait for the font before boot | Readability was a real problem, and fallback/system fonts made the UI drift visually | Slight startup delay and font-management complexity | Do not remove font readiness or scatter font-family/size logic across scenes |
| Use explicit depth/layout helpers for overlays and selected states | Creation order was not reliable enough to protect modals and outlines during refactors | Slightly more ceremony around draw order | Do not rely on object creation order when the UI state must stay visually dominant |
| Keep session state in-memory for now | It keeps the editor/select/game loop simple while the product is still evolving | Imported/custom levels disappear on refresh | Do not describe this as persistent storage in docs or UX copy |
| Version the exported level file shape | Imported levels are the clearest future extension point, so the boundary should stay explicit | Requires some validation and migration discipline later | Do not silently change the JSON format without versioning or documenting it |

## What Worked

| Pattern | Why it worked |
| --- | --- |
| Pulling scene-specific math into pure helper files | Turned repeated visual regressions into testable geometry contracts |
| Distinguishing current implementation from concept/future intent | Prevented confusion when older docs and current code diverged |
| Using targeted regression tests after every repeated failure | Stopped the same sidebar, overlay, font, and progress-meter bugs from coming back |
| Keeping renderer logic separate from simulation logic | Made it easier to improve visuals without destabilizing gameplay rules |

## What Did Not Work Well

| Pattern | Why it kept failing |
| --- | --- |
| One-off pixel nudges inside scenes | They fixed the visible bug once but left no shared rule behind |
| Assuming geometric center equals visual center | Pixel fonts and framed UI often needed optical, not mathematical, centering |
| Relying on creation order for overlays/outlines | Refactors quietly changed draw stacking and buried important UI states |
| Swapping fonts based on splash-screen appearance alone | Dense gameplay/editor surfaces exposed readability failures that the title screen hid |

## Decision Log

Use this section as the ongoing place to append future durable context. Keep entries short and practical.

| Context | Decision / change | Why | Replaced | Future editor warning |
| --- | --- | --- | --- | --- |
| v1 foundation | Split repo into `game`, `ui`, and `scenes` layers | Keep rules, rendering, and orchestration separate | Scene-heavy implementation tendency | If scenes start owning too much state logic again, complexity will spike fast |
| UI stabilization pass | Moved layout contracts into `src/ui/layout.ts` and added layout tests | Sidebar/HUD/editor geometry was regressing repeatedly | Scene-local spacing constants | Change shared layout helpers first, then update tests intentionally |
| Typography/readability pass | Centralized pixel font settings and delayed boot until fonts were ready | Retro look was not enough; dense screens still had to be readable | Ad hoc font stacks and fallback flashes | Test dense surfaces before declaring a font change done |
| Overlay/draw-order fixes | Added explicit overlay depths and selected-outline ordering rules | Important states were being visually buried | Implicit creation order assumptions | If a modal or selected state matters, encode its depth contract explicitly |
| 2026-03 durable docs pass | Added root/docs knowledge base and made code/tests explicit canon | Important context was trapped in prompt history and task logs | Chronological task notes as the main memory source | Append future rationale here instead of relying on chat history alone |

## Suggested Entry Format

When adding a new entry later, capture:

1. Version/date context
2. The decision or change
3. Why it happened
4. What it replaced or corrected
5. What future editors should be careful not to undo
