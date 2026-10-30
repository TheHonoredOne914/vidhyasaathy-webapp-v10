from lib import *
bell = f'<button class="nb-bell" aria-label="Notifications">{ic("bell")}<i></i></button>'
# ---------- TEACHER ----------
tcss=r'''
.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--nb-s4)}
.kpi{padding:var(--nb-s4)}.kpi b{display:block;font-family:var(--nb-font-hand);font-weight:700;font-size:2.6rem;line-height:1}
.heat{display:grid;grid-template-columns:12rem repeat(5,minmax(0,1fr));gap:.35rem;align-items:center;font-size:.85rem}
.heat .h{font-family:var(--nb-font-hand);font-weight:700;font-size:1rem;color:var(--nb-ink-soft);text-align:center}
.heat .n{font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem}
.heat .c{height:2.2rem;border-radius:8px;display:grid;place-items:center;font-weight:600;border:1px solid rgb(27 42 74 / 10%)}
.rv{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--nb-s3);align-items:center;padding:.6rem 0;border-bottom:1px dashed var(--nb-border)}
.rv:last-child{border:0}.rv b{font-family:var(--nb-font-hand);font-size:1.15rem;font-weight:700;display:block;line-height:1.1}
.stu{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:.7rem;align-items:center;padding:.5rem 0;border-bottom:1px dashed var(--nb-border)}
.stu:last-child{border:0}.stu .nb-avatar{width:2.1rem;height:2.1rem;font-size:1rem}
@media (max-width:1023px){.kpis{grid-template-columns:1fr 1fr}.heat{grid-template-columns:8rem repeat(5,1fr)}}
'''
cols=['#F5D3CE','#FCE7B8','#FFF4CF','#DDEFD9','#C6E6CF']
def hc(v):
    i=0 if v<40 else 1 if v<55 else 2 if v<70 else 3 if v<85 else 4
    return f'<div class="c" style="background:{cols[i]}">{v}%</div>'
rows=[('Distance &amp; displacement',[88,91,84,79,93]),('Speed &amp; velocity',[72,64,58,70,81]),('km/h ↔ m/s',[41,36,52,30,48]),('Reading d-t graphs',[66,59,71,62,74]),('Acceleration (new)',[0,0,0,0,0])]
heat='<div></div>'+''.join(f'<div class="h">Group {g}</div>' for g in 'ABCDE')
for n,vs in rows:
    heat+=f'<div class="n">{n}</div>'+(''.join('<div class="c" style="background:#EEF3FA;color:#3D6FB8;border-style:dashed">New</div>' for _ in vs) if not vs[0] else ''.join(hc(v) for v in vs))
