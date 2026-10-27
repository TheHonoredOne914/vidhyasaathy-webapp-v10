Read plan/POLISH.md first and follow it. Do NOT run git/npm. Edit only: apps/web/src/routes/Landing.tsx, apps/web/src/landing/**, apps/web/src/auth/**, apps/web/src/routes/StudentHome.tsx, apps/web/src/student/**, sign-in/register route files. Terse.

Landing polish (priority):
- KEEP the Saathy cloud mascot (ui/Saathy.tsx SVG, transparent, no blue box). Place it top-center of the hero, peeking above/left of the phone preview, with handwritten label 'this is Saathy' and a curved SVG arrow pointing to it. Remove the extra cloud at the top-left corner.
- Keep the day/night split, phone preview, polaroid "tonight's games" shelf. But NO overlapping frames: the phone sits fully inside the day area or cleanly centered on the split with intentional gutter; the night panel text is never covered; polaroids fully visible, not clipped, evenly spaced on one baseline.
- More formal real-product feel: 12-col grid, 1200 max width, consistent spacing (8px scale), clean type scale from POLISH, restrained decoration (fewer doodles, max 3 small), aligned baselines. Check at 1440 and 1024 widths.
- Apply the same formal polish (grid, spacing, type, restrained decoration) to sign-in, register-school, student PIN sign-in and student home.
