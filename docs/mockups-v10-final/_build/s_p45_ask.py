from p45 import *

CHK = f'<span class="chk on">{ic("check")}</span>'
CHK0 = '<span class="chk"></span>'

# ---------------------------------------------------------------- 1. snap confirm
photo = '''<svg viewBox="0 0 360 430" class="photo" role="img" aria-label="Your photo of notebook page, question 3">
<defs><linearGradient id="lt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
<pattern id="ru" width="10" height="26" patternUnits="userSpaceOnUse"><path d="M0 25.5H10" stroke="#9FB8DA" stroke-width="1"/></pattern></defs>
<rect width="360" height="430" rx="14" fill="#6E5844"/>
<path d="M0 60 Q180 40 360 70 M0 210 Q170 190 360 220 M0 360 Q190 340 360 370" stroke="#5E4A39" stroke-width="6" fill="none" opacity=".5"/>
<g transform="rotate(-3 180 215)">
 <rect x="34" y="26" width="300" height="384" rx="3" fill="#FBF8F0"/>
 <rect x="34" y="26" width="300" height="384" fill="url(#ru)"/>
 <path d="M74 26V410" stroke="#E7A3A0" stroke-width="1.4"/>
 <g font-family="Patrick Hand" fill="#29457F" font-size="17.5">
  <text x="82" y="70">Q3. A bus starts from rest and</text>
  <text x="82" y="96">reaches 72 km/h in 10 s. Find</text>
  <text x="82" y="122">its acceleration.</text>
  <text x="82" y="174">u = 0,  v = 72 km/h,  t = 10 s</text>
  <text x="82" y="200">a = (v − u) / t</text>
  <text x="96" y="226">= 72 / 10</text>
  <text x="96" y="252">= 7.2 m/s²</text>
  <text x="200" y="252" font-size="22">??</text>
  <text x="82" y="304" font-size="15" fill="#56688F">book ans: 2 m/s² … how?</text>
 </g>
 <path d="M90 262 q40 6 80 -2" stroke="#29457F" stroke-width="1.6" fill="none"/>
 <rect x="34" y="26" width="300" height="384" fill="url(#lt)"/>
</g>
<g stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"><path d="M40 70V40h30"/><path d="M290 40h30v30"/><path d="M320 360v30h-30"/><path d="M70 390H40v-30"/></g>
</svg>'''

