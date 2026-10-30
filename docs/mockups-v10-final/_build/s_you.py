from lib import *
def ring(p,col,label,size='5.2rem'):
    c=100.5; return f'<svg style="width:{size};height:{size}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" stroke="#EDE6D9" stroke-width="4.5" fill="none"/><circle cx="20" cy="20" r="16" stroke="{col}" stroke-width="4.5" fill="none" stroke-dasharray="{c*p/100:.1f} {c}" transform="rotate(-90 20 20)" stroke-linecap="round"/><text x="20" y="23.5" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="10" fill="#1B2A4A">{label}</text></svg>'
# ---------- PROGRESS ----------
pcss=r'''
.pr-rings{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:var(--nb-s3)}
.pr-ring{display:flex;flex-direction:column;align-items:center;gap:.35rem;text-align:center;padding:var(--nb-s3) var(--nb-s2);border-radius:14px;background:var(--nb-cream-soft);border:1.5px solid var(--nb-border)}
.pr-ring b{font-family:var(--nb-font-hand);font-size:1.3rem;line-height:1}
.cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.4rem;text-align:center}
.cal .h{font-family:var(--nb-font-hand);font-weight:700;color:var(--nb-ink-soft)}
.cal .d{aspect-ratio:1.25;border-radius:10px;display:grid;place-items:center;font-family:var(--nb-font-ui);font-size:.85rem;border:1px solid var(--nb-border);background:#fff;position:relative}
.cal .d.s{background:var(--nb-gold);border-color:var(--nb-gold-deep);font-weight:700}
.cal .d.l{background:var(--nb-sticky-yellow)}
.cal .d.t{outline:2.5px solid var(--nb-navy);outline-offset:1px}
.cal .d.o{opacity:.35;background:transparent}
.cc{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:var(--nb-s3);align-items:center;padding:.55rem 0;border-bottom:1px dashed var(--nb-border)}
.cc:last-child{border:0}.cc b{font-family:var(--nb-font-hand);font-size:1.2rem;font-weight:700}
.conf-m{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--nb-s2);margin-top:.4rem}
.conf-m div{border-radius:12px;padding:.6rem;text-align:center;font-family:var(--nb-font-hand);font-weight:700;font-size:1.1rem}
.conf-m b{display:block;font-size:2rem;line-height:1}
@media (max-width:1023px){.pr-rings{grid-template-columns:repeat(3,1fr)}}
'''
R=[('phy','Physics',38,'#3D6FB8','almost','Almost there'),('chem','Chemistry',40,'#D9823B','fix',"Let's fix this"),('bio','Biology',25,'#5A9A62','new','New'),('math','Maths',80,'#6B5CA5','top','Top form'),('eng','English',33,'#C99A2E','almost','Almost there'),('sst','Social Sci.',71,'#C9433A','mastered','Mastered')]
rings=''.join(f'<div class="pr-ring">{ring(p,c,str(p)+"%")}<b>{n}</b><span class="nb-mastery nb-mastery--{m}">{mw}</span></div>' for k,n,p,c,m,mw in R)
days=''
lit={1,2,5,6,7,8,9,12,13,14,15,19,20,21,22,26,27,28,29,30}; streak={26,27,28,29,30}
for i in range(4): days+=f'<div class="d o">{28+i}</div>'
for d in range(1,32):
    cls='s' if d in streak else ('l' if d in lit else '')
    if d==30: cls+=' t'
    days+=f'<div class="d {cls}">{d}</div>'
cc=''.join(f'<div class="cc"><div><b>{t}</b><div class="nb-meta">{s}</div></div><span class="nb-mastery nb-mastery--{m}">{mw}</span><a class="nb-link" style="font-size:.95rem" href="#">{a}</a></div>' for t,s,m,mw,a in [
 ('Speed &amp; velocity','Physics · km/h to m/s slips','fix',"Let's fix this",'Fix it'),('Valency','Chemistry · 2 wrong Monday','fix',"Let's fix this",'Fix it'),('Acceleration','Physics · lesson in progress','almost','Almost there','Continue'),('Remainder theorem','Maths · 10/10 last check','top','Top form','Harder set'),('Distance &amp; displacement','Physics','mastered','Mastered','Review')])