body=f'''<div class="nb-grid nb-grid--wide-rail">
<div class="nb-col">
 <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;flex-wrap:wrap"><div class="nb-head" style="margin:0;flex-direction:column;align-items:flex-start;gap:.2rem"><div class="nb-head__eyebrow">Friday, 30 Oct · Class IX-B · Physics</div><h1 class="nb-h1" style="white-space:nowrap">Good afternoon, Sharma Ma'am</h1>{scribble()}</div>
  <div style="display:flex;gap:.6rem"><button class="nb-btn nb-btn--ghost">{ic("plus")} New homework</button><button class="nb-btn nb-btn--primary">{ic("play")} Start session 3</button></div></div>
 <div class="kpis">
  <section class="nb-card kpi"><span class="nb-label">Diagnostic done</span><b>28 / 34</b><div class="nb-bar" style="margin-top:.5rem"><i style="width:82%"></i></div><div class="nb-meta" style="margin-top:.3rem">6 yet to start</div></section>
  <section class="nb-card kpi"><span class="nb-label">Handed in</span><b>25 / 34</b><div class="nb-meta">Numericals set A · due 9 pm</div></section>
  <section class="nb-card kpi"><span class="nb-label">Studied this week</span><b>31</b><div class="nb-meta">avg 2 h 05 m each</div></section>
  <section class="nb-card kpi" style="background:#FFF6F3;border-color:var(--nb-redpen)"><span class="nb-label" style="color:var(--nb-redpen)">Common mistake</span><b style="color:var(--nb-redpen)">11</b><div class="nb-meta">multiplied by 3.6 instead of dividing</div></section>
 </div>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Class mastery · Motion</h3><div class="nb-tabs"><button class="nb-tab is-active">By group</button><button class="nb-tab">By student</button></div></div>
  <div class="heat">{heat}</div>
  <div class="nb-sticky" style="margin-top:1.2rem;max-width:40rem;transform:rotate(-.6deg)"><span class="nb-sticky__who">Saathy suggests</span>Open session 3 with a 4-minute km/h ↔ m/s recap. 11 students slipped on it, 7 of them while marking "Sure".</div></section>
</div>
<aside class="nb-col">
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Lesson review</h3><span class="nb-chip nb-chip--orange">3 waiting</span></div>
  <div class="rv"><span class="nb-ico nb-ico--phy">{SUBJ["phy"]}</span><div><b>Acceleration · notes</b><span class="nb-meta">Generated · 8 blocks · 1 flagged</span></div><button class="nb-btn nb-btn--primary nb-btn--sm">Review</button></div>
  <div class="rv"><span class="nb-ico nb-ico--phy">{SUBJ["phy"]}</span><div><b>Acceleration · 12 questions</b><span class="nb-meta">Generated · checks answers</span></div><button class="nb-btn nb-btn--ghost nb-btn--sm">Review</button></div>
  <div class="rv"><span class="nb-ico nb-ico--phy">{SUBJ["phy"]}</span><div><b>Video clip · 3:12 to 5:40</b><span class="nb-meta">Acceleration, explained with a cycle</span></div><button class="nb-btn nb-btn--ghost nb-btn--sm">Watch</button></div></section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Could use a nudge</h3><span class="nb-meta">private to you</span></div>
  <div class="stu"><span class="nb-avatar" style="background:#FBE3D6">R</span><div><b class="nb-row__t" style="font-size:1.1rem">Riya Kapoor</b><div class="nb-meta">No diagnostic yet · last active Tue</div></div><button class="nb-btn nb-btn--quiet nb-btn--sm">Nudge</button></div>
  <div class="stu"><span class="nb-avatar" style="background:#DCEAF6">K</span><div><b class="nb-row__t" style="font-size:1.1rem">Kabir Singh</b><div class="nb-meta">3 unit slips this week</div></div><button class="nb-btn nb-btn--quiet nb-btn--sm">Nudge</button></div>
  <div class="stu"><span class="nb-avatar" style="background:#ECE6FA">M</span><div><b class="nb-row__t" style="font-size:1.1rem">Meera Iyer</b><div class="nb-meta">Homework overdue · Chemistry</div></div><button class="nb-btn nb-btn--quiet nb-btn--sm">Nudge</button></div>
  <div class="stu"><span class="nb-avatar" style="background:#E4F1E2">D</span><div><b class="nb-row__t" style="font-size:1.1rem">Dev Patel</b><div class="nb-meta">Many guesses on d-t graphs</div></div><button class="nb-btn nb-btn--quiet nb-btn--sm">Nudge</button></div></section>
</aside></div>'''
page('teacher-home','Teacher home',body,tcss,active='home',role='teacher',who=('S',"Sharma Ma'am",'Physics · IX-A, IX-B'),top_extra=bell)

