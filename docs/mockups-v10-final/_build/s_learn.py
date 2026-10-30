from lib import *
# ---------- LESSON ----------
lcss = r'''
.ls-head{display:flex;justify-content:space-between;align-items:flex-end;gap:var(--nb-s5);margin-bottom:var(--nb-s4)}
.ls-crumb{display:flex;gap:.5rem;align-items:center;font-family:var(--nb-font-hand);font-weight:700;font-size:1.1rem;color:var(--nb-navy-muted)}
.ls-body{display:flex;flex-direction:column;gap:var(--nb-s5)}
.ls-sheet{background:var(--nb-paper);border:var(--nb-line) solid var(--nb-navy);border-radius:var(--nb-radius-sketch);padding:var(--nb-s5) var(--nb-s6) var(--nb-s6) calc(var(--nb-s6) + 1.5rem);position:relative;box-shadow:var(--nb-shadow);
  background-image:linear-gradient(90deg,transparent 2.6rem,var(--nb-margin-ink) 2.6rem,var(--nb-margin-ink) calc(2.6rem + 1.5px),transparent calc(2.6rem + 1.5px)),repeating-linear-gradient(180deg,transparent 0,transparent calc(var(--nb-rule) - 1px),var(--nb-rule-ink) calc(var(--nb-rule) - 1px),var(--nb-rule-ink) var(--nb-rule));line-height:var(--nb-rule)}
.ls-sheet p{font-family:var(--nb-font-note);font-size:1.22rem;line-height:var(--nb-rule);max-width:48rem}
.ls-sheet h2{font-family:var(--nb-font-hand);font-weight:700;font-size:2rem;line-height:var(--nb-rule);margin:var(--nb-s3) 0 0}
.ls-two{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:var(--nb-s6);align-items:start}
.ls-formula{display:inline-block;background:var(--nb-cream-soft);border:2px solid var(--nb-navy);border-radius:12px;padding:.3rem 1.2rem;font-family:var(--nb-font-hand);font-weight:700;font-size:2.4rem;position:relative;margin:.6rem 0;transform:rotate(-1deg);line-height:1.3}
.ls-formula small{display:block;font-family:var(--nb-font-note);font-weight:400;font-size:1rem;line-height:1.2;color:var(--nb-navy-muted)}
.ls-bridge{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--nb-s4);align-items:center}
.ls-check{background:var(--nb-sky);border:1.75px dashed var(--nb-blue);border-radius:16px;padding:var(--nb-s4) var(--nb-s5);line-height:1.4}
.ls-check .opts{display:flex;gap:var(--nb-s2);flex-wrap:wrap;margin-top:var(--nb-s3)}
.ls-check .o{font-family:var(--nb-font-ui);font-weight:600;padding:.5rem 1rem;border-radius:12px;background:#fff;border:1.5px solid var(--nb-navy)}
.ls-check .o.ok{background:var(--nb-ok-soft);border-color:var(--nb-ok);color:#1F6B47}
.ls-worked{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--nb-s5)}
.step{display:grid;grid-template-columns:2rem minmax(0,1fr);gap:var(--nb-s2);font-family:var(--nb-font-note);font-size:1.2rem;line-height:var(--nb-rule);position:relative}
.step b{font-family:var(--nb-font-hand);font-size:1.3rem;color:var(--nb-gold-deep)}
.pen{font-family:var(--nb-font-hand);font-weight:700;color:var(--nb-redpen);font-size:1.1rem;margin-left:.6rem}
.yourturn{opacity:1;border:1.75px dashed var(--nb-border);border-radius:16px;padding:var(--nb-s3) var(--nb-s4);background:rgb(255 253 248 / 70%);line-height:1.4}
.yourturn .blank{display:inline-block;min-width:4.5rem;border-bottom:2px solid var(--nb-navy);margin:0 .3rem}
.ls-mis{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--nb-s4);background:#FFF6F3;border:1.75px solid var(--nb-redpen);border-radius:16px;padding:var(--nb-s4) var(--nb-s5);line-height:1.4}
.ls-mis .x{font-family:var(--nb-font-hand);font-weight:700;font-size:1.3rem;color:var(--nb-redpen)}
.toc .t{display:grid;grid-template-columns:1.3rem 1fr;gap:var(--nb-s2);align-items:center;font-family:var(--nb-font-hand);font-weight:600;font-size:1.15rem;padding:.25rem 0}
.toc .t i{width:1.1rem;height:1.1rem;border-radius:50%;border:1.75px solid var(--nb-navy)}
.toc .t.d i{background:var(--nb-ok);border-color:var(--nb-ok)} .toc .t.c i{background:var(--nb-gold)} .toc .t.c{color:var(--nb-navy)} .toc .t:not(.d):not(.c){color:var(--nb-ink-soft)}
.vid{border-radius:14px;overflow:hidden;border:1.75px solid var(--nb-navy);background:#1B2A4A;aspect-ratio:16/9;display:grid;place-items:center;position:relative}
.vid .play{width:3.2rem;height:3.2rem;border-radius:50%;background:var(--nb-gold);display:grid;place-items:center}
.vid .play svg{width:1.3rem;height:1.3rem;stroke:var(--nb-navy);fill:var(--nb-navy)}
.vid .cap{position:absolute;left:.6rem;bottom:.5rem;font-size:.72rem;color:#fff;background:rgb(0 0 0 / 35%);padding:2px 8px;border-radius:999px}
@media (max-width:1023px){ .ls-two,.ls-worked{grid-template-columns:1fr} .ls-sheet{padding:var(--nb-s4) var(--nb-s4) var(--nb-s4) 3.2rem;background-image:linear-gradient(90deg,transparent 2rem,var(--nb-margin-ink) 2rem,var(--nb-margin-ink) calc(2rem + 1.5px),transparent calc(2rem + 1.5px)),repeating-linear-gradient(180deg,transparent 0,transparent calc(var(--nb-rule) - 1px),var(--nb-rule-ink) calc(var(--nb-rule) - 1px),var(--nb-rule-ink) var(--nb-rule))} .ls-head{flex-direction:column;align-items:flex-start} .ls-bridge{grid-template-columns:1fr}}
'''
vt = '''<svg viewBox="0 0 300 190" style="width:100%"><g stroke="#1B2A4A" stroke-width="2" fill="none" stroke-linecap="round"><path d="M40 160V18M40 160H286"/><path d="M34 26l6-8 6 8M278 154l8 6-8 6"/></g>
<path d="M40 150 L240 40" stroke="#3D6FB8" stroke-width="3.2" fill="none" stroke-linecap="round"/>
<path d="M40 150 H240" stroke="#D9823B" stroke-width="3" stroke-dasharray="7 6" fill="none" stroke-linecap="round"/>
<path d="M140 95 H200 V62" stroke="#C9433A" stroke-width="2" fill="none" stroke-dasharray="4 4"/>
<text x="150" y="112" font-family="Caveat" font-weight="700" font-size="16" fill="#C9433A">t</text><text x="206" y="84" font-family="Caveat" font-weight="700" font-size="16" fill="#C9433A">Δv</text>
<text x="190" y="36" font-family="Caveat" font-weight="700" font-size="18" fill="#3D6FB8">speeding up</text><text x="190" y="144" font-family="Caveat" font-weight="700" font-size="18" fill="#D9823B">a = 0</text>
<text x="8" y="30" font-family="Caveat" font-weight="700" font-size="16" fill="#1B2A4A">v</text><text x="270" y="182" font-family="Caveat" font-weight="700" font-size="16" fill="#1B2A4A">t</text>
<text x="64" y="70" font-family="Caveat" font-size="17" fill="#C9433A" transform="rotate(-6 64 70)">slope = a</text></svg>'''
lbody = f'''
<div class="nb-grid">
 <div class="nb-col">
  <div class="ls-head">
    <div><div class="ls-crumb">{ic("back")} Physics · Motion <span class="nb-meta">/</span> Idea 5 of 8</div>
      <h1 class="nb-h1" style="font-size:3rem">Acceleration</h1>{scribble()}
      <p class="nb-sub">How fast your speed itself is changing.</p></div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.6rem">
      <span class="nb-mastery nb-mastery--new">New</span>
      <div class="nb-tabs"><button class="nb-tab is-active">Notes</button><button class="nb-tab">Story</button><button class="nb-tab">Diagram</button><button class="nb-tab">Exam style</button></div>
      <button class="nb-btn nb-btn--quiet nb-btn--sm">{ic("refresh")} Explain simpler</button>
    </div>
  </div>
  <div class="ls-body">
   <section class="nb-sticky nb-sticky--blue ls-bridge" style="transform:rotate(-.5deg)">{saathy("3.6rem","happy")}<div><span class="nb-sticky__who" style="color:var(--nb-blue)">Bridge · you already know this</span>
     In Class 7 you learned <b>speed = distance ÷ time</b>. Acceleration asks the same kind of question, but about speed: <i>how much does velocity change every second?</i></div><button class="nb-btn nb-btn--ghost nb-btn--sm">Revise Class 7 speed</button></section>

   <section class="ls-sheet">
     <span class="nb-tape" style="left:45%"></span>
     <div class="ls-two">
       <div>
         <h2>1. What it means</h2>
         <p>When Aarav's school bus pulls out of the stop, its velocity goes from <span class="nb-hl">0 to 10 m/s</span>. That change, spread over time, is <span class="nb-hl nb-hl--green">acceleration</span>.</p>
         <div class="ls-formula">a = (v − u) / t<small>u = starting velocity, v = final velocity, t = time taken</small></div>
         <p>Unit: <span class="nb-hl nb-hl--blue">m/s²</span>, metres per second, every second.</p>
       </div>
       <div><h2>2. See it</h2>{vt}<p style="font-size:1.05rem">Steeper line on a v-t graph = <span class="nb-redpen">bigger acceleration</span>.</p></div>
     </div>
     <div class="ls-check" style="margin-top:var(--nb-s4)"><div style="display:flex;justify-content:space-between;align-items:center;gap:1rem"><span class="nb-label" style="color:var(--nb-blue)">Quick check · 1 of 2</span><span class="nb-meta">Doesn't count. Just for you.</span></div>
       <div class="nb-note" style="font-size:1.3rem;margin-top:.3rem">A bike goes from 0 to 10 m/s in 5 s. What is its acceleration?</div>
       <div class="opts"><span class="o">50 m/s²</span><span class="o ok">{ic("check")} 2 m/s²</span><span class="o">0.5 m/s²</span><span class="o">15 m/s²</span></div>
       <div class="nb-text" style="margin-top:.6rem;color:#1F6B47">Right. (10 − 0) ÷ 5 = 2 m/s². Your speed grows by 2 m/s every second.</div></div>

     <h2 style="margin-top:var(--nb-s5)">3. Worked example</h2>
     <div class="ls-worked">
       <div>
         <p style="font-family:var(--nb-font-ui);font-size:1rem;line-height:1.5;margin-bottom:.4rem"><b>Q.</b> A train slows from 72 km/h to 36 km/h in 10 s. Find its acceleration.</p>
         <div class="step"><b>1</b><span>Convert: 72 km/h = 20 m/s, 36 km/h = 10 m/s <span class="pen">÷ 3.6 first!</span></span></div>
         <div class="step"><b>2</b><span>a = (v − u) / t = (10 − 20) / 10</span></div>
         <div class="step"><b>3</b><span>a = <span class="nb-circle-pen">−1 m/s²</span> <span class="pen">minus = slowing down</span></span></div>
       </div>
       <div class="yourturn"><span class="nb-label">Your turn</span><div class="nb-note" style="margin:.3rem 0">A car speeds up from 18 km/h to 54 km/h in 5 s.</div>
         <div class="nb-text">u = <span class="blank"></span> m/s, v = <span class="blank"></span> m/s<br/>a = <span class="blank"></span> m/s²</div>
         <div style="display:flex;gap:.5rem;margin-top:.8rem"><button class="nb-btn nb-btn--primary nb-btn--sm">Check my working</button><button class="nb-btn nb-btn--quiet nb-btn--sm">Show step 1</button></div></div>
     </div>
   </section>

   <section class="ls-mis">{saathy("3.6rem","think")}<div><div class="x">Common mix-up: "negative acceleration means going backwards"</div><div class="nb-text">No. The train above is still moving forwards. Minus only means the velocity is <span class="nb-hl nb-hl--pink">getting smaller</span>. Backwards would be a negative velocity.</div></div></section>
   <div style="display:flex;justify-content:space-between;align-items:center"><button class="nb-btn nb-btn--ghost">{ic("back")} Speed &amp; velocity</button><button class="nb-btn nb-btn--primary nb-btn--lg">I've got it · take the 3-question check {ic("arrow")}</button></div>
  </div>
 </div>
 <aside class="nb-col">
  <section class="nb-card toc"><div class="nb-card__head"><h3 class="nb-h3">On this page</h3><span class="nb-meta">8 min</span></div>
   <div class="t d"><i></i>Bridge from Class 7</div><div class="t d"><i></i>What it means</div><div class="t d"><i></i>See it on a graph</div><div class="t c"><i></i>Quick check</div><div class="t"><i></i>Worked example</div><div class="t"><i></i>Common mix-up</div><div class="t"><i></i>3-question check</div></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Watch the bit that matters</h3></div>
   <div class="vid"><div class="play">{ic("play")}</div><span class="cap">Plays 3:12 to 5:40 only</span></div>
   <div class="nb-text" style="margin-top:.5rem"><b>Acceleration, explained with a cycle</b></div><div class="nb-meta">Checked by Sharma Ma'am · 2 min 28 s</div></section>
  <section class="nb-card nb-grow"><div class="nb-saathy-tip">{saathy("3.6rem","happy")}<div><div class="nb-h3" style="font-size:1.3rem">Ask about this page</div><div class="nb-text">I'll explain it another way.</div></div></div>
   <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:.7rem"><button class="nb-chip nb-chip--sky">Why m/s²?</button><button class="nb-chip nb-chip--sky">Another example</button><button class="nb-chip nb-chip--sky">Is deceleration different?</button></div>
   <div class="nb-input nb-input--lined is-placeholder" style="margin-top:.8rem">Type your doubt…</div></section>
 </aside>
</div>'''
page('lesson','Acceleration',lbody,lcss,active='subjects')