snap_css = r'''
.snap{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:var(--nb-s6);align-items:start}
.snap .photo{width:100%;height:auto;display:block;border-radius:14px;box-shadow:3px 4px 0 rgb(27 42 74 / 12%)}
.ph-wrap{position:relative;transform:rotate(-1deg)}
.ph-wrap .nb-tape{top:-.7rem}
.ph-tools{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:var(--nb-s3)}
.read-box{border:2px solid var(--nb-navy);border-radius:4px 16px 16px 16px;background:var(--nb-paper);padding:.2rem var(--nb-s4) .5rem;position:relative}
.read-box .lined{min-height:calc(var(--nb-rule) * 6);padding-top:.15rem}
.unsure{background:linear-gradient(180deg,transparent 55%,#FCE7B8 55%);border-bottom:2px dotted var(--nb-gold-deep);padding:0 .1rem}
.flag-note{position:absolute;right:.8rem;bottom:-1.1rem;transform:rotate(2.5deg);max-width:15rem;font-size:1rem;padding:.35rem .7rem;z-index:2}
.mini-steps{display:flex;gap:var(--nb-s2);align-items:center;font-family:var(--nb-font-hand);font-weight:700;font-size:1.05rem;color:var(--nb-ink-soft);flex-wrap:wrap}
.mini-steps b{display:inline-grid;place-items:center;width:1.6rem;height:1.6rem;border-radius:50%;border:1.5px solid var(--nb-navy);font-size:.95rem;color:var(--nb-navy)}
.mini-steps .on b{background:var(--nb-navy);color:#fff}
.mini-steps .done b{background:var(--nb-ok);border-color:var(--nb-ok);color:#fff}
.mini-steps i{width:1.6rem;height:2px;background:var(--nb-border)}
.mode{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--nb-s3)}
.mode button{border:1.75px solid rgb(27 42 74 / 22%);border-radius:4px 4px 14px 4px;padding:.6rem .8rem;text-align:left;display:flex;flex-direction:column;gap:.1rem}
.mode button:nth-child(1){background:var(--nb-sticky-yellow);transform:rotate(-.5deg)}
.mode button:nth-child(2){background:var(--nb-sticky-blue);transform:rotate(.4deg)}
.mode button:nth-child(3){background:var(--nb-sticky-green);transform:rotate(-.3deg)}
.mode button.is-selected{border:2.5px solid var(--nb-navy);box-shadow:3px 4px 0 rgb(27 42 74 / 16%)}
.mode b{font-family:var(--nb-font-hand);font-size:1.3rem}
.mode span{font-size:.9rem;color:var(--nb-ink-soft)}
@media (max-width:1179px){.snap{grid-template-columns:minmax(0,4fr) minmax(0,7fr);gap:var(--nb-s5)}.sheet{padding:var(--nb-s5) var(--nb-s5) var(--nb-s4) calc(var(--nb-s5) + 1.4rem)}.sheet-head{margin-bottom:var(--nb-s4)}.mode button{padding:.45rem .6rem}.mode b{font-size:1.15rem}}
@media (max-width:760px){.snap{grid-template-columns:1fr}.mode{grid-template-columns:1fr}}
'''
snap_sheet = f'''<section class="sheet">
<span class="nb-tape nb-tape--sky" style="left:44%"></span>
<button class="x" aria-label="Close">{ic("x")}</button>
<div class="sheet-head">{saathy("3.8rem","think")}<div style="flex:1;min-width:0">
  <div class="nb-head__eyebrow">Snap a doubt</div>
  <h2 class="nb-h1" style="font-size:clamp(2rem,2.6vw,2.6rem)">Here's what I read</h2>
  <div class="nb-sub">Fix anything that looks off. Then I'll start on it.</div></div>
  <div class="mini-steps nb-hide-m"><span class="done"><b>{ic("check")}</b> Photo</span><i></i><span class="on"><b>2</b> Check text</span><i></i><span><b>3</b> Ask</span></div>
</div>
<div class="snap">
  <div>
    <div class="ph-wrap"><span class="nb-tape nb-tape--pink" style="left:38%"></span>{photo}</div>
    <div class="ph-tools"><button class="nb-btn nb-btn--ghost nb-btn--sm">{ic("camera")} Retake</button><button class="nb-btn nb-btn--quiet nb-btn--sm">{ic("refresh")} Rotate</button><span class="nb-meta" style="margin-left:auto;align-self:center">1 photo · 1.8 MB</span></div>
  </div>
  <div class="nb-col" style="gap:var(--nb-s4)">
    <div>
      <div class="spread" style="margin-bottom:.4rem"><span class="nb-label">The text I read from the photo</span><span class="nb-chip nb-chip--sand">{ic("pencil")} Tap to edit</span></div>
      <div class="read-box">
        <div class="nb-sticky nb-sticky--pink flag-note"><span class="nb-sticky__who">Not sure</span>Is this <b>72</b> or <b>12</b>? The ink is smudged.</div>
        <div class="lined">A bus starts from rest and reaches <span class="unsure">72</span> km/h in 10 s. Find its acceleration.<br/>My working: u = 0, v = 72 km/h, t = 10 s<br/>a = (v − u) / t = 72 / 10 = 7.2 <span class="unsure">m/s²</span><br/>Book answer says 2 m/s². How?</div>
      </div>
      <div class="nb-meta" style="margin-top:.35rem">2 bits are marked in yellow. I wasn't sure about them.</div>
    </div>
    <div class="row-x"><span class="nb-label">I think this is</span><span class="nb-chip nb-chip--sky">Physics</span><span class="nb-chip nb-chip--sky">Motion</span><span class="nb-chip nb-chip--sky">Acceleration</span><a class="nb-link" href="#">Change</a></div>
    <div><div class="nb-label" style="margin-bottom:.4rem">What should Saathy do?</div>
      <div class="mode"><button class="is-selected"><b>Hint me first</b><span>One nudge, then you try</span></button><button><b>Check my working</b><span>Find where it slipped</span></button><button><b>Explain fully</b><span>Every step, slowly</span></button></div></div>
  </div>
</div>
<div class="sheet-foot">
  <div class="privacy-line">{ic("lock")}<span>Only you can see this photo. It's deleted after 24 hours, and nobody else sees it, not even your teacher.</span></div>
  <div class="row-x"><button class="nb-btn nb-btn--quiet">Type it instead</button><button class="nb-btn nb-btn--primary nb-btn--lg">Looks right, ask Saathy {ic("arrow")}</button></div>
</div>
</section>'''