# ---------- PARENT ----------
pcss=r'''
.pk{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--nb-s4)}
.pk .nb-card b{display:block;font-family:var(--nb-font-hand);font-weight:700;font-size:2.4rem;line-height:1}
.sb{display:grid;grid-template-columns:auto 8rem minmax(0,1fr) 8.5rem;gap:var(--nb-s3);align-items:center;padding:.55rem 0;border-bottom:1px dashed var(--nb-border)}
.sb>.nb-mastery{justify-self:end}.sb:last-child{border:0}.sb b{font-family:var(--nb-font-hand);font-size:1.2rem;font-weight:700}
.rem{padding:.7rem 0;border-bottom:1px dashed var(--nb-border)}.rem:last-child{border:0}
@media (max-width:1023px){.pk{grid-template-columns:1fr}.sb{grid-template-columns:auto 1fr auto}.sb .nb-bar{display:none}}
'''
subj=[('phy','Physics','#3D6FB8',38,'almost','Almost there'),('chem','Chemistry','#D9823B',40,'fix',"Let's fix this"),('bio','Biology','#5A9A62',25,'new','New'),('math','Maths','#6B5CA5',80,'top','Top form'),('eng','English','#C99A2E',33,'almost','Almost there'),('sst','Social Science','#C9433A',71,'mastered','Mastered')]
sbs=''.join(f'<div class="sb"><span class="nb-ico nb-ico--{k}">{SUBJ[k]}</span><b>{n}</b><div class="nb-bar"><i style="width:{p}%;background:{c}"></i></div><span class="nb-mastery nb-mastery--{m}">{mw}</span></div>' for k,n,c,p,m,mw in subj)
body=f'''<div class="nb-grid">
<div class="nb-col">
 <div class="nb-head" style="margin:0;flex-direction:column;align-items:flex-start;gap:.2rem"><div class="nb-head__eyebrow">Week of 26 to 30 Oct</div><h1 class="nb-h1">Aarav's week</h1>{scribble()}</div>
 <p class="nb-sub" style="margin-top:-.6rem">Class 9-B · Delhi Public School · a calm, steady week</p>
 <div class="pk">
  <section class="nb-card"><span class="nb-label">Time studied</span><b>2 h 27 m</b><div class="nb-meta">18 min more than last week</div></section>
  <section class="nb-card"><span class="nb-label">Homework</span><b>4 of 5</b><div class="nb-meta">1 Chemistry sheet overdue</div></section>
  <section class="nb-card"><span class="nb-label">Days studied</span><b>5 in a row</b><div class="nb-meta">mostly around 6 pm</div></section>
 </div>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Subjects</h3><span class="nb-meta">how much of this term he's got</span></div>{sbs}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--nb-s4);margin-top:auto;padding-top:var(--nb-s4)">
   <div class="nb-sticky nb-sticky--green" style="transform:rotate(-.6deg)"><span class="nb-sticky__who">Got it this week</span>Distance vs. displacement, speed and velocity, Polynomials factor theorem, Tissues recap.</div>
   <div class="nb-sticky nb-sticky--pink" style="transform:rotate(.7deg)"><span class="nb-sticky__who">Working on</span>Valency in Chemistry. Saathy made him a 6-minute recap for Saturday.</div></div></section>
</div>
<aside class="nb-col">
 <section class="nb-sticky" style="margin:.4rem .3rem"><span class="nb-tape nb-tape--sky" style="width:4.5rem;top:-.6rem"></span><span class="nb-sticky__who">What to ask at dinner</span>"Why is 36 km/h only 10 m/s?" He worked it out on Wednesday. Ask him to explain it to you.</section>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">From school</h3><span class="nb-chip nb-chip--orange">1 new</span></div>
  <div class="rem"><b class="nb-row__t" style="font-size:1.15rem">Sharma Ma'am · Physics</b><div class="nb-text">Aarav asks good questions in class. Unit conversions need a little practice.</div><span class="nb-meta">Thu</span></div>
  <div class="rem"><b class="nb-row__t" style="font-size:1.15rem">School office</b><div class="nb-text">Unit test timetable for November is out.</div><span class="nb-meta">Fri</span></div></section>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">What you can see</h3></div>
  <div class="nb-text">Progress, homework, time studied and teacher remarks. <b>Not</b> Aarav's chats with Saathy. Those stay his.</div>
  <div class="nb-saathy-tip" style="margin-top:.8rem">{saathy("3.4rem","happy")}<div class="nb-text">No marks or ranks against other children, ever.</div></div></section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Coming up</h3></div>
  <div class="rem"><b class="nb-row__t" style="font-size:1.1rem">Chemistry worksheet</b><span class="nb-meta"> · due Wed 4 Nov</span></div>
  <div class="rem"><b class="nb-row__t" style="font-size:1.1rem">Unit test · Physics</b><span class="nb-meta"> · Mon 9 Nov</span></div>
  <div class="rem"><b class="nb-row__t" style="font-size:1.1rem">Parent-teacher meet</b><span class="nb-meta"> · Sat 14 Nov, 10 am</span></div></section>
</aside></div>'''
page('parent-home','Parent home',body,pcss,active='home',role='parent',who=('M','Mrs. Mehta',"Aarav's parent"),top_extra=bell)

