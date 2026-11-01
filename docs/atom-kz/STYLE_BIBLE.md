# Atom Forge style bible (Kurzgesagt-level target)

Internal reference. Sources: three Kurzgesagt videos (Fusion, Neutron Stars, Sun/faces), sampled frame by frame (`refs/fr_*`, `refs/sheet_*.jpg`, zooms in `refs/zoom_*.jpg`, `refs/nucleus.png`, `refs/faces.png`), a Kurzgesagt artist's public colour advice, and brand data (Brandfetch). Refs are internal only. Never ship or show them.

## 1. Ten rules
1. **Flat vector, no outlines.** Shapes are set apart by colour and value, never by strokes. The only "lines" are thin white orbit rings, leader lines and arrows.
2. **Round everything.** Circles, pills and rounded rectangles. No sharp corners except arrowheads.
3. **Two-tone spheres.** A sphere is a flat base, a crescent shadow at lower right, a lit gradient at upper left, one soft oval highlight and a faint rim bounce on the shadow side. It is not physically shaded and has no specular hotspot.
4. **Saturation up, no black.** Shadows are hue-shifted, never greyed. A shadow on orange goes red-orange (#e8540a), and a shadow on pink goes magenta (#c4246f). "NO black in yellow and red tones."
5. **Complementary colours set focus.** A warm subject sits on a cool background (orange and pink nucleus on violet), or a cool subject on warm (blue electrons on coral).
6. **One background colour per beat.** The background changes when the idea changes: deep violet, coral, teal, lavender, sun-yellow, azure. Each is a soft radial gradient, lighter in the middle.
7. **Depth by blur, not fog.** Far layer: big, soft, low-opacity bokeh discs. Midground: the sharp subject. Near layer: one or two huge blurred particles crossing a corner.
8. **Glow is earned.** Only electrons, energy and "drop here" targets glow. Bloom uses a high threshold (≥ 0.9) so the matte particles never bloom.
9. **Film grain everywhere.** About 3–4 % luminance noise on backgrounds and particles. It kills the CG look.
10. **Faces are flat stickers.** They always face the viewer and are perfectly mirror-symmetric. They never wrap, clip or slide around a ball.

## 2. Palette (hex)
| Role | Hex | Notes |
|---|---|---|
| Deep space bg (outer / mid / inner) | #1e0063 / #2d0089 / #3a00a5 | sampled from Neutron Stars nucleus frame |
| Violet glow (bokeh) | #5a1fd1 | |
| Proton base / lit / shade / highlight / rim | #fb5a9e / #ff8cc0 / #c4246f / #ffd1e6 / #ff9ad0 | KZ nucleus pink (#fb61a4 sampled) |
| Neutron base / lit / shade / highlight / rim | #ff9406 / #ffbc08 / #e8540a / #fff0b0 / #ffcf6a | KZ nucleus orange (#ffbc08 / #ff9406 / #f64e00 sampled) |
| Electron / core / trail | #4d8bff / #e8f4ff / #bfe0ff | sampled #4b86ff |
| Beat backgrounds | coral #fd7476, teal #00ddb8, lavender #7b7cf0, azure #0089e0, sun #ffc21a→#ffe066 | from Fusion frames |
| Danger / repulsion | #e0244f | arrows, "Wobbly" end |
| Ink (eyes, mouth) | #2a0b3d | never pure black |
| Blush | #ff6f9a at ~45 % | |
| Text | #ffffff on colour, #2d0089 on white | |
| Brand anchors | #1566D3, #1E293B | Brandfetch, for reference only |

Green is hard: use teal (#00ddb8) rather than grass green.

## 3. Shapes and construction
- **Particle:** a sphere at 48×48 segments. The light comes from the upper left (-0.55, 0.7, 0.55). Lit band: `smoothstep(-0.30, 0.10, N·L)`. Highlight oval: `smoothstep(0.968, 0.978, N·H)` at 70 %. The proton has a soft "+" glyph when it has no face.
- **Nucleus:** a tight random-packed cluster (seeded spiral plus 260 relax steps). Neighbours touch. Never a lattice. Kinds are shuffled so pink and orange interleave.
- **Electron:** a white-hot core, a blue shell, an additive halo sprite and a comet trail. The trail is a tube along the orbit with alpha `pow(u, 1.6)` fading to the back.
- **Orbit/shell:** a thin white torus at 30–45 % opacity. The active shell goes to 90 % and gets thicker.
- **Arrows:** flat chunky chevrons in #e0244f, radiating out to show push.
- **Meter:** a flat bar with labelled solid-colour end caps ("Wobbly" | "Steady"), a white knob and a tick at the target.

## 4. Faces (the smile spec)
- They are drawn **in the particle's fragment shader**, in a camera-facing frame built from the sphere's view-space centre: `f = normalize(-centre)`, `r = normalize(cross(up, f))`, `u = cross(f, r)`, `p = (n·r, n·u)`.
- The mouth is an arc SDF evaluated on `abs(p.x)`, so it is mirror-symmetric by construction. Eyes are ellipses at `(abs(p.x) - 0.235, p.y - 0.10)`, rx 0.068, ry 0.092. The highlight is a small dot at the top centre of each eye (symmetric).
- Moods: smile (arc), grin (open D-mouth with tongue), worried (inverted arc), wow (small O). Blush ellipses sit under the eyes. Blink squashes eye ry to 12 %.
- Allowed asymmetry is deliberate only: a whole-face `tilt` rotation and a `look` offset. Both move the face as one rigid sticker.
- Edges are antialiased with `fwidth`. There is no geometry, so no z-fighting, no clipping and no bloom eating the mouth.

## 5. Typography
- Geometric sans, heavy. Poppins ExtraBold for titles, Bold for tags, SemiBold for captions (OFL, `assets/fonts/`). Kurzgesagt's own face is not public, and Poppins is the closest free match.
- **Tags:** solid colour rectangles, white uppercase, letter-spacing .06em, with an optional lighter `small` suffix ("PROTON charge +1").
- **Leader lines:** 2 px white, ending in a dot on the subject.
- **Captions:** one dark translucent pill, bottom centre, at most 2 lines and about 22 words. One key term per caption is highlighted in yellow #ffd23f. The flat line-art Saathy cloud icon sits on the left (stroke only, white).
- **Titles:** sentence case, 2 lines, centred, with a small spaced-caps sub-line.

## 6. Camera and motion
- Long lenses (fov 30–40), slow dollies and orbits, and nothing faster than about 15°/s. Camera moves ease in-out (cubic). Cuts happen on a background colour change.
- The subject sits off-centre on thirds when a tag is on screen, and centred for title cards.
- Idle life: particles bob ±2 % with seeded phase offsets, eyes blink every 3–6 s, and electrons always orbit (K faster than L faster than M).
- Pop-in: tags scale 0.8→1 with an overshoot (back-out 1.4) over 220 ms, and leader lines draw from subject to tag.
- Transitions: a background colour wipe as a circular iris from the subject (350 ms), or a split into panels.

## 7. Pacing
- One idea per beat. Each beat is 6–12 s of "video" and then a player action. The caption changes at most every 3.5 s.
- Every beat ends on a held, readable frame before control is handed over. Hand-off cue: a white pulsing ring plus a two-word hint ("Drag in", "Tap to place", "Hold anywhere").

## 8. Do-not list
No outlines on particles, no black shadows, no 3D puff mascot (Saathy is flat line-art), no emoji, no sound, no ranks or bands shown to students, no bloom on matte objects, no lens flares, no text smaller than 14 px at 1280 w.
