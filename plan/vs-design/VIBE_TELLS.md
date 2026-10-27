# Vibe-coded tells and VidhyaSaathy fixes
Sources (read 25 Oct 2026):
- **[S1] Sitepeel:** https://sitepeel.dev/guides/check-if-website-looks-ai-generated/
- **[S2] DevelopersDigest:** https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it
  - Summarises Adrian Krebs's 16 patterns, scored across 1,590 Show HN landing pages.
- **[S3] Slopdar:** https://slopdar.com/guide/how-to-tell-if-a-website-is-ai-generated
- **[S4] Reddit r/ClaudeCode:** https://www.reddit.com/r/ClaudeCode/comments/1u7g0z5/
  - Ranks tells across about 47k posts.
- **[S5] Reddit r/SaaS:** https://www.reddit.com/r/SaaS/comments/1wlcl48/
- **[S6] Sailop:** https://sailop.com/blog/ai-slop-2026-state-of-the-ai-generated-web
- **[S7] dev.to uislop:** https://dev.to/alexander_mia_9/i-got-sick-of-my-claude-code-ui-slop-so-i-crystallized-it-into-a-go-cli-2hni
- **[S8] Ask HN:** https://news.ycombinator.com/item?id=49290499
- **[S9] HN, "The AI Aesthetic":** https://news.ycombinator.com/item?id=49117099 and https://news.ycombinator.com/item?id=49122083
- **[S10] Seon:** https://seon.lnln.eu/ai-detector/database

Caveat from S1, S6 and S10: no single tell proves a site is AI-made. These patterns look generic when they stack up, and good human-made sites use some of them too.

**Two warnings that apply to our own palette:**
- **Navy:** S8 lists "techy colour schemes like navy blue (especially with gradients)" as a tell.
- **Beige or cream with orange:** S9 says sparkle emoji with beige, cream or orange accents reads as AI output.

Our brand is navy, ivory and peach, so these colours must be flat and deliberate, never gradient soup.

## Layout
- **Centred hero with a pill badge above the H1, one line of text and two buttons** [S1][S2][S7].
  - *Instead:* the asymmetric Day | Night split hero, with a left-aligned H1 on the ivory half.
  - The badge is dropped. If an annotation is needed, use one Patrick Hand note with a drawn arrow.
- **Hero, then 3 identical icon cards, then a CTA; bento grids; testimonials, then pricing, then the footer** [S3][S4][S5][S1].
  - *Instead:* the scroll timeline (3 PM / 5 PM / 7 PM / 9 PM), with uneven section heights and one visual per stop.
  - The role cards differ in size and tint and each carries a real micro-illustration, not an icon.
- **Numbered 1-2-3 step rows; stat banner rows; all-caps section labels** [S2][S7].
  - *Instead:* the time stamps are the sequence.
  - No stat row until real pilot numbers exist.
  - Labels use sentence case.
- **Too much whitespace** [S4: "way too much whitespace"].
  - *Instead:* keep the content dense and specific, with real textbook examples such as a Class 9 Science chapter.

## Type
- **Inter, Geist, Space Grotesk or Poppins everywhere; Instrument Serif italic on one accent word** [S2][S7][S10][S4].
  - *Instead:* Plus Jakarta Sans for headings and body.
  - Patrick Hand only for 6-word annotations and time stamps.
  - No italic-serif accent word.
- **One headline word in another colour or a gradient** [S1][S6].
  - *Instead:* the H1 is one solid colour (navy on ivory, ivory on navy).
  - Emphasis comes from a Patrick Hand margin note or a hand-drawn underline SVG.