# ---------- SIGN-IN ----------
scss=r'''
.si{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);width:100%;height:100%;min-height:100vh}
.si-l{position:relative;display:flex;flex-direction:column;padding:var(--nb-s6) var(--nb-s8) var(--nb-s6) calc(var(--nb-s8) + 2rem);background:var(--nb-paper);
 background-image:linear-gradient(90deg,transparent 4.5rem,var(--nb-margin-ink) 4.5rem,var(--nb-margin-ink) calc(4.5rem + 1.5px),transparent calc(4.5rem + 1.5px)),repeating-linear-gradient(180deg,transparent 0,transparent calc(var(--nb-rule) - 1px),var(--nb-rule-ink) calc(var(--nb-rule) - 1px),var(--nb-rule-ink) var(--nb-rule));overflow:auto}
.si-l::before{content:'';position:absolute;left:1.6rem;top:0;bottom:0;width:1rem;background:radial-gradient(circle,#E6DCCB 0 .38rem,transparent .42rem) 0 0/1rem 3.75rem repeat-y}
.si-brand{display:flex;align-items:center;gap:.7rem}
.si-form{flex:1;display:flex;flex-direction:column;justify-content:center;max-width:34rem;width:100%;margin:0 auto;padding:var(--nb-s6) 0}
.si-form h1{font-family:var(--nb-font-hand);font-weight:700;font-size:3.4rem;line-height:1}
.dividers{display:flex;gap:.3rem;margin:var(--nb-s5) 0 0;position:relative;z-index:1}
.dv{padding:.6rem 1.3rem .8rem;border:2px solid var(--nb-navy);border-bottom:0;border-radius:14px 14px 0 0;font-family:var(--nb-font-hand);font-weight:700;font-size:1.3rem;display:flex;gap:.45rem;align-items:center;background:var(--nb-cream);color:var(--nb-navy-muted);transform:translateY(4px)}
.dv svg{width:1.1rem;height:1.1rem}
.dv.is-active{background:var(--nb-sticky-yellow);color:var(--nb-navy);transform:none;padding-bottom:1rem}
.dv.t.is-active{background:var(--nb-sky)}.dv.p.is-active{background:#E4F1E2}
.si-card{border:2px solid var(--nb-navy);border-radius:0 18px 18px 18px;padding:var(--nb-s5);display:flex;flex-direction:column;gap:var(--nb-s4);box-shadow:4px 5px 0 rgb(27 42 74 / 12%)}
.boxes{display:flex;gap:.5rem}.boxes span{width:3.1rem;height:3.6rem;border:2px solid var(--nb-navy);border-radius:12px;background:#fff;display:grid;place-items:center;font-family:var(--nb-font-hand);font-weight:700;font-size:1.9rem}
.boxes span.e{border-style:dashed;border-color:#B9AE9B;color:#B9AE9B}
.boxes span.f{box-shadow:0 0 0 4px rgb(232 184 74 / 45%)}
.si-foot{display:flex;justify-content:space-between;align-items:center;font-size:.85rem;color:var(--nb-ink-soft)}
.si-r{position:relative;background:#1B2A4A;color:#FFFDF8;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:var(--nb-s8);overflow:hidden}
.si-r .stars{position:absolute;inset:0}
.si-r h2{font-family:var(--nb-font-hand);font-weight:700;font-size:3.2rem;line-height:1.05;text-align:center;max-width:28rem;margin-top:var(--nb-s5)}
.si-r p{font-family:var(--nb-font-note);font-size:1.25rem;opacity:.8;text-align:center;max-width:26rem;margin-top:var(--nb-s3)}
.si-r .nb-sticky{position:absolute;max-width:14rem;color:var(--nb-navy)}
.moon{position:absolute;right:12%;top:10%;width:4.5rem;height:4.5rem}
@media (max-width:1023px){.si{grid-template-columns:1fr}.si-r{display:none}.si-l{padding:var(--nb-s5) var(--nb-s4) var(--nb-s5) 3.5rem;background-image:linear-gradient(90deg,transparent 2.6rem,var(--nb-margin-ink) 2.6rem,var(--nb-margin-ink) calc(2.6rem + 1.5px),transparent calc(2.6rem + 1.5px)),repeating-linear-gradient(180deg,transparent 0,transparent calc(var(--nb-rule) - 1px),var(--nb-rule-ink) calc(var(--nb-rule) - 1px),var(--nb-rule-ink) var(--nb-rule))}.si-l::before{left:.6rem}.si-form h1{font-size:2.6rem}.dv{padding:.5rem .8rem .7rem;font-size:1.1rem}.boxes span{width:2.5rem;height:3rem}}
'''
import random; random.seed(4)
stars=''.join(f'<circle cx="{random.randint(0,600)}" cy="{random.randint(0,800)}" r="{random.choice([1,1,1.5,2])}" fill="#FFFDF8" opacity="{random.choice([.3,.5,.8])}"/>' for _ in range(70))
starsdoodle=''.join(f'<g transform="translate({x} {y})" stroke="#E8B84A" stroke-width="2" fill="none"><path d="M0 -8V8M-8 0H8M-5 -5l10 10M5 -5l-10 10" opacity=".7"/></g>' for x,y in [(90,140),(520,620),(470,180),(120,690)])
def signin(role):
    tab=lambda k,l,i: f'<a class="dv {k[0]}{" is-active" if k==role else ""}" href="signin-{k}.html">{ic(i)}{l}</a>'
    if role=='student':
        h='Hey, welcome back'; sub='Use the class code your teacher wrote on the board.'
        form=f'''<div class="nb-field"><label class="nb-label">Class code</label><div class="boxes"><span>9</span><span>B</span><span>D</span><span>P</span><span class="f">S</span><span class="e">·</span></div></div>
<div class="nb-field"><label class="nb-label">Your name</label><div class="nb-input nb-input--lined">Aarav Mehta</div><span class="nb-meta">Pick from your class list once the code matches</span></div>
<div class="nb-field"><label class="nb-label">4-digit PIN</label><div class="boxes"><span>•</span><span>•</span><span class="f e"></span><span class="e"></span></div></div>
<button class="nb-btn nb-btn--primary nb-btn--lg" style="justify-content:center">Open my notebook {ic("arrow")}</button>
<div class="si-foot"><a class="nb-link" href="#" style="font-size:1rem">Forgot PIN? Ask your teacher</a><span>No email needed</span></div>'''
    elif role=='teacher':
        h='Good to see you'; sub="Sign in with your school email."
        form=f'''<div class="nb-field"><label class="nb-label">School email</label><div class="nb-input">sharma.r@dpsdelhi.edu.in</div></div>
<div class="nb-field"><label class="nb-label">Password</label><div class="nb-input" style="letter-spacing:.3em">••••••••••</div></div>
<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;gap:.5rem;align-items:center" class="nb-text"><span class="nb-toggle is-on"></span>Keep me signed in on this laptop</span><a class="nb-link" href="#" style="font-size:1rem">Forgot password?</a></div>
<button class="nb-btn nb-btn--primary nb-btn--lg" style="justify-content:center">Go to my classes {ic("arrow")}</button>
<div class="si-foot"><span>New school? Your admin sends you an invite.</span><a class="nb-link" href="#" style="font-size:1rem">School admin sign-in</a></div>'''
    else:
        h="See how Aarav's doing"; sub='We send a code to the phone number the school has.'
        form=f'''<div class="nb-field"><label class="nb-label">Phone number</label><div class="nb-input">+91 98100 42317</div></div>
<div class="nb-field"><label class="nb-label">6-digit code</label><div class="boxes"><span>4</span><span>8</span><span>2</span><span class="f">0</span><span class="e"></span><span class="e"></span></div><span class="nb-meta">Sent just now · resend in 0:42</span></div>
<div class="nb-field"><label class="nb-label">Child code <span class="nb-meta">(on the school letter)</span></label><div class="nb-input">AAR-9B-17</div></div>
<button class="nb-btn nb-btn--primary nb-btn--lg" style="justify-content:center">See the progress report {ic("arrow")}</button>
<div class="si-foot"><span>You'll see progress, not chats.</span><a class="nb-link" href="#" style="font-size:1rem">Need help?</a></div>'''
    html=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>VidhyaSaathy · Sign in</title><link rel="stylesheet" href="tokens.css"/><link rel="stylesheet" href="components.css"/><style>{scss}</style></head>