# ---------------------------------------------------------------- 2. ask my teacher
teach_css = r'''
.sheet.narrow{width:min(50rem,100%)}
.q-quote{background:var(--nb-sticky-yellow);border:1.5px solid rgb(27 42 74 / 18%);border-radius:4px 4px 16px 4px;padding:var(--nb-s3) var(--nb-s4);font-family:var(--nb-font-note);font-size:1.25rem;line-height:1.4;transform:rotate(-.4deg);box-shadow:2px 3px 0 rgb(27 42 74 / 8%)}
.unsure-msg{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--nb-s3);align-items:start;background:var(--nb-cream);border:1.5px dashed var(--nb-border);border-radius:14px;padding:var(--nb-s3) var(--nb-s4)}
.share{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--nb-s4)}
.share ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.35rem}
.share li{display:flex;gap:.5rem;align-items:center;font-size:.98rem}
.share li svg{width:1rem;height:1rem;flex-shrink:0;stroke-width:2.6}
.share .yes svg{stroke:var(--nb-ok)} .share .no svg{stroke:var(--nb-redpen)}
.tcard{display:flex;gap:var(--nb-s3);align-items:center;border:1.75px solid var(--nb-navy);border-radius:14px;padding:var(--nb-s3) var(--nb-s4);background:var(--nb-paper)}
.consent{display:flex;gap:var(--nb-s3);align-items:flex-start;border:2px solid var(--nb-navy);border-radius:12px;padding:var(--nb-s3) var(--nb-s4);background:#F4F8FD}
@media (max-width:700px){.share{grid-template-columns:1fr}}
'''
teach_sheet = f'''<section class="sheet narrow">
<span class="nb-tape" style="left:40%"></span>
<button class="x" aria-label="Close">{ic("x")}</button>
<div class="sheet-head"><div style="flex:1;min-width:0"><div class="nb-head__eyebrow">Still stuck?</div><h2 class="nb-h1" style="font-size:clamp(2rem,2.6vw,2.6rem)">Ask Sharma Ma'am</h2><div class="nb-sub">She'll read your question and reply in this chat.</div></div></div>
<div class="nb-col" style="gap:var(--nb-s4)">
  <div class="unsure-msg">{saathy("2.8rem","think")}<div><div class="hand" style="font-size:1.1rem;color:var(--nb-ink-soft)">Saathy, 9:42 pm</div><div class="nb-text">I'm not sure about this one. Why the book's answer comes out positive depends on which direction it takes as positive. Your teacher can explain how your class does it.</div></div></div>
  <div><div class="spread" style="margin-bottom:.4rem"><span class="nb-label">Your question</span><a class="nb-link" href="#">{ic("pencil")} Edit</a></div>
    <div class="q-quote">Retardation is negative acceleration, right? But in Q12 the book's answer is +2 m/s² for a car that is slowing down. Why is it positive?</div>
    <div class="row-x" style="margin-top:.5rem"><span class="nb-chip nb-chip--sky">Physics · Motion</span><span class="nb-chip nb-chip--sky">Acceleration</span><span class="nb-meta">Chapter exercises · Q12</span></div></div>
  <div class="tcard"><span class="nb-avatar" style="background:var(--nb-sticky-lilac)">S</span><div style="flex:1;min-width:0"><b>Sharma Ma'am</b><div class="nb-meta">Physics · your class teacher for IX-B</div></div><span class="nb-chip nb-chip--green nb-hide-m">Usually replies by next class</span></div>
  <div class="share">
    <div><div class="nb-label" style="margin-bottom:.35rem">Ma'am will see</div><ul class="yes"><li>{ic("check")} Your name and class</li><li>{ic("check")} This question and its chapter</li></ul></div>
    <div><div class="nb-label" style="margin-bottom:.35rem">Ma'am won't see</div><ul class="no"><li>{ic("x")} The rest of your chat</li><li>{ic("x")} Your photos or practice answers</li></ul></div>
  </div>
  <label class="consent">{CHK}<span><b class="hand" style="font-size:1.3rem">Yes, tell my teacher</b><br/><span class="nb-meta">This box starts empty. Nothing is sent until you tick it.</span></span></label>
</div>
<div class="sheet-foot">
  <div class="privacy-line">{ic("bell")}<span>Her reply will show up here and in Notifications.</span></div>
  <div class="row-x"><button class="nb-btn nb-btn--quiet">Not now</button><button class="nb-btn nb-btn--primary nb-btn--lg">{ic("send")} Send to Ma'am</button></div>
</div>
</section>'''

