from p45 import *

CONF_ICONS = {
 'sure':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>',
 'unsure':'<svg viewBox="0 0 24 24"><path d="M4 12c2-3 4-3 6 0s4 3 6 0 2-2 4-1"/><circle cx="12" cy="18.5" r=".6"/><path d="M12 4v4"/></svg>',
 'guess':'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/></svg>',
}
def conf(sel=None):
    b = lambda k,l,s: f'<button class="nb-confbtn nb-confbtn--{k}{" is-selected" if sel==k else ""}">{CONF_ICONS[k]}<span>{l}<small>{s}</small></span></button>'
    return f'<div class="nb-conf"><div class="spread"><span class="nb-conf__q">How sure are you?</span><span class="nb-meta">It shapes what Saathy gives you next. It doesn\'t change your time.</span></div><div class="nb-conf__row">{b("sure","Sure","I know this")}{b("unsure","Unsure","I think so")}{b("guess","Guess","Picked one")}</div></div>'
def opt(k, text, state='', mark=''):
    return f'<button class="nb-opt {state}"><span class="nb-opt__key">{k}</span><span class="nb-opt__body">{text}</span><span class="nb-opt__mark">{mark}</span></button>'

G_CSS = r'''
.g-top{display:flex;align-items:center;gap:var(--nb-s4);flex-wrap:wrap;margin-bottom:var(--nb-s4)}
.g-top .back{display:inline-flex;align-items:center;gap:6px;font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem;color:var(--nb-navy-muted)}
.g-title{font-family:var(--nb-font-hand);font-weight:700;font-size:2.2rem;line-height:1;color:var(--nb-navy)}
.timer{margin-left:auto;display:flex;align-items:center;gap:.6rem;background:var(--nb-navy);color:#fff;border-radius:14px;padding:.35rem 1rem .35rem .8rem;box-shadow:3px 3px 0 var(--nb-gold)}
.timer svg{width:1.3rem;height:1.3rem;stroke:#fff}
.timer b{font-family:var(--nb-font-hand);font-size:1.9rem;line-height:1;letter-spacing:.02em}
.timer small{font-family:var(--nb-font-hand);font-weight:700;font-size:1rem;color:var(--nb-gold)}
.best{font-family:var(--nb-font-hand);font-weight:700;font-size:1.2rem;color:var(--nb-ink-soft);display:inline-flex;gap:.35rem;align-items:center}
.flags{display:flex;gap:.4rem;align-items:center}
.flags span{display:inline-grid;place-items:center;width:2rem;height:2rem;border-radius:50%;border:2px dashed var(--nb-border);font-family:var(--nb-font-hand);font-weight:700;color:var(--nb-ink-faint)}
.flags .r{border:2px solid var(--nb-ok);background:var(--nb-ok-soft);color:var(--nb-ok)}
.flags .w{border:2px solid var(--nb-redpen);background:#FFF1EE;color:var(--nb-redpen)}
.flags .c{border:2px solid var(--nb-navy);background:var(--nb-gold);color:var(--nb-navy)}
.flags svg{width:1rem;height:1rem;stroke-width:3}
.stage{position:relative;border:2px solid var(--nb-navy);border-radius:6px 20px 8px 18px;overflow:hidden;background:#EAF4E4;box-shadow:4px 5px 0 rgb(27 42 74 / 12%)}
.stage svg{display:block;width:100%;height:auto}
.stage .paused{position:absolute;left:1rem;top:1rem;background:var(--nb-paper);border:1.75px solid var(--nb-navy);border-radius:999px;padding:.15rem .8rem;font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem;display:flex;gap:.4rem;align-items:center}
.stage .paused svg{width:1rem;height:1rem}
.cp-card{margin-top:-2.2rem;margin-inline:clamp(.5rem,2vw,2rem);z-index:2}
.cp-card .nb-q__text{font-size:clamp(1.6rem,2vw,2.1rem)}
.counts{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;font-family:var(--nb-font-hand);font-weight:700;font-size:1.1rem;color:var(--nb-ink-soft)}
.cp-foot{display:flex;align-items:center;justify-content:space-between;gap:var(--nb-s4);flex-wrap:wrap;padding-top:var(--nb-s4);border-top:1.5px dashed var(--nb-border)}
.cl{display:flex;flex-direction:column;gap:.6rem}
.cl .it{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.2rem .6rem;align-items:center}
.cl .it small{grid-column:1 / -1;color:var(--nb-ink-soft);font-size:.85rem}
'''