body=f'''<div class="nb-grid">
<div class="nb-col">
 <div class="nb-head"><h1 class="nb-h1">My progress</h1>{scribble()}<p class="nb-sub">October so far · you vs. you, nobody else</p></div>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Subjects</h3><span class="nb-meta">% of this term's ideas you've got</span></div><div class="pr-rings">{rings}</div></section>
 <div class="nb-grid nb-grid--halves" style="min-height:0;flex:1">
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">October</h3><span class="nb-chip nb-chip--orange">{ic("flame")} 5-day streak</span></div>
   <div class="cal"><div class="h">M</div><div class="h">T</div><div class="h">W</div><div class="h">T</div><div class="h">F</div><div class="h">S</div><div class="h">S</div>{days}</div>
   <div class="nb-meta" style="margin-top:.6rem">Gold = streak days · yellow = studied · 20 days this month</div></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Ideas to look at</h3><a class="nb-link" style="font-size:1rem" href="#">All 46 {ic("arrow")}</a></div>{cc}</section>
 </div>
</div>
<aside class="nb-col">
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Time this week</h3></div><div style="display:flex;align-items:baseline;gap:.5rem"><span class="nb-h1" style="font-size:3rem">2 h 27 m</span><span class="nb-chip nb-chip--green">+18 m</span></div>
  <svg viewBox="0 0 210 70" style="width:100%;margin-top:.4rem">{''.join(f'<rect x="{8+i*29}" y="{60-h}" width="18" height="{h}" rx="4" fill="{"#E8B84A" if i==4 else "#C9D9EE"}" stroke="#1B2A4A" stroke-width="1.2"/><text x="{17+i*29}" y="69" font-family="Caveat" font-size="9" text-anchor="middle" fill="#3A4A6B">{d}</text>' for i,(d,h) in enumerate(zip("MTWTFSS",[30,22,40,18,44,0,0])))}</svg></section>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">How sure vs. how right</h3></div><div class="conf-m">
  <div style="background:var(--nb-c-sure-soft);color:#1F6B47"><b>86%</b>right when Sure</div><div style="background:var(--nb-c-unsure-soft);color:#8A5D00"><b>61%</b>when Unsure</div><div style="background:var(--nb-c-guess-soft);color:#5A45A8"><b>34%</b>when Guess</div></div>
  <div class="nb-text" style="margin-top:.6rem">Your gut is pretty reliable. Watch the "sure but wrong" ones: 3 this week, all unit slips.</div></section>
 <section class="nb-sticky nb-sticky--green" style="margin:.4rem .3rem"><span class="nb-tape" style="width:4.5rem;top:-.6rem"></span><span class="nb-sticky__who" style="color:#2F6B3F">Saathy noticed</span>You study best around 6 pm, and your Maths jumped two levels this month.</section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Wins this month</h3></div>
  <div class="nb-row" style="grid-template-columns:auto 1fr"><span class="nb-strip__node is-right">{ic("star")}</span><div><div class="nb-row__t" style="font-size:1.1rem">Polynomials reached Top form</div><div class="nb-row__s">Maths · 24 Oct</div></div></div>
  <div class="nb-row" style="grid-template-columns:auto 1fr"><span class="nb-strip__node is-right">{ic("check")}</span><div><div class="nb-row__t" style="font-size:1.1rem">12 ideas mastered</div><div class="nb-row__s">up from 7 in September</div></div></div>
  <div class="nb-row" style="grid-template-columns:auto 1fr"><span class="nb-strip__node is-right">{ic("flame")}</span><div><div class="nb-row__t" style="font-size:1.1rem">Longest streak: 6 days</div><div class="nb-row__s">12 to 17 Oct</div></div></div>
  <div style="display:flex;justify-content:flex-end;margin-top:.4rem">{saathy("3.4rem","cheer")}</div></section>
</aside></div>'''
page('progress','My progress',body,pcss,active='progress')

