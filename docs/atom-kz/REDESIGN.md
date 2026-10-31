# Atom Forge: interactive cutscene redesign

Goal: it should play like a Kurzgesagt explainer that you can grab and steer, like a video-game cutscene with hand-offs to the player. It teaches Class 9 NCERT Ch. 4 *Structure of the Atom*: charged particles, nucleus, shells (K 2, L 8), atomic number Z, mass number A, isotopes. Rules: full-screen (100vw × 100vh), no sound, no emoji, no ranks or bands (friendly words only: "Let's fix this", "Almost there", "Mastered", "Top form", "New"), and Saathy is flat line-art.

Concept frames: `frames/f1…f6`. Symmetry proof: `frames/f7`. Smile before and after: `frames/f8`. Before screenshots: `before/`.

## 0. What is wrong today (diagnosis)
1. **Smile bug, the root cause.** In `AtomForgeScene.tsx`, `Billboard` (line ~63) does `ref.current.quaternion.copy(camera.quaternion)`. That sets the **local** rotation to the camera's **world** rotation. But the faces live inside parents that rotate: `NucleusCluster` sets `root.rotation.y = t*0.4` and adds an x wobble, and `OrbitalRing` groups are tilted and spinning. So the face's world rotation is `parentRot × camQuat`, and the face rolls and yaws, which makes the smile visibly lopsided.
   - On top of that, the face anchor `offset=[0,0,radius*1.05]` is fixed in the parent's rotating frame. As the nucleus spins, the face slides round to the side of its ball and cuts into its own sphere and the neighbouring balls. The depth buffer clips half the mouth or one eye, which leaves lone eyes, half smiles and faces floating beside balls (`before/before-nucleus-closeup.png`).
   - Copying the quaternion (instead of looking at the camera position) also skews faces away from screen centre under perspective.
   - Finally, the smile is `ringGeometry(…, 16, 1, PI, PI)`, a thin half-ring with flat ends. Bloom (threshold 0.2) washes out its bright-rim side, so even a correctly oriented smile reads uneven.
2. **Visuals.** Everything blooms (threshold 0.2), so particles read as glowing blobs rather than matte stickers. Fresnel shading looks CG. There is one flat background for every episode, no colour storytelling, no tags or leader lines, and the 3D flat-shaded puff Saathy breaks the flat line-art rule.

**Fix:** delete `Billboard`/`CuteFace` geometry faces and draw faces in the particle shader in a camera-facing frame with `abs(x)` symmetry (`reference/kz/particleMaterial.ts`). Proof: `frames/f7-smile-symmetry-check.png`, six random parent rotations, off-axis, all even.

## 1. Structure
Six beats. Each one runs **Cutscene** (auto camera plus captions, 6–12 s, scrub-able and skippable), then **Your turn** (the player has control and the camera eases to a play framing), then **Payoff** (a 2–3 s mini-cutscene reacting to what the player did), then the next beat. The player can always drag to orbit the subject within limits. The cutscene camera resumes with a 600 ms ease when the player lets go.

| # | Beat | BG | Cutscene (camera + captions) | Your turn (hand-off) | Payoff | Learning goal |
|---|---|---|---|---|---|---|
| 1 | **Cold open: What is everything made of?** | deep violet | Start on a big blurry foreground particle that rack-focuses to a carbon atom far away. Slow push-in (fov 32, z 18→14). Captions: "Your desk, your hand, the air you breathe." then "Zoom in far enough and it is all **atoms**." | **Hold anywhere** to zoom in. Zoom speed follows hold time. Releasing drifts back slightly (this teaches the control). | When the nucleus fills 40 % of the screen, the background irises to a lighter violet: "The atom is mostly empty space." | Matter is made of atoms. The atom has a centre plus electrons around it. |
| 2 | **Meet the nucleus** | violet | Dolly to the nucleus (C-12). The 3 front particles open their eyes (blink in). Tags pop in with leader lines: PROTON charge +1, NEUTRON no charge. "At the very centre sits the **nucleus**…" then "Protons are positive. Neutrons have no charge." | **Drag to spin** the nucleus (inertia, clamped pitch). **Tap any particle** and it bounces, its tag pins, and its face looks at the cursor (uLook). | After 1 proton and 1 neutron are tapped: "Electrons are negative, and there are as many as protons." K-shell electrons streak in. | Charges of p, n, e. The nucleus holds the mass. |
| 3 | **Keep it together (stability)** | sun-yellow | Hard cut. A 6p/4n nucleus (C-10) wobbles, faces go worried, and red push arrows radiate out. Captions: "Six protons all push each other away." then "Neutrons add glue without adding push." | **Drag neutrons in** from a tray along a dotted guide into the glowing drop ring. A flat Wobbly / Steady meter tracks `isotopeStability(p, n)`. The wobble amplitude, the arrows and the faces respond live. Too many neutrons swings the meter back ("Almost there, one too many"). The player can also drag a neutron out. | At 6 neutrons the faces flip to smile, the arrows retract and the rings settle: "Steady! 6 protons + 6 neutrons." Count chips update: Z = 6, A = 12. | Neutrons stabilise the nucleus. A = p + n. Z = p. |
| 4 | **Fill the shells** | azure | Camera cranes up to a 3/4 top view of sodium (11p, 12n). K fills (2) then L fills (8), each electron landing with a pop. "Electrons fill shells from the inside out. K holds 2, L holds 8." | **Tap to place** the last electron: tap a shell (K/L/M). Full shells reject it with a gentle bounce ("Let's fix this: L is full"). The M slot pulses as the hint after 1 wrong try. Readout: K 2 · L 8 · M 0/1. | The electron locks into M, the shell rings flash in sequence, and the readout shows "2, 8, 1". | Shell capacity and electronic configuration (2n² for the first shells). Valence. |
| 5 | **Isotope reveal** | coral, teal, lavender split | The screen splits into 3 panels with a vertical wipe. Each shows carbon with 6, 7, 8 neutrons and a white orbit ring. Top tags: ¹²C, ¹³C, ¹⁴C. Bottom data: "6 protons · 7 neutrons, Z = 6 · A = 13". "Same 6 protons, so all three are carbon. Only the neutrons change. These are **isotopes**." | **Sort it:** drag 4 cards (C-12, C-14, Ca-40, Ar-40) into Isotopes / Isobars bins (the existing `isotopeSort` validator). Wrong drops slide back. | The panels merge into one: "Same A, different Z = isobars." | Isotopes vs isobars. Notation. |
| 6 | **Recap: build any atom** | violet (returns) | Pull back to the cold-open framing with all characters waving. | **Free build:** +/- proton, neutron and electron. The live name, Z, A, configuration and stability meter update. Three quick checks (the existing `conceptQuiz`). | Ending card: friendly status words only ("Mastered" / "Almost there"). | Recall: Z, A, shells, isotopes. |