# ---------------------------------------------------------------- 3. doubts-all
doubts_css = r'''
.nb-head{margin-bottom:var(--nb-s5);align-items:flex-end}
.dlist{display:flex;flex-direction:column;gap:var(--nb-s3)}
.wk{font-family:var(--nb-font-hand);font-weight:700;font-size:1.45rem;color:var(--nb-ink-soft);margin:var(--nb-s3) 0 0;display:flex;align-items:center;gap:.6rem}
.wk::after{content:'';flex:1;height:1.5px;background:var(--nb-border)}
.d{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--nb-s3) var(--nb-s4);align-items:center;background:var(--nb-paper);border:1.5px solid var(--nb-border);border-radius:14px;padding:var(--nb-s3) var(--nb-s4)}
.d .t{font-family:var(--nb-font-note);font-size:1.2rem;line-height:1.3;color:var(--nb-navy)}
.d .s{font-size:.88rem;color:var(--nb-ink-soft);margin-top:.15rem;display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
.d .end{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.d.open{border:2px solid var(--nb-navy);box-shadow:3px 4px 0 rgb(27 42 74 / 10%);grid-template-columns:auto minmax(0,1fr) auto}
.d .body{grid-column:2 / -1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--nb-s4)}
.saved-ex{background:var(--nb-cream);border:1.5px solid var(--nb-border);border-radius:12px;padding:var(--nb-s3) var(--nb-s4)}
.reply{border-left:3px solid var(--nb-redpen);padding:.2rem 0 .2rem var(--nb-s3);font-family:var(--nb-font-hand);font-weight:600;font-size:1.3rem;line-height:1.25;color:var(--nb-redpen)}
.st-wait{background:#FFF4CF;color:#8A6410;border-color:#E8C76A}
.cleared{color:var(--nb-ink-faint);font-style:italic}
.flt{display:flex;gap:var(--nb-s3);align-items:center;flex-wrap:wrap;justify-content:space-between;margin-bottom:var(--nb-s2)}
.topic{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.3rem .6rem;align-items:center}
.topic .nb-bar{grid-column:1 / -1;height:.45rem}
@media (max-width:900px){.d .body{grid-template-columns:1fr}.d{grid-template-columns:auto minmax(0,1fr)}.d .end{grid-column:2;justify-content:flex-start}}
'''
def d(subj, text, meta, status, extra=''):
    return f'<div class="d"><span class="nb-ico nb-ico--{subj}">{SUBJ[subj]}</span><div><div class="t">{text}</div><div class="s">{meta}</div></div><div class="end">{status}{extra}</div></div>'