# ---------- HOMEWORK ----------
hcss=r'''
.hw{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--nb-s3);align-items:center;padding:var(--nb-s3);border-radius:14px;border:1.5px solid var(--nb-border);background:#fff;margin-bottom:var(--nb-s2)}
.hw.on{border:2px solid var(--nb-navy);background:var(--nb-sticky-yellow);box-shadow:2px 3px 0 rgb(27 42 74 / 10%)}
.hw b{font-family:var(--nb-font-hand);font-size:1.3rem;font-weight:700;line-height:1.05}
.ws h2{font-family:var(--nb-font-hand);font-weight:700;font-size:2.2rem;line-height:1}
.wq{border-top:1.5px dashed var(--nb-border);padding-top:var(--nb-s4);margin-top:var(--nb-s4)}
.wq .q{font-family:var(--nb-font-ui);font-weight:500;font-size:1.02rem;line-height:1.5}
.ans{margin-top:var(--nb-s2);min-height:5.6rem;border-radius:12px;border:1.5px solid var(--nb-border);padding:0 var(--nb-s3);font-family:var(--nb-font-note);font-size:1.2rem;line-height:var(--nb-rule);background:#fff repeating-linear-gradient(180deg,transparent 0,transparent calc(var(--nb-rule) - 1px),var(--nb-rule-ink) calc(var(--nb-rule) - 1px),var(--nb-rule-ink) var(--nb-rule))}
.back-mark{font-family:var(--nb-font-hand);font-weight:700;color:var(--nb-redpen);font-size:1.6rem;transform:rotate(-6deg);display:inline-block}
'''
todo=[('chem','Atoms and Molecules · sheet 2','Chemistry · Mr. Iyer · 6 questions','red','Overdue',True),('phy','Motion · numericals set A','Physics · Sharma Ma\'am · 8 questions','orange','Today 9 pm',False),('math','Polynomials · practice quiz','Maths · Mr. Khan · 10 questions','sand','Fri 6 Nov',False)]
todo_h=''.join(f'<div class="hw{" on" if on else ""}"><div class="nb-ico nb-ico--{k}">{SUBJ[k]}</div><div><b>{t}</b><div class="nb-meta">{s}</div></div><span class="nb-chip nb-chip--{c}">{d}</span></div>' for k,t,s,c,d,on in todo)
back=''.join(f'<div class="hw"><div class="nb-ico nb-ico--{k}">{SUBJ[k]}</div><div><b>{t}</b><div class="nb-meta">{s}</div></div><span class="back-mark">{m}</span></div>' for k,t,s,m in [('math','Number systems · test','Maths · "Neat working!"','9/10'),('eng','The Fun They Had · answers','English · "Good use of quotes"','8/10')])
body=f'''<div class="nb-grid nb-grid--5-7">
<div class="nb-col">
 <div class="nb-head"><h1 class="nb-h1">Homework</h1>{scribble()}<p class="nb-sub">3 to do · 2 handed back this week</p></div>
 <div class="nb-tabs" style="align-self:flex-start"><button class="nb-tab is-active">To do · 3</button><button class="nb-tab">Handed back · 2</button><button class="nb-tab">Done</button></div>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">To do</h3></div>{todo_h}</section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Handed back</h3><span class="nb-meta">marked in red pen</span></div>{back}
  <div class="nb-sticky nb-sticky--blue" style="margin-top:1rem;transform:rotate(.8deg)"><span class="nb-sticky__who" style="color:var(--nb-blue)">Mr. Khan</span>Q7: show the step where you rationalise the denominator.</div></section>
</div>
<section class="nb-card ws" style="display:flex;flex-direction:column"><span class="nb-tape"></span>
 <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem"><div><span class="nb-chip nb-chip--red">Overdue · was due Wed 28 Oct</span><h2 style="margin-top:.5rem">Atoms and Molecules · sheet 2</h2><div class="nb-meta">Chemistry · Mr. Iyer · question 2 of 6</div></div><div class="nb-saathy-tip" style="max-width:15rem">{saathy("3.2rem","think")}<div class="nb-text">Hints only here. Your teacher wants your own working.</div></div></div>
 <div class="nb-strip" style="margin-top:1rem"><div class="nb-strip__node is-right">{ic("check")}</div><svg class="nb-strip__link is-done" viewBox="0 0 40 10" preserveAspectRatio="none"><path d="M0 5 Q10 1 20 5 T40 5"/></svg><div class="nb-strip__node is-current">2</div>{''.join(f'<svg class="nb-strip__link" viewBox="0 0 40 10" preserveAspectRatio="none"><path d="M0 5 Q10 1 20 5 T40 5"/></svg><div class="nb-strip__node">{i}</div>' for i in range(3,7))}</div>
 <div class="wq"><div class="q"><b>Q2.</b> Write the formula of <span class="nb-hl">aluminium sulphate</span>. Show how you crossed the valencies.</div><div class="ans">Al has valency 3, SO₄ has valency 2<br/>cross them: Al₂(SO₄)₃</div></div>
 <div class="wq"><div class="q"><b>Q3.</b> Calculate the molecular mass of H₂SO₄. (H = 1 u, S = 32 u, O = 16 u)</div><div class="ans" style="color:var(--nb-ink-faint)">Write your working here…</div></div>
 <div style="display:flex;gap:.6rem;margin-top:var(--nb-s4)"><button class="nb-btn nb-btn--quiet">{ic("camera")} Add a photo of my working</button></div>
 <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:var(--nb-s4)"><button class="nb-btn nb-btn--ghost">{ic("back")} Q1</button><span class="nb-meta">Saved 2 min ago</span><button class="nb-btn nb-btn--primary nb-btn--lg">Next question {ic("arrow")}</button></div>
</section></div>'''
page('homework','Homework',body,hcss,active='homework')