def track(car_x=470, paused=True):
    # side-on race road with checkpoint gates, chalk distance marks
    return f'''<svg viewBox="0 0 1000 300" role="img" aria-label="Race track, car approaching checkpoint 2">
<rect width="1000" height="300" fill="#DCEFF7"/>
<path d="M0 150 Q120 110 250 140 T520 130 T800 140 T1000 120 V300 H0z" fill="#CDE7C6"/>
<path d="M0 175 Q160 150 330 170 T700 165 T1000 160 V300 H0z" fill="#B9DDB1"/>
<g fill="none" stroke="#1B2A4A" stroke-width="2"><circle cx="880" cy="60" r="26" fill="#FFF1A6"/><path d="M120 70q20-18 40 0q18-10 30 6h-80z" fill="#fff"/><path d="M620 52q16-14 32 0q14-8 24 5h-62z" fill="#fff"/></g>
<rect x="0" y="196" width="1000" height="74" fill="#5D6577"/>
<path d="M0 196H1000M0 270H1000" stroke="#1B2A4A" stroke-width="3"/>
<path d="M0 233H1000" stroke="#FFFDF8" stroke-width="4" stroke-dasharray="34 26"/>
<g font-family="Caveat" font-weight="700" font-size="22" fill="#1B2A4A">
 <text x="30" y="292">0 m</text><text x="230" y="292">50 m</text><text x="430" y="292">100 m</text><text x="630" y="292">150 m</text><text x="830" y="292">200 m</text></g>
<g stroke="#1B2A4A" stroke-width="2.4">
 <path d="M300 196V110"/><path d="M300 110h46l-10 12 10 12h-46" fill="#5FB58A"/>
 <path d="M620 196V96"/><path d="M620 96h52l-11 14 11 14h-52" fill="#E8B84A"/>
 <path d="M900 196V110"/><path d="M900 110h46l-10 12 10 12h-46" fill="#FFFDF8"/></g>
<g font-family="Caveat" font-weight="700" font-size="20" fill="#1B2A4A"><text x="306" y="127">1</text><text x="628" y="116">2</text><text x="906" y="127">3</text></g>
<g transform="translate({car_x} 0)">
 <path d="M-120 212h-60M-110 226h-80M-125 240h-50" stroke="#E8B84A" stroke-width="5" stroke-linecap="round"/>
 <g stroke="#1B2A4A" stroke-width="2.6" stroke-linejoin="round"><path d="M-95 248v-22l26-18h60l26 18h26v22z" fill="#C9433A"/><path d="M-64 212l14-12h40l14 12z" fill="#DCEAF6"/>
 <circle cx="-62" cy="250" r="13" fill="#FFFDF8"/><circle cx="20" cy="250" r="13" fill="#FFFDF8"/><circle cx="-62" cy="250" r="4" fill="#1B2A4A"/><circle cx="20" cy="250" r="4" fill="#1B2A4A"/></g>
 <text x="-40" y="238" font-family="Caveat" font-weight="700" font-size="20" fill="#fff" text-anchor="middle">17</text></g>
<path d="M480 150 q60 -40 130 -30" stroke="#3D6FB8" stroke-width="2" fill="none" stroke-dasharray="5 5"/>
<text x="452" y="172" font-family="Caveat" font-weight="700" font-size="24" fill="#3D6FB8">150 m in 6 s</text>
</svg>'''