S_SOLVED = f'<span class="nb-chip nb-chip--green">{ic("check")} Solved with Saathy</span>'
S_WAIT = '<span class="nb-chip st-wait">Waiting on Ma\'am</span>'
S_REPLIED = f'<span class="nb-chip nb-chip--red">{ic("mail")} Ma\'am replied</span>'
BM = f'<button class="nb-btn nb-btn--quiet nb-btn--sm" aria-label="Save">{ic("bookmark")}</button>'
BMON = f'<span class="nb-chip nb-chip--sand">{ic("bookmark")} Saved</span>'

open_card = f'''<div class="d open"><span class="nb-ico nb-ico--phy">{SUBJ["phy"]}</span>
<div><div class="t">Why is displacement zero if I ran a full 400 m round the track?</div><div class="s">Motion · Distance &amp; displacement · Tue 7:05 pm · asked Ma'am</div></div>
<div class="end">{S_REPLIED}{BMON}</div>
<div class="body">
  <div class="saved-ex"><div class="spread"><span class="nb-label">Saathy's explanation · saved</span><span class="nb-meta">kept until you remove it</span></div>
    <div class="nb-text" style="margin-top:.3rem">Displacement only cares about <span class="nb-hl">where you start</span> and <span class="nb-hl nb-hl--pink">where you end</span>. One full lap brings you back to the start line, so the straight-line gap is 0 m. Distance still counts every step: 400 m.</div>
    <svg viewBox="0 0 260 80" style="width:100%;max-width:18rem;margin-top:.4rem"><ellipse cx="130" cy="40" rx="110" ry="30" fill="none" stroke="#1B2A4A" stroke-width="2"/><ellipse cx="130" cy="40" rx="92" ry="20" fill="none" stroke="#DDD4C4" stroke-width="1.5"/><circle cx="130" cy="70" r="5" fill="#E8B84A" stroke="#1B2A4A" stroke-width="1.5"/><text x="140" y="66" font-family="Caveat" font-weight="700" font-size="15" fill="#1B2A4A">start = end</text><path d="M40 52 q-6 -14 8 -26" stroke="#3D6FB8" stroke-width="2" fill="none"/><path d="M44 24l5 1-1 5" stroke="#3D6FB8" stroke-width="2" fill="none"/><text x="2" y="14" font-family="Caveat" font-weight="700" font-size="15" fill="#3D6FB8">400 m run</text></svg></div>
  <div><div class="nb-label" style="margin-bottom:.4rem">Sharma Ma'am · Wed 8:10 am</div>
    <div class="reply">Good doubt, Aarav. Think of displacement as an arrow from start to finish. No arrow, no displacement. We'll do the circular track example in class on Thursday.</div>
    <div class="row-x" style="margin-top:var(--nb-s3)"><button class="nb-btn nb-btn--ghost nb-btn--sm">Open the chat</button><button class="nb-btn nb-btn--quiet nb-btn--sm">Try a quick question on it</button></div></div>
</div></div>'''

