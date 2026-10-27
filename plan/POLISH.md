# POLISH.md — v3 design system (read fully, obey)
Goal: real shipped app, human-made, NOT "AI generated/vibecoded". Inspo: Duolingo (chunky tactile buttons, bold progress, celebration), Khan Academy Kids (friendly illustration, soft shapes), Headspace (warm calm gradients, slow organic motion), Notion (restraint, whitespace, clear hierarchy). Alive, movable blocks, not a static poster.
## Brand
Font: Patrick Hand ONLY. Colors: navy #041D3D, deep #193E69, mid #28517C, blue #517DAB, paper #F9F6EE, mist #D6E2E6, sky #BFE3F5/#E6F4FB, peach #FFD8C2/#FFB894. No other hues except success #5BAE7E, warn #E9A23B, danger #D9534F (muted). No AI images, no stock photos.
## Tokens (put in apps/web/src/ui/tokens.css as CSS vars)
- type scale (px): 14 caption, 17 body, 20 lead, 24 h4, 30 h3, 38 h2, 52 h1; line-height 1.35; body min 17px (enlarge everything ~10%).
- spacing 4/8/12/16/24/32/48/72; radius 12 (inputs), 18 (cards), 28 (hero panels), 999 pills.
- buttons: min-height 48, padding 0 22, radius 14, Duolingo "3D" bottom edge: box-shadow 0 4px 0 darker shade; :active translateY(3px) shadow 0 1px. Primary navy, secondary paper w/ navy border, accent peach.
- cards: paper bg, 1.5px border rgba(4,29,61,.12), shadow 0 1px 0 rgba(4,29,61,.06),0 10px 30px -12px rgba(4,29,61,.18); hover lift translateY(-3px) + shadow grow.
- gradients (soft, layered, never rainbow): page = radial-gradient(1200px 600px at 10% -10%, #E6F4FB, transparent 60%), radial-gradient(900px 500px at 100% 0%, #FFE9DC, transparent 55%), #F9F6EE. Hero panel = linear-gradient(160deg,#193E69,#041D3D) + subtle radial sky glow. Dark game bg = radial-gradient(at 30% 20%, #193E69, #041D3D 70%).
- texture: optional faint notebook ruled lines (opacity = .05). No heavy patterns.
## Motion
- durations 160ms (press), 240ms (hover), 420ms (enter), easing cubic-bezier(.2,.8,.2,1); springy overshoot only for rewards.
- enter: fade+translateY(8px) staggered 40ms for lists/cards. Background doodles drift slowly (20–40s loops, =6px). Progress bars animate fill. Star/XP burst on success.
- respect prefers-reduced-motion (disable loops).
- blocks feel movable: draggable/reorderable where meaningful, hover tilt =2deg, parallax =8px.
## Mascot "Saathy" (cloud)
- Replace every <img src="/img/mascot.webp"> (it has an ugly blue box = "patch") with an inline SVG component `ui/Saathy.tsx`: white/cream cloud, navy outline 2.5px, rosy peach cheeks, simple eyes, moods: happy|think|cheer|sleep|wave; size prop; transparent bg; gentle bob animation. Use sparingly: max ONE per screen, only where it talks (tips, empty states, game narrator).
## Layout
- max content width 1200; generous whitespace; sidebar 260px with bigger nav items (48px rows, icons 22px).
- hand-drawn SVG icons/doodles (pencil, eraser, star, cloud, paper plane) as small accents, =3 per view.
## Data
Screens must use REAL apps/api routes (read apps/api/src/routes/*.ts + packages/contracts). Loading = skeletons, empty = friendly Saathy state, error = inline retry. Never invent endpoints; if needed data missing, derive client-side or show honest empty state.
## Rules
Edit only your assigned paths. Run `npx tsc -p apps/web --noEmit` mentally is not possible in sandbox—just keep types correct. Do NOT run git. Be token-efficient: no long explanations.
