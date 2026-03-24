# Regressions And Lessons

This file distills the raw history in `tasks/todo.md` and `tasks/lessons.md` into grouped lessons that should remain useful even after the current prompt history is gone.

## Recurring Regression Themes

| Area | Failure pattern | Current guardrail | Main files/tests |
| --- | --- | --- | --- |
| Sidebar and HUD centering | Rows looked centered in code but rendered visibly off because margins and widths were not encoded consistently | Shared layout helpers plus layout tests that measure margins and slot bounds | `src/ui/layout.ts`, `tests/ui-layout.test.ts` |
| Selected-state visibility | Active brush/tool states became too subtle or disappeared under button fills/highlights | Shared button layer order and outline metrics with rendering tests | `src/ui/pixel-button-order.ts`, `tests/ui-rendering.test.ts` |
| Overlay dominance | Summary and editor popups were clipped or visually buried by regular controls | Explicit overlay/text/button depths and layout helpers | `src/ui/layout.ts`, scene overlay code, `tests/ui-layout.test.ts` |
| Progress meter readability | Labels and markers were unclear or visually off-center | Shared progress layout, marker helpers, and tests for optical centering | `src/ui/layout.ts`, `tests/ui-layout.test.ts` |
| Dense-screen typography | A font could look good on the splash screen but fail badly on cards, HUDs, or editor controls | Centralized font settings plus typography/layout regression coverage | `src/ui/typography.ts`, `tests/typography.test.ts`, `tests/ui-layout.test.ts` |
| One-off scene fixes | Quick per-scene tweaks solved one bug but left no general rule behind | Extract helpers first when a regression repeats | `src/ui/`, `src/game/`, and their tests |
| Visible copy drift | New UI text was added during implementation without explicit product intent | Working rule: do not invent visible UX copy casually | Reflected in docs and prior lessons |
| End-of-run state handling | Runs failed too early or summaries resolved at the wrong time | Dedicated simulation tests for outcome gates and TNT/fire edge cases | `src/game/simulation.ts`, `tests/simulation.test.ts` |

## Practical Rules For Future Changes

| Rule | Why it exists |
| --- | --- |
| If a layout issue has happened twice, move the geometry into a shared helper and add a pure test | This repo already paid the cost of repeated pixel nudges |
| Validate the densest surfaces first when changing fonts or font sizes | Menu screens are not representative enough |
| Treat draw order as explicit state, not an accident of creation order | Important UI states need stable visibility guarantees |
| Prefer changing a global helper over many scene-local offsets | It keeps the UI coherent and easier to reason about |
| If a new visible label or instruction appears, confirm it is intentional product copy | The project has already seen unwanted text creep into the UI |
| Keep summary/editor overlays inside bounded layouts with tested button stacks | Modal regressions are easy to reintroduce during unrelated changes |

## What The Repo Already Learned The Hard Way

| Lesson | Translation for future work |
| --- | --- |
| Optical center matters more than geometric center for pixel UI text | If something looks low or off-center, the math may still be technically "right" |
| A more authentic retro font is not automatically a more usable font | Readability wins on dense interactive screens |
| Gameplay-side helper extraction was worth it | Simulation, brush footprints, and HUD content are easier to test and reason about outside scenes |
| Visual tests do not have to be screenshot tests to be useful | Many regressions are prevented by asserting layout numbers, layer order, and content decisions directly |

## Relationship To Raw History

- `tasks/todo.md` still contains the detailed chronological build log and review notes.
- `tasks/lessons.md` still contains short tactical reminders.
- This file is the durable version: grouped by failure mode, tied back to the current architecture, and meant to survive long after the specific prompt context is forgotten.
