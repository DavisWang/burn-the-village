# Lessons

- When adjusting fixed-layout canvas UI, define explicit inner padding and column widths for each section before moving buttons or text. Hard-left origins and hand-tuned offsets look aligned in code and still render visibly off-center.
- When centering fixed-layout sidebar controls, center each control row against the sidebar frame itself and add a regression test for the resulting left/right margins. Do not assume matching widths will look centered without measuring them.
- Do not introduce new text or other visible UI elements without explicit user instruction. Prefer moving or removing existing copy over inventing new guidance text.