<body><div id="root"><div class="si">
 <section class="si-l">
  <header class="si-brand"><div class="nb-brand__mark">V</div><div><div class="nb-brand__name">VidhyaSaathy</div><div class="nb-brand__tag">Class 9 · NCERT</div></div><a class="nb-link" href="#" style="margin-left:auto;font-size:1rem">{ic("back")} Back to home</a></header>
  <div class="si-form">
   <h1>{h}</h1>{scribble()}<p class="nb-sub" style="margin-top:.5rem">{sub}</p>
   <nav class="dividers">{tab("student","Student","cap")}{tab("teacher","Teacher","board")}{tab("parent","Parent","heart")}</nav>
   <div class="si-card" style="background:{ {"student":"var(--nb-sticky-yellow)","teacher":"var(--nb-sky)","parent":"#E4F1E2"}[role]}">{form}</div>
  </div>
 </section>
 <section class="si-r">
  <svg class="stars" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">{stars}{starsdoodle}</svg>
  <svg class="moon" viewBox="0 0 40 40"><path d="M28 6a15 15 0 1 0 6 22A12 12 0 0 1 28 6z" fill="none" stroke="#E8B84A" stroke-width="2"/></svg>
  {saathy("13rem","sleep" if role=="student" else "happy")}
  <h2>9:00 pm. Saathy kept your place.</h2>
  <p>{ {"student":"Pick up Acceleration right where you stopped, with the same notes and the same doubts.","teacher":"Your class review queue and session 3 are ready when you are.","parent":"A short, honest weekly view of how your child is learning."}[role]}</p>
  <div class="nb-sticky" style="left:9%;bottom:12%;transform:rotate(-4deg)"><span class="nb-tape" style="width:4rem;top:-.6rem"></span>Hints first. Never just the answer.</div>
  <div class="nb-sticky nb-sticky--pink" style="right:8%;bottom:20%;transform:rotate(3deg)"><span class="nb-tape nb-tape--sky" style="width:4rem;top:-.6rem"></span>No ranks. Just you vs. last week's you.</div>
 </section>
</div></div></body></html>'''
    open(f'{OUT}/signin-{role}.html','w').write(html)
for r in ('student','teacher','parent'): signin(r)