doubts_body = f'''
<div class="nb-head"><div><div class="nb-head__eyebrow">Ask Saathy</div><h1 class="nb-h1">All my doubts</h1><div class="nb-sub">Everything you've asked, what got solved, and the explanations you saved.</div></div>
<button class="nb-btn nb-btn--primary">{ic("chat")} Ask a new doubt</button></div>
<div class="p45">
 <div class="nb-col">
  <div class="flt"><div class="nb-tabs"><button class="nb-tab is-active">All · 14</button><button class="nb-tab">Waiting on Ma'am · 1</button><button class="nb-tab">Saved · 6</button></div>
   <div class="nb-tabs"><button class="nb-chip nb-chip--sky">All subjects</button><button class="nb-chip">Physics</button><button class="nb-chip">Chemistry</button><button class="nb-chip">Biology</button><button class="nb-chip">Maths</button></div></div>
  <div class="dlist">
   <div class="wk">This week</div>
   {d('phy','why is 36 km/h only 10 m/s?? it feels like it should be bigger','Motion · Speed &amp; velocity · Today 6:12 pm · from Practice Q4',S_SOLVED,BMON)}
   {d('phy','Retardation is negative acceleration, but the book says +2 m/s² for a car slowing down. Why positive?','Motion · Acceleration · Thu 9:42 pm · sent to Sharma Ma\'am',S_WAIT)}
   {d('chem','How do I know the valency of sulphate? It is not in the table','Atoms and Molecules · Writing formulae · Thu 5:30 pm',S_SOLVED,BMON)}
   {open_card}
   {d('math','Is x² + 1/x a polynomial? It has x in it','Polynomials · What is a polynomial · Mon 8:20 pm',S_SOLVED,BM)}
   <div class="wk">Last week</div>
   {d('bio','Why does a plant cell need a cell wall if it already has a membrane?','The Cell · Cell wall · 21 Oct','<span class="nb-chip">'+ic("check")+' Solved</span>','<span class="nb-meta cleared">chat cleared</span>')}
   {d('chem','What is the difference between an atom and a molecule of oxygen?','Atoms and Molecules · Atoms vs molecules · 20 Oct','<span class="nb-chip">'+ic("check")+' Solved</span>',BMON)}
   {d('math','Zero of p(x) = 2x + 3? I got 3/2','Polynomials · Zeroes of a polynomial · 19 Oct','<span class="nb-chip">'+ic("check")+' Solved</span>','<span class="nb-meta cleared">chat cleared</span>')}
  </div>
  <button class="nb-btn nb-btn--ghost" style="align-self:center">Show older doubts</button>
 </div>
 <aside>
  <section class="nb-sticky nb-sticky--blue" style="margin:.4rem .3rem"><span class="nb-tape nb-tape--sky" style="width:4.5rem;top:-.6rem"></span><span class="nb-sticky__who">Saved explanations</span>
   <div style="display:flex;flex-direction:column;gap:.35rem;margin-top:.3rem"><div>÷ 3.6 trick for km/h → m/s</div><div>Displacement on a round track</div><div>Crossing valencies: Al₂O₃</div><div>Distance vs. displacement</div><div>Why the nucleus is the boss</div><div>Degree of a polynomial</div></div>
   <a class="nb-link" href="#" style="display:inline-block;margin-top:.5rem">See all 6</a></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">What I ask about</h3><span class="nb-meta">last 30 days</span></div>
   <div class="nb-col" style="gap:.7rem">
    <div class="topic"><span>Motion</span><span class="nb-meta">6 doubts</span><div class="nb-bar"><i style="width:86%"></i></div></div>
    <div class="topic"><span>Atoms and Molecules</span><span class="nb-meta">4</span><div class="nb-bar"><i style="width:57%"></i></div></div>
    <div class="topic"><span>Polynomials</span><span class="nb-meta">3</span><div class="nb-bar"><i style="width:43%"></i></div></div>
    <div class="topic"><span>The Cell</span><span class="nb-meta">1</span><div class="nb-bar"><i style="width:14%"></i></div></div>
   </div>
   <div class="nb-note" style="margin-top:.6rem">Lots of Motion doubts? Saathy added a short recap on km/h ↔ m/s to your plan.</div></section>
  <section class="nb-card nb-card--flat"><div class="nb-saathy-tip">{saathy("3.4rem","happy")}<div><div class="nb-h3" style="font-size:1.25rem">Where chats go</div><div class="nb-text" style="font-size:.95rem">Chats clear after 24 hours. The question stays in this list, and anything you saved stays until you remove it. Only you can see this page.</div></div></div></section>
 </aside>
</div>'''

over_ask('ask-snap-confirm', 'Check your photo', snap_sheet, snap_css)
over_ask('ask-teacher-sheet', "Ask my teacher", teach_sheet, teach_css)
P('doubts-all', 'All my doubts', doubts_body, doubts_css, active='ask')
print('ok')