check_body = f'''
<div class="g-top"><a class="back" href="#">{ic("back")} Games</a><span class="g-title">Race Track</span><span class="nb-chip nb-chip--sky">Motion · speed</span>
 <div class="flags" aria-label="Checkpoints"><span class="r">{ic("check")}</span><span class="c">2</span><span>3</span></div>
 <span class="best nb-hide-m">{star("","1.1rem")} Your best 42 s</span>
 <div class="timer">{ic("clock")}<b>18.4 s</b><small>paused</small></div></div>
<div class="p45">
 <div class="nb-col" style="gap:0">
  <div class="stage">{track()}<span class="paused">{ic("clock")} Clock stops while you answer</span></div>
  <section class="nb-qcard cp-card">
   <span class="nb-tape nb-tape--pink" style="left:auto;right:3rem"></span>
   <div class="nb-q__label"><span class="nb-q__num">2</span><span class="nb-label">Checkpoint 2 of 3</span><span class="nb-mastery nb-mastery--almost">Almost there</span></div>
   <h1 class="nb-q__text">Your car covers <span class="nb-hl">150 m</span> in <span class="nb-hl nb-hl--blue">6 s</span>. What is its average speed?</h1>
   <div class="nb-opts">{opt("a","25 m/s","is-selected")}{opt("b","900 m/s")}{opt("c","0.04 m/s")}{opt("d","144 m/s")}</div>
   {conf("sure")}
   <div class="cp-foot"><div class="counts">{ic("target")} This answer counts toward <span style="color:var(--nb-navy)">Speed &amp; velocity</span></div><button class="nb-btn nb-btn--primary nb-btn--lg">Lock it in and drive {ic("arrow")}</button></div>
  </section>
 </div>
 <aside>
  <section class="nb-card"><div class="nb-saathy-tip">{saathy("3.6rem","think")}<div><div class="nb-h3" style="font-size:1.3rem">Take your time</div><div class="nb-text" style="font-size:.95rem">The clock is stopped. Speed is distance divided by time.</div></div></div></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">This race practises</h3></div>
   <div class="cl">
    <div class="it"><span>Distance &amp; displacement</span><span class="nb-mastery nb-mastery--mastered">Mastered</span><small>Checkpoint 1 · done</small></div>
    <div class="it"><span>Speed &amp; velocity</span><span class="nb-mastery nb-mastery--almost">Almost there</span><small>Checkpoint 2 · now</small></div>
    <div class="it"><span>km/h ↔ m/s</span><span class="nb-mastery nb-mastery--fix">Let's fix this</span><small>Checkpoint 3 · next</small></div>
   </div></section>
  <section class="nb-sticky nb-sticky--green" style="margin:.4rem .3rem"><span class="nb-tape nb-tape--green" style="width:4.5rem;top:-.6rem"></span><span class="nb-sticky__who">Your best</span>
   <div class="hand" style="font-size:2.2rem;line-height:1.1">42 s</div><div>Beat it by reaching the finish faster. Right answers keep the car moving.</div></section>
 </aside>
</div>'''

