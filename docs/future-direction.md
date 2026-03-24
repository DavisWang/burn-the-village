# Future Direction

This file is intentionally forward-looking. Nothing here should be treated as already shipped unless it also appears in [`current-state.md`](current-state.md) and the code/tests support it.

## Plausible Next Steps

| Area | Likely next step | Why it makes sense | Current blocker / note |
| --- | --- | --- | --- |
| Persistent custom levels | Save editor drafts and imported levels to browser storage or a backend | The editor is already useful, but current session-only storage is temporary | Requires a persistence model and migration story for existing JSON files |
| Goal quality checks | Validate that authored resource budgets and completion goals are at least plausible | The editor currently blocks malformed levels, not impossible ones | Needs a definition of "reasonable" that is better than a hard-coded guess |
| Richer audio | Add scene-specific music, ambience layers, stronger mixing, and per-channel volume controls | The lean first pass improves feel, but the audio system is still intentionally compact | Needs more assets, mixing decisions, and a broader control model |
| Broader localization | Add more languages, menu-independent locale switching, and text/layout tuning for denser translations | The first i18n pass now ships English + Simplified Chinese, but the control surface and catalog are intentionally small | Needs broader copy review and more layout pressure testing than the current two-locale pass |
| More authored content | Add more built-in levels that deliberately teach `deepWater`, `wetTerrain`, and `wall` terrain patterns | The obstacle layer is now present, but built-in campaign content has not been redesigned around it yet | Requires intentional pacing, not just more maps |
| Mobile packaging | Wrap the web build for touch-first mobile play | The original concept mentioned iOS as a future path | UI is touch-friendly in spirit, but persistence/input/polish would need another pass |
| Deeper simulation tuning | Expand beyond the first terrain layer into richer fire behavior, structure differentiation, or TNT interactions | The terrain system gives the sim more shape, but the rule set is still intentionally compact | Any new rule should preserve clarity and testability |
| Editor UX improvements | Better affordances for naming, budgeting, imports, and authoring feedback | Current editor is functional but pragmatic | The canvas-first constraint makes UX polish more deliberate |

## Ideas From The Original Concept Doc That Are Not Yet Shipped

| Concept idea | Current reality |
| --- | --- |
| DB-backed custom level saving | Not implemented; custom levels live in memory only |
| Mobile iOS app follow-on | Not implemented |
| Expanded asset pipeline and separate asset iteration flow | Current visuals are mostly code-rendered, with no larger asset/content pipeline yet |
| Richer future validation for minimum score / completion rules | Still deferred |

## How To Use This File Later

- Add ideas here when they are directionally useful but not yet committed.
- When an item becomes implemented, move its concrete details into [`current-state.md`](current-state.md) and/or [`design-decisions.md`](design-decisions.md).
- Keep this file clearly aspirational so future LLMs do not confuse backlog ideas with the shipped product.