## Colour
- **"VibeCode purple" (#6366F1–#8B5CF6, Tailwind indigo/violet); purple-to-blue gradients** [S2][S3][S4][S6][S7].
  - *Instead:* no purple anywhere.
  - Sky #7FB3FF is the only cool accent, used for the connecting line and links.
- **Gradients everywhere: the H1, CTAs, icon backgrounds** [S2][S7].
  - *Instead:* the only gradient allowed is the page's ivory-to-navy day-to-night background shift.
  - Buttons and text are flat.
- **Permanent dark mode with neon glows; coloured glows behind buttons; grey-on-dark text below 4.5:1** [S2][S4][S7][S8].
  - *Instead:* day sections are light and night sections are dark.
  - Ivory text on navy, at 4.5:1 or better.
  - No coloured box-shadows. If a shadow is needed, use a small, low-opacity navy one.

## Iconography
- **Lucide icons on every feature, especially Sparkles, Zap, Shield and BarChart3** [S3][S6][S7].
  - *Instead:* use the mascot and small custom spot illustrations (book, lamp, atom, leaf).
  - Where an icon is unavoidable, use a single-stroke icon at the text size with no rounded-square tile.
- **Emoji as icons or bullets, or in headings** [S1][S2][S4][S6].
  - *Instead:* none.
- **✨ sparkle for "AI"** [S9][S6].
  - *Instead:* present Saathy as the cloud mascot, never as a sparkle.

## Copy
- **"Transform / Supercharge your X", "Build. Ship. Scale." tricolons, "Not just X, it's Y"; the words elevate, seamless, unlock, empower, effortless** [S1][S3][S4][S5].
  - *Instead:* specific lines, e.g. "Stuck on Chapter 4 at 9 PM? Ask Saathy."
- **High em-dash density with hedges** [S3][S6][S8].
  - *Instead:* at most 1 em dash on the whole landing page. Use full stops.
- **Unsourced 10K+ / 99.9% / 24/7 claims; fake testimonials and logos** [S1].
  - *Instead:* show only real pilot data, with a date.

## Components
- **Untouched shadcn, Radix or Lucide with Tailwind slate cards, "that specific blue accent" and the same padding rhythm** [S3][S4].
  - *Instead:* use our own design tokens (radius scale, spacing and colours), so components never ship on default tokens.
- **Rounded corners on everything; coloured top or left border on cards** [S4][S2].
  - *Instead:*
    - A 2-step radius scale: 8 px for controls, 20 px for big panels.
    - No accent-bordered cards.
- **Glassmorphism (frosted cards or nav); 1px border with a 40px blur shadow** [S1][S7][S8].
  - *Instead:* a solid ivory or navy nav that gets a hairline border on scroll.
- **Terminal mockup with traffic-light dots** [S6].
  - *Instead:* real VidhyaSaathy screens on a phone frame, since students use phones.

## Motion
- **Unnecessary hover and scroll animations on everything; Framer Motion "smooth animations" by default** [S4][S10].
  - *Instead:* 2–3 meaningful motions only:
    - The sky line draws on load.
    - The sky darkens on scroll.
    - The mascot blinks.
  - All of them respect `prefers-reduced-motion`.

## Imagery
- **Blurred colour blobs; stock 3D blobs; generated avatars; no real product screenshot** [S1][S5].
  - *Instead:* the illustrated classroom and desk scenes, the mascot, and actual app screenshots of the chat, games and parent report.

## Code-level defaults
- **Builder residue:**
  - Lovable, v0, Bolt or Replit badges and scripts.
  - `*.lovable.app` preview hosts.
  - The `cdn.gpteng.co` font.
  - A "My App" title, the default Vite favicon, no OG image.
  - `[Your Company]` placeholders, lorem ipsum.
  - [S3][S7]
  - *Instead:*
    - Title: "VidhyaSaathy · Learning, with you".
    - The V-book favicon.
    - An OG image of the split hero.
- **Sonner toast together with untouched shadcn** [S10].
  - *Instead:* keep it if used, but theme it.

## Audit checklist (run from the repo root, with `apps/web/src` as the target)
```bash
W=apps/web
rg -n "bg-gradient-to|bg-linear-to|linear-gradient|bg-clip-text|text-transparent" $W/src   # gradients / gradient text: allow only the day-night bg
rg -n -i "purple|violet|indigo|fuchsia|#6366f1|#7c3aed|#8b5cf6|#a855f7" $W/src $W/index.html
rg -n "Inter|Geist|Space Grotesk|Poppins|Instrument Serif|Roboto|gpteng" $W/src $W/index.html
rg -n "backdrop-blur|backdrop-filter" $W/src                                      # glassmorphism
rg -n "shadow-(purple|indigo|blue|violet|sky)|drop-shadow-\[|0 0 [0-9]+px" $W/src      # coloured glows
rg -c "rounded-(2xl|3xl|full)" $W/src | sort -t: -k2 -n -r | head                  # radius overuse: review files > 5
rg -n "border-l-4|border-t-4|border-l-\[|border-t-\[" $W/src                       # accent-border cards
rg -n "Sparkles|Zap|ShieldCheck|BarChart3|Rocket" $W/src                           # default lucide vocabulary
rg -n "rounded-(lg|xl|2xl)[^\"]*bg-[a-z]+-(50|100)[^\"]*p-[23]" $W/src            # icon-in-tinted-square tiles
rg -n -P "[\x{1F300}-\x{1FAFF}\x{2728}\x{2705}\x{1F680}]" $W/src                   # emoji anywhere in source
rg -n -i "supercharge|transform your|elevate|seamless|unlock|empower|effortless|next-gen|revolutioni|not just .*it's" $W/src
rg -c "—" $W/src | awk -F: '{s+=$2} END {print "em dashes:", s}'                    # target <= 1 on landing
rg -n -i "lorem|\[your|my app|as an ai|10k\+|99\.9%|24/7" $W/src $W/index.html
rg -n "uppercase tracking-(wide|widest)" $W/src                                    # all-caps labels
rg -n "<title>|og:image|rel=\"icon\"" $W/index.html                                # metadata filled, no vite.svg
rg -n "framer-motion|motion/react" $W/src | wc -l; rg -n "prefers-reduced-motion|useReducedMotion" $W/src
```
**Pass criteria:**
- 0 purple hits.
- 0 emoji.
- 0 banned words.
- At most 1 em dash on the landing page.
- Gradients appear only in the day-night background token.
- No `backdrop-blur`, except the mobile nav sheet if it's justified.
- The reduced-motion guard is present.
- The title, OG image and favicon are set.