# ---------------------------------------------------------------- finish
F_CSS = r'''
.fin{position:relative;border:2px solid var(--nb-navy);border-radius:6px 22px 8px 18px;background:var(--nb-paper);padding:var(--nb-s6) var(--nb-s6) var(--nb-s5) calc(var(--nb-s6) + 1.4rem);box-shadow:5px 6px 0 rgb(27 42 74 / 12%);overflow:hidden}
.fin::before{content:'';position:absolute;left:2rem;top:0;bottom:0;width:1.5px;background:var(--nb-margin-ink)}
.fin > *{position:relative}
.fin-top{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--nb-s5);align-items:center}
.bigtime{font-family:var(--nb-font-hand);font-weight:700;font-size:clamp(4rem,7vw,6.5rem);line-height:.9;color:var(--nb-navy)}
.newbest{display:inline-block;background:var(--nb-gold);color:var(--nb-navy);font-family:var(--nb-font-hand);font-weight:700;font-size:1.5rem;padding:.1rem .9rem;border-radius:8px;transform:rotate(-2deg);box-shadow:2px 3px 0 rgb(27 42 74 / 15%);border:1.75px solid var(--nb-navy)}
.confetti{position:absolute;inset:0;pointer-events:none}
.cps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--nb-s4)}
.cpx{border-radius:4px 4px 16px 4px;padding:var(--nb-s3) var(--nb-s4);border:2px solid;display:flex;flex-direction:column;gap:.3rem}
.cpx.r{border-color:var(--nb-ok);background:var(--nb-ok-soft)}
.cpx.w{border-color:var(--nb-redpen);background:#FFF1EE}
.cpx .h{display:flex;justify-content:space-between;align-items:center;font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem}
.cpx .q{font-family:var(--nb-font-note);font-size:1.15rem;line-height:1.3}
.mv{display:grid;grid-template-columns:minmax(0,1.3fr) auto auto auto;gap:var(--nb-s3);align-items:center;padding:.7rem 0;border-bottom:1.5px dashed var(--nb-border)}
.mv:last-child{border-bottom:0}
.mv .arr{font-family:var(--nb-font-hand);font-weight:700;font-size:1.4rem;color:var(--nb-ink-faint)}
.mv .why{grid-column:1 / -1;font-size:.9rem;color:var(--nb-ink-soft);margin-top:-.2rem}
.fin-act{display:flex;gap:var(--nb-s3);flex-wrap:wrap}
@media (max-width:900px){.cps{grid-template-columns:1fr}.fin-top{grid-template-columns:1fr}.mv{grid-template-columns:1fr auto}}
'''
conf_svg = '''<svg class="confetti" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><g stroke="#1B2A4A" stroke-width="1.6">
<rect x="620" y="30" width="16" height="9" fill="#E8B84A" transform="rotate(20 628 34)"/><rect x="700" y="80" width="14" height="8" fill="#9CC9E8" transform="rotate(-25 707 84)"/><rect x="780" y="26" width="16" height="9" fill="#F3B8C4" transform="rotate(40 788 30)"/><rect x="560" y="110" width="12" height="7" fill="#A8D8B5" transform="rotate(-10 566 113)"/><rect x="860" y="120" width="14" height="8" fill="#E8B84A" transform="rotate(30 867 124)"/><rect x="930" y="40" width="12" height="7" fill="#C7B8EA" transform="rotate(-35 936 43)"/></g>
<g fill="none" stroke-width="2.4" stroke-linecap="round"><path d="M660 150q10-14 22 0t22 0" stroke="#3D6FB8"/><path d="M820 180q10-14 22 0t22 0" stroke="#C9433A"/><path d="M740 140l8 8M748 140l-8 8" stroke="#5FB58A"/></g></svg>'''

hist = '''<svg viewBox="0 0 420 150" style="width:100%;height:auto" role="img" aria-label="Your last five race times">
<g stroke="#E1DACB" stroke-width="1"><path d="M40 20H410M40 55H410M40 90H410M40 125H410"/></g>
<g font-family="Caveat" font-weight="700" font-size="15" fill="#8A93A6"><text x="4" y="24">55 s</text><text x="4" y="59">48 s</text><text x="4" y="94">41 s</text><text x="4" y="129">34 s</text></g>
<path d="M60 40L145 65L230 80L315 89L400 101" fill="none" stroke="#3D6FB8" stroke-width="2.6" stroke-linejoin="round"/>
<g fill="#FFFDF8" stroke="#3D6FB8" stroke-width="2.2"><circle cx="60" cy="40" r="5"/><circle cx="145" cy="65" r="5"/><circle cx="230" cy="80" r="5"/><circle cx="315" cy="89" r="5"/></g>
<circle cx="400" cy="101" r="7" fill="#E8B84A" stroke="#1B2A4A" stroke-width="2"/>
<g font-family="Caveat" font-weight="700" font-size="16" fill="#1B2A4A" text-anchor="middle"><text x="60" y="146">51 s</text><text x="145" y="146">47.5 s</text><text x="230" y="146">44 s</text><text x="315" y="146">42 s</text><text x="400" y="146">39.8 s</text></g>
</svg>'''