**Captions:** bottom-centre pill, at most 2 lines, one yellow key term, flat Saathy line-art icon. Captions advance on a timer (about 3.5 s) or on tap. A chapter progress bar of 6 dashes sits top right. The chapter chip sits top left.

**Recap screen (end of beat 6):** four cards, each a tiny looping vignette:
- Nucleus = protons (+) and neutrons (0)
- Electrons (−) orbit in shells: K 2, L 8
- Z = protons, A = protons + neutrons
- Isotopes: same Z, different A

## 2. Art spec (maps to STYLE_BIBLE)
- **Particles:** `makeParticleMaterial` (two-tone toon shading, oval highlight, rim bounce, grain, shader face). Proton pink #fb5a9e, neutron amber #ff9406. A proton without a face shows the "+" glyph. Faces only on the 2–4 particles nearest the camera (sorted each beat start), so the cluster isn't a wall of faces.
- **Electrons:** core, shell, halo and comet trail (`makeElectron`). This is the only thing that blooms, plus the drop ring and slot targets.
- **Background:** `makeBackdrop(inner, outer)`, a full-screen radial gradient with grain, renderOrder -10. Bokeh far layer (`makeBokeh` at z -40…-10), sparkles, and 1–3 near blurred particles.
- **Post:** one EffectComposer with `Bloom` (threshold 0.9, intensity 0.5, mipmapBlur), `Vignette` (0.25), and **no DepthOfField** (fake it with pre-blurred bokeh sprites; it costs too much and smears faces). Output sRGB. All custom shaders end with `#include <colorspace_fragment>`.
- **HUD:** DOM over the canvas (hud.css). Tags with leader lines are projected from 3D anchors each frame (`Vector3.project`, after `camera.updateMatrixWorld()`).
- **Saathy:** inline SVG, white 3 px stroke only, rounded caps. It replaces the 3D `SaathyCloud`.

## 3. Performance budget (target: mid-range Chromebook / Android, 60 fps; floor 45)
- ≤ 60 draw calls per beat, ≤ 150k triangles. Particles use 48×48 spheres (32×32 when more than 20 particles). Use InstancedMesh for nuclei larger than 14 particles.
- One shader program for every particle (uniform-driven moods), plus 3–4 other programs total.
- Post: Bloom plus Vignette only, at half-resolution bloom. DPR clamp [1, 1.75].
- PerfGuard: below 45 fps for 2 s, DPR goes to 1. Below 35 fps, bloom is off and the bokeh count is halved. Never drop the faces or the captions.
- Boot: the atom chunk is lazy-loaded at 250 kB gz or less (three is already shared). Fonts are Poppins woff2, 2 weights, 40 kB or less. No textures except procedural canvas discs.
- `prefers-reduced-motion`: no camera dollies (cuts only), no wobble, and the meter still animates.

## 4. File and module plan (apps/web/src/games/atom/)
```
kz/palette.ts            colours + Mood (from reference)
kz/particleMaterial.ts   shader faces (from reference) + useParticleMaterial hook (memo, uTime/uBlink/uLook per frame)
kz/nucleus.ts            packNucleus (deterministic)
kz/electron.ts           makeElectron / makeShellRing -> R3F components <Electron/> <ShellRing/>
kz/background.ts         <Backdrop/> <Bokeh/> <Sparkles/>
kz/Particle.tsx          <Particle kind face mood tilt look onTap/>
kz/Nucleus.tsx           <Nucleus p n spread wobble faces/> (spring-animated positions)
kz/CameraRig.tsx         beat camera keys + eased hand-off to OrbitControls-lite
kz/Hud.tsx               Tag, Leader, Caption (Saathy SVG), Meter, Chips, Progress, Hint
kz/SaathyLine.tsx        flat line-art mascot SVG
kz/beats.ts              data: per-beat bg, camera keys, captions, act kind, payoff
AtomForgeScene.tsx       rewritten: composes the above per beat (delete Billboard/CuteFace/3D SaathyCloud)
AtomForgeVideo.tsx       phases intro/play/act/branch/done kept; episodes -> beats; keep all data-afv-* hooks
atom-forge-video.css     full-bleed 100vw/100vh + HUD styles (port hud.css)
validators.ts            unchanged (isotopeStability, atomBuild, isotopeSort, conceptQuiz, massNumber)
```
Tests: keep `atom.test.ts`. Add `kz/nucleus.test.ts` (deterministic and no overlaps), `kz/beats.test.ts` (every beat has captions of 2 lines or fewer, an act kind and a hint), and a face-symmetry unit test that evaluates the mouth/eye SDF in TS for ±x and expects equal values.