# ---------- ASK ----------
acss=r'''
.chat{display:flex;flex-direction:column;min-height:100%;gap:var(--nb-s4)}
.thread{flex:1;display:flex;flex-direction:column;gap:var(--nb-s4)}
.msg{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--nb-s3);align-items:start;max-width:46rem}
.msg.me{align-self:flex-end;grid-template-columns:minmax(0,1fr) auto}
.msg .b{background:var(--nb-paper);border:1.75px solid var(--nb-navy);border-radius:4px 18px 18px 18px;padding:var(--nb-s3) var(--nb-s4);font-size:1rem;line-height:1.5;box-shadow:2px 2px 0 rgb(27 42 74 / 8%)}
.msg.me .b{background:var(--nb-sticky-yellow);border-radius:18px 4px 18px 18px;font-family:var(--nb-font-note);font-size:1.2rem;line-height:1.35}
.msg .meta{font-family:var(--nb-font-hand);font-weight:600;font-size:.95rem;color:var(--nb-ink-soft);margin-bottom:.2rem}
.mini-q{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.6rem}.mini-q span{padding:.4rem .9rem;border-radius:10px;border:1.5px solid var(--nb-navy);background:#fff;font-weight:600;font-size:.9rem}
.chat .nb-tabs{flex-wrap:nowrap;white-space:nowrap}
.composer{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--nb-s3);align-items:center;background:var(--nb-paper);border:2px solid var(--nb-navy);border-radius:var(--nb-radius-sketch);padding:var(--nb-s3) var(--nb-s4);box-shadow:var(--nb-shadow)}
.doubt{padding:.6rem 0;border-bottom:1px dashed var(--nb-border)}.doubt:last-child{border:0}.doubt b{font-family:var(--nb-font-hand);font-size:1.15rem;font-weight:700;display:block;line-height:1.1}
'''
bus='''<svg viewBox="0 0 260 90" style="width:100%;max-width:22rem;margin:.6rem 0;display:block"><rect width="260" height="90" rx="10" fill="#FAF6EF" stroke="#DDD4C4"/><path d="M20 60H240" stroke="#1B2A4A" stroke-width="2"/><path d="M20 52v16M240 52v16" stroke="#1B2A4A" stroke-width="2"/><text x="130" y="80" font-family="Caveat" font-size="16" font-weight="700" text-anchor="middle" fill="#3D6FB8">36 km = 36 000 m</text><text x="130" y="44" font-family="Caveat" font-size="16" font-weight="700" text-anchor="middle" fill="#C9433A">in 1 h = 3600 s</text><path d="M60 30 q70 -22 140 0" stroke="#E8B84A" stroke-width="2.4" fill="none" stroke-dasharray="5 4"/></svg>'''
body=f'''<div class="nb-grid">
<div class="chat">
 <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:1rem"><div class="nb-head" style="margin:0"><h1 class="nb-h1">Ask Saathy</h1>{scribble()}<p class="nb-sub">Hints first. You do the thinking, I'll keep you on track.</p></div>
  <div class="nb-tabs"><button class="nb-tab is-active">{ic("bulb")} Hints mode</button><button class="nb-tab">Explain fully</button></div></div>
 <div class="thread">
  <div class="msg me"><div><div class="meta" style="text-align:right">You · 6:12 pm · from Practice Q4</div><div class="b">why is 36 km/h only 10 m/s?? it feels like it should be bigger</div></div><span class="nb-avatar">A</span></div>
  <div class="msg">{saathy("3rem","think")}<div><div class="meta">Saathy</div><div class="b">Good question to ask. Think about how big each unit is. A <span class="nb-hl">kilometre</span> is 1000 metres, and an <span class="nb-hl nb-hl--pink">hour</span> is 3600 seconds.{bus}So in one second the car covers 36 000 ÷ 3600 metres. What does that come to?</div></div></div>
  <div class="msg me"><div><div class="meta" style="text-align:right">You · 6:13 pm</div><div class="b">10! oh so the seconds part is what shrinks it</div></div><span class="nb-avatar">A</span></div>
  <div class="msg">{saathy("3rem","cheer")}<div><div class="meta">Saathy</div><div class="b">Exactly. That's why the shortcut is <b>÷ 3.6</b>. Want to try one on your own?
   <div class="nb-q__label" style="margin:.7rem 0 .2rem"><span class="nb-label">Quick try</span></div><div>Convert <b>54 km/h</b> to m/s.</div><div class="mini-q"><span>15 m/s</span><span>194.4 m/s</span><span>5.4 m/s</span></div></div></div></div>
 </div>
 <div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="nb-chip nb-chip--sky">Give me another</button><button class="nb-chip nb-chip--sky">Why 3.6 exactly?</button><button class="nb-chip nb-chip--sky">Show m/s to km/h</button></div>
 <div class="composer"><button class="nb-btn nb-btn--quiet nb-btn--sm">{ic("camera")}</button><div class="nb-text" style="color:var(--nb-ink-faint);font-family:var(--nb-font-note);font-size:1.15rem">Ask a doubt, or snap your notebook…</div><button class="nb-btn nb-btn--primary">{ic("send")} Send</button></div>
</div>
<aside class="nb-col">
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Recent doubts</h3><a class="nb-link" href="#" style="font-size:1rem">All</a></div>
  <div class="doubt"><b>km/h to m/s</b><span class="nb-meta">Physics · now</span></div><div class="doubt"><b>Why is valency of O = 2?</b><span class="nb-meta">Chemistry · Mon</span></div><div class="doubt"><b>Displacement can be zero?</b><span class="nb-meta">Physics · Sat</span></div><div class="doubt"><b>Factor theorem steps</b><span class="nb-meta">Maths · Thu</span></div></section>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Talking about</h3></div><div class="nb-row" style="grid-template-columns:auto 1fr;padding:0"><div class="nb-ico nb-ico--phy">{SUBJ["phy"]}</div><div><div class="nb-row__t" style="font-size:1.15rem">Speed &amp; velocity</div><div class="nb-row__s">Physics · Ch 8 Motion</div></div></div></section>
 <section class="nb-sticky nb-sticky--lilac" style="margin:.4rem .3rem"><span class="nb-tape nb-tape--pink" style="width:4.5rem;top:-.6rem"></span><span class="nb-sticky__who" style="color:#5A45A8">How Saathy helps</span>1. Asks what you already know<br/>2. Gives one hint at a time<br/>3. Lets you finish the step<br/><br/>Your chats stay private. Teachers and parents only see which topics you asked about.</section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Saved explanations</h3><span class="nb-meta">3</span></div>
  <div class="doubt"><b>÷ 3.6 trick</b><span class="nb-meta">km/h to m/s · saved today</span></div><div class="doubt"><b>Crossing valencies</b><span class="nb-meta">Chemistry · saved Mon</span></div><div class="doubt"><b>Distance vs. displacement</b><span class="nb-meta">Physics · saved 22 Oct</span></div></section>
</aside></div>'''
page('ask','Ask Saathy',body,acss,active='ask')