finish_body = f'''
<div class="g-top"><a class="back" href="#">{ic("back")} Games</a><span class="g-title">Race Track</span><span class="nb-chip nb-chip--sky">Motion · speed</span>
 <div class="flags"><span class="r">{ic("check")}</span><span class="r">{ic("check")}</span><span class="w">{ic("x")}</span></div></div>
<div class="p45">
 <div class="nb-col">
  <section class="fin">{conf_svg}
   <span class="nb-tape" style="left:46%"></span>
   <div class="fin-top">{saathy("6.5rem","cheer")}
    <div><div class="nb-head__eyebrow">Finish line</div><div class="bigtime">39.8 s</div>
     <div class="row-x" style="margin-top:.5rem"><span class="newbest">New best!</span><span class="note" style="font-size:1.25rem;color:var(--nb-ink-soft)">Your old best was <span class="nb-strike">42 s</span></span></div></div>
    <span class="nb-xp-pop" style="align-self:start">+30 XP</span></div>
   <div class="nb-label" style="margin:var(--nb-s5) 0 var(--nb-s3)">Your checkpoints</div>
   <div class="cps">
    <div class="cpx r"><div class="h"><span>1 · Distance &amp; displacement</span>{ic("check")}</div><div class="q">One lap of a 400 m track. Displacement?</div><span class="nb-meta">You said 0 m · sure</span></div>
    <div class="cpx r"><div class="h"><span>2 · Speed &amp; velocity</span>{ic("check")}</div><div class="q">150 m in 6 s. Average speed?</div><span class="nb-meta">You said 25 m/s · sure</span></div>
    <div class="cpx w"><div class="h"><span>3 · km/h ↔ m/s</span>{ic("x")}</div><div class="q">72 km/h in m/s?</div><span class="nb-meta">You said 259.2 · it's 20 m/s (÷ 3.6)</span></div>
   </div>
   <div class="fin-act" style="margin-top:var(--nb-s5)"><button class="nb-btn nb-btn--primary nb-btn--lg">{ic("refresh")} Race again</button><button class="nb-btn nb-btn--gold nb-btn--lg">Do the 4-min recap</button><button class="nb-btn nb-btn--ghost nb-btn--lg">Back to games</button></div>
  </section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">What this race did for your learning</h3><span class="nb-meta">from your 3 answers</span></div>
   <div class="mv"><span><b>Speed &amp; velocity</b></span><span class="nb-mastery nb-mastery--almost">Almost there</span><span class="arr">→</span><span class="nb-mastery nb-mastery--mastered">Mastered</span><span class="why">Right and sure, for the third time this week.</span></div>
   <div class="mv"><span><b>Distance &amp; displacement</b></span><span class="nb-mastery nb-mastery--mastered">Mastered</span><span class="arr">=</span><span class="nb-meta">still strong</span></div>
   <div class="mv"><span><b>km/h ↔ m/s</b></span><span class="nb-mastery nb-mastery--fix">Let's fix this</span><span class="arr">→</span><span class="nb-chip nb-chip--sand">Recap added</span><span class="why">Multiplied by 3.6 again. A 4-minute recap is waiting in today's plan.</span></div>
  </section>
 </div>
 <aside>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Your times</h3><span class="nb-meta">last 5 races</span></div>{hist}
   <div class="nb-note" style="margin-top:.4rem">11 s faster than your first race. Only you see your times.</div></section>
  <section class="nb-sticky" style="margin:.4rem .3rem"><span class="nb-tape nb-tape--sky" style="width:4.5rem;top:-.6rem"></span><span class="nb-sticky__who">Saathy says</span>
   Two right and sure. The last one was the unit flip again. Do the recap, then race again: you'll be quicker at checkpoint 3.</section>
  <section class="nb-card nb-card--flat"><div class="nb-card__head"><h3 class="nb-h3">Try next</h3></div>
   <div class="nb-row" style="grid-template-columns:auto 1fr auto"><span class="nb-ico nb-ico--phy">{SUBJ["phy"]}</span><div><div class="nb-row__t">Bus Stop Graphs</div><div class="nb-row__s">Motion · d-t graphs</div></div><span class="nb-mastery nb-mastery--new">New</span></div></section>
 </aside>
</div>'''

P('game-checkpoint', 'Race Track', check_body, G_CSS, active='games')
P('game-finish', 'Race Track · finished', finish_body, G_CSS + F_CSS, active='games')
print('ok')
