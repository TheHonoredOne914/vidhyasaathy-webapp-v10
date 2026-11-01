from p45 import *
import lib
# Proposed nav addition for phase 5: a Doubts inbox under Insight.
if not any(len(t)>2 and t[2]=='doubts' for t in lib.TEACHER_NAV):
    i = [t[2] if len(t)>2 else None for t in lib.TEACHER_NAV].index('mastery')
    lib.TEACHER_NAV.insert(i+1, ('chat','Student doubts','doubts',2))

# tint 1..5 -> teacher band word (4.5 wording, tint 5 = top of band 4)
W = {1:'Needs support',2:'Developing',3:'Progressing',4:'Consistent',5:'Advancing','n':'New'}
M_CSS = r'''
.filters{display:flex;gap:var(--nb-s4);flex-wrap:wrap;align-items:center;justify-content:space-between}
.sel{display:inline-flex;align-items:center;gap:.5rem;height:2.3rem;padding:0 .9rem;border:1.75px solid var(--nb-navy);border-radius:10px;background:var(--nb-paper);font-weight:600;font-size:.95rem}
.sel svg{width:.9rem;height:.9rem;transform:rotate(90deg)}
.legend{display:flex;gap:.4rem .9rem;flex-wrap:wrap;align-items:center;font-size:.85rem;color:var(--nb-ink-soft)}
.legend i{display:inline-block;width:1.4rem;height:.95rem;border-radius:4px;vertical-align:-2px;margin-right:.3rem;border:1px solid rgb(27 42 74 / 15%)}
.mx-wrap{overflow:auto;border:1.5px solid var(--nb-border);border-radius:14px;background:var(--nb-paper);max-height:none}
.mx{display:grid;grid-template-columns:minmax(12rem,1.3fr) repeat(6,minmax(5.6rem,1fr));min-width:0}
.mx > div{padding:.32rem .3rem;border-bottom:1px dashed var(--nb-border)}
.mx .hd{position:sticky;top:0;background:var(--nb-cream);z-index:2;font-family:var(--nb-font-hand);font-weight:700;font-size:1.05rem;line-height:1.1;text-align:center;padding:.6rem .3rem;border-bottom:1.5px solid var(--nb-navy);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:.15rem}
.mx .hd small{font-family:var(--nb-font-ui);font-weight:500;font-size:.72rem;color:var(--nb-ink-soft)}
.mx .hd.sel-col{background:#FDF0C9;box-shadow:inset 0 -3px 0 var(--nb-gold-deep)}
.mx .hd.first{text-align:left;align-items:flex-start;left:0;z-index:3}
.mx .nm{white-space:nowrap;position:sticky;left:0;background:var(--nb-paper);z-index:1;display:flex;align-items:center;gap:.5rem;padding-left:.7rem;font-size:.92rem;font-weight:600}
.mx .nm small{color:var(--nb-ink-faint);font-weight:500}
.mx .nm .stamp{font-family:var(--nb-font-hand);font-weight:700;font-size:.85rem;color:#8A6410;border:1.5px solid var(--nb-gold-deep);border-radius:6px;padding:0 .35rem;transform:rotate(-4deg);background:#FFF4CF}
.cell{height:2.15rem;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.76rem;font-weight:600;color:var(--nb-navy);border:1px solid rgb(27 42 74 / 10%);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 .25rem}
.t1{background:#F5D3CE radial-gradient(circle,rgb(201 67 58 / 28%) 1px,transparent 1.4px) 0 0/7px 7px}
.t2{background:#FCE7B8 repeating-linear-gradient(135deg,rgb(181 132 30 / 18%) 0 2px,transparent 2px 7px)}
.t3{background:#FFF4CF}
.t4{background:#DDEFD9}
.t5{background:#C6E6CF;box-shadow:inset 0 0 0 1.5px rgb(31 107 71 / 30%)}
.tn{background:#EEF3FA;color:#3D6FB8;border:1.5px dashed #9CB8E0}
.cell.pick{outline:2.5px solid var(--nb-navy);outline-offset:1px}
.colsel{background:rgb(253 240 201 / 45%)}
.mx .sum{font-family:var(--nb-font-hand);font-weight:700;font-size:1rem;text-align:center;background:var(--nb-cream);border-bottom:0;color:var(--nb-ink-soft)}
.mx .sum.first{text-align:left;padding-left:.7rem;position:sticky;left:0}
.sugg{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--nb-s4);align-items:center;background:#FFF8E4;border:2px solid var(--nb-gold-deep);border-radius:6px 20px 8px 18px;padding:var(--nb-s4) var(--nb-s5);box-shadow:3px 4px 0 rgb(181 132 30 / 18%)}
.sugg h2{font-family:var(--nb-font-hand);font-weight:700;font-size:1.7rem;line-height:1.1}
.cbar{display:flex;height:1.3rem;border-radius:999px;overflow:hidden;border:1.5px solid var(--nb-navy)}
.cbar i{display:block;height:100%}
.ef{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.25rem .6rem;align-items:center;font-size:.9rem}
.ef .nb-bar{grid-column:1 / -1;height:.4rem}
.evt{width:100%;border-collapse:collapse;font-size:.88rem}
.evt th{font-family:var(--nb-font-hand);font-weight:700;font-size:1.05rem;text-align:left;color:var(--nb-ink-soft);padding:.35rem .5rem;border-bottom:1.5px solid var(--nb-navy)}
.evt td:nth-child(1),.evt td:nth-child(6){white-space:nowrap}
.evt td{padding:.45rem .5rem;border-bottom:1px dashed var(--nb-border);vertical-align:top}
.evt .w{color:var(--nb-redpen);font-weight:600}.evt .r{color:var(--nb-ok);font-weight:600}
.namechips{display:flex;flex-wrap:wrap;gap:.3rem}
.namechips span{font-size:.8rem;padding:.1rem .5rem;border-radius:999px;border:1px solid var(--nb-border);background:var(--nb-paper)}
.moves li{margin:.3rem 0}
@media (max-width:1179px){.sugg{grid-template-columns:minmax(0,1fr)}.sugg > svg{display:none}}
@media (max-width:900px){.evt-wrap{overflow-x:auto}}
'''
concepts = [('Distance &amp; displacement','taught 12 Oct'),('Speed &amp; velocity','taught 16 Oct'),('km/h ↔ m/s','taught 16 Oct'),('d-t graphs','taught 21 Oct'),('Acceleration','taught 27 Oct'),('Equations of motion','not taught yet')]
SEL = 2
studs = [
 ('Aarav Mehta',17,[5,4,1,3,2,'n'],''),
 ('Priya Verma',21,[4,3,2,3,1,'n'],''),
 ('Rohan Gupta',24,[4,3,3,2,2,'n'],'Recovered'),
 ('Ananya Rao',3,[5,5,4,4,3,'n'],''),
 ('Kabir Singh',11,[3,2,1,2,1,'n'],''),
 ('Meera Iyer',14,[5,4,4,5,3,'n'],''),
 ('Dev Patel',8,[4,4,1,3,2,'n'],''),
 ('Riya Kapoor',22,[5,5,5,4,4,'n'],''),
 ('Ishaan Khan',10,[3,3,2,2,2,'n'],''),
 ('Sara Thomas',26,[4,4,1,4,3,'n'],''),
 ('Arjun Nair',2,[4,3,2,3,2,'n'],''),
 ('Zoya Ali',30,[5,4,3,4,3,'n'],''),
]
hd = '<div class="hd first">Student<small>12 of 34 shown</small></div>' + ''.join(f'<div class="hd{" sel-col" if i==SEL else ""}">{n}<small>{s}</small></div>' for i,(n,s) in enumerate(concepts))
rows = ''
for nm,roll,vals,tag in studs:
    stamp = f'<span class="stamp">{tag}</span>' if tag else ''
    rows += f'<div class="nm">{nm} <small>{roll}</small>{stamp}</div>'
    for i,v in enumerate(vals):
        cls = 'tn' if v=='n' else f't{v}'
        pick = ' pick' if (nm.startswith('Priya') and i==SEL) else ''
        rows += f'<div class="{"colsel" if i==SEL else ""}"><div class="cell {cls}{pick}">{W[v]}</div></div>'
summ = '<div class="sum first">Whole class (34)</div>' + ''.join(f'<div class="sum">{t}</div>' for t in ['3 need help','6 need help','11 need help','5 need help','9 need help','not started'])

legend = '<div class="legend">'+''.join(f'<span><i class="{c}"></i>{w}</span>' for c,w in [('t1','Needs foundation support'),('t2','Developing'),('t3','Progressing'),('t4','Consistent'),('t5','Advancing'),('tn','New')])+'</div>'

reteach_ic = '<svg viewBox="0 0 80 80" style="width:4.4rem;height:4.4rem" fill="none" stroke="#1B2A4A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="16" width="44" height="52" rx="4" fill="#FFFDF8"/><path d="M20 30h28M20 40h28M20 50h18"/><path d="M50 58l14-14 6 6-14 14-8 2z" fill="#E8B84A"/><circle cx="62" cy="18" r="9" fill="#FFF1A6"/><path d="M62 13v5l3 2"/></svg>'

mastery_body = f'''
<div class="nb-head"><div><div class="nb-head__eyebrow">Class mastery</div><h1 class="nb-h1">IX-B · Physics · Motion</h1><div class="nb-sub">Every student against every concept. Click a column for the class picture, or a cell for one child's answers.</div></div>
<div class="row-x"><button class="nb-btn nb-btn--ghost">{ic("doc")} Export for PTM</button></div></div>
<div class="p45">
 <div class="nb-col">
  <div class="filters"><div class="nb-tabs"><button class="nb-tab">IX-A</button><button class="nb-tab is-active">IX-B</button></div>
   <div class="row-x"><span class="sel">Physics {ic("arrow")}</span><span class="sel">Ch: Motion {ic("arrow")}</span><span class="sel">Last 30 days {ic("arrow")}</span></div></div>
  <section class="sugg">{reteach_ic}<div><div class="nb-label" style="color:#8A6410">Suggested for tonight</div><h2>Push a reteach on km/h ↔ m/s to 11 students</h2>
   <div class="nb-text" style="margin-top:.2rem">They get "km/h ↔ m/s: a fresh look · 12 min" at 6:00 pm today. It isn't marked as a reteach, so nobody is told they were picked.</div></div>
   <div class="nb-col" style="gap:.4rem;align-items:stretch"><button class="nb-btn nb-btn--primary nb-btn--lg">{ic("send")} Push to 11 students</button><button class="nb-btn nb-btn--quiet nb-btn--sm">Preview the session</button></div></section>
  {legend}
  <div class="mx-wrap"><div class="mx">{hd}{rows}{summ}</div></div>
  <div class="spread"><span class="nb-meta">Each colour has its own pattern too, so it reads in print and for colour-blind users.</span><a class="nb-link" href="#">Show all 34 students</a></div>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Priya Verma × km/h ↔ m/s</h3><div class="row-x"><span class="cell t2" style="height:1.7rem;padding:0 .6rem">Developing</span><a class="nb-link" href="#">Open Priya's page</a></div></div>
   <div class="evt-wrap"><table class="evt"><thead><tr><th>When</th><th>Question</th><th>She chose</th><th>Sure?</th><th>Mistake type</th><th>Time</th><th>From</th></tr></thead><tbody>
    <tr><td>Thu 6:40 pm</td><td>Convert 72 km/h to m/s</td><td class="w">259.2 m/s</td><td>Sure</td><td>Multiplied by 3.6</td><td>41 s</td><td>Race Track</td></tr>
    <tr><td>Thu 6:31 pm</td><td>A car moves at 36 km/h. Speed in m/s?</td><td class="r">10 m/s</td><td>Unsure</td><td>·</td><td>58 s</td><td>Practice set</td></tr>
    <tr><td>Wed 7:12 pm</td><td>Express 18 m/s in km/h</td><td class="w">5 km/h</td><td>Sure</td><td>Divided instead of multiplied</td><td>33 s</td><td>Homework A</td></tr>
    <tr><td>Tue 8:05 pm</td><td>90 km/h = ? m/s</td><td class="w">324 m/s</td><td>Guess</td><td>Multiplied by 3.6</td><td>22 s</td><td>Session 2</td></tr>
   </tbody></table></div>
   <div class="nb-note" style="margin-top:.5rem">Only you and Priya's other subject teachers can see these answers. Parents see progress words only.</div></section>
 </div>
 <aside>
  <section class="nb-card nb-card--accent"><div class="nb-card__head"><h3 class="nb-h3">km/h ↔ m/s · class picture</h3><button class="nb-btn nb-btn--quiet nb-btn--sm" aria-label="Close">{ic("x")}</button></div>
   <div class="nb-label" style="margin-bottom:.35rem">How sure were they when wrong?</div>
   <div class="cbar"><i style="width:47%;background:#C9433A"></i><i style="width:20%;background:#E8B84A"></i><i style="width:10%;background:#C7B8EA"></i><i style="width:23%;background:#5FB58A"></i></div>
   <div class="legend" style="margin-top:.35rem;font-size:.78rem"><span><i style="background:#C9433A"></i>Sure, wrong</span><span><i style="background:#E8B84A"></i>Unsure, wrong</span><span><i style="background:#C7B8EA"></i>Guessed</span><span><i style="background:#5FB58A"></i>Right</span></div>
   <div class="nb-sticky nb-sticky--pink" style="margin:.7rem .1rem 0;font-size:1.05rem"><span class="nb-sticky__who">What it means</span>Mostly sure and wrong: a misconception, not carelessness. They believe × 3.6 is right.</div>
   <div class="nb-label" style="margin:.8rem 0 .35rem">Mistake types</div>
   <div class="nb-col" style="gap:.55rem">
    <div class="ef"><span>Multiplied by 3.6</span><b>7</b><div class="nb-bar"><i style="width:64%"></i></div></div>
    <div class="ef"><span>Converted km but not hours</span><b>3</b><div class="nb-bar"><i style="width:27%"></i></div></div>
    <div class="ef"><span>Dropped the units</span><b>1</b><div class="nb-bar"><i style="width:9%"></i></div></div></div>
   <div class="nb-label" style="margin:.8rem 0 .2rem">Time pattern</div>
   <div class="nb-text" style="font-size:.92rem">Wrong answers came fast: about 30 s, against 55 s for right ones.</div>
   <div class="nb-label" style="margin:.8rem 0 .35rem">The 11 students</div>
   <div class="namechips"><span>Aarav M.</span><span>Kabir S.</span><span>Dev P.</span><span>Sara T.</span><span>Priya V.</span><span>Ishaan K.</span><span>Arjun N.</span><span>+4</span></div>
   <button class="nb-btn nb-btn--primary" style="width:100%;margin-top:.9rem">{ic("send")} Push reteach to 11</button></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Did the last reteach land?</h3></div><div class="nb-meta" style="margin:-.3rem 0 .5rem">Distance &amp; displacement · sent 20 Oct</div>
   <div class="nb-col" style="gap:.4rem;font-size:.92rem"><div class="spread"><span>Delivered</span><b>9 / 9</b></div><div class="spread"><span>Started</span><b>8</b></div><div class="spread"><span>Finished</span><b>7</b></div>
   <div class="spread"><span>Most moved</span><span><span class="cell t2" style="display:inline-flex;height:1.5rem">Developing</span> → <span class="cell t4" style="display:inline-flex;height:1.5rem">Consistent</span></span></div></div></section>
  <section class="nb-card nb-card--flat"><div class="nb-card__head"><h3 class="nb-h3">This week, in words</h3></div>
   <ul class="moves nb-text" style="font-size:.92rem;padding-left:1.1rem;margin:0"><li>Aarav moved up: Developing → Progressing on d-t graphs.</li><li>Rohan recovered on Speed &amp; velocity after his catch-up.</li><li>Kabir needs foundation support on Acceleration. Sure and wrong 4 times.</li></ul></section>
 </aside>
</div>'''
P('teacher-class-mastery', 'Class mastery', mastery_body, M_CSS, active='mastery', **TEACHER)

# ---------------------------------------------------------------- doubts inbox
D_CSS = r'''
.esc{background:var(--nb-paper);border:1.5px solid var(--nb-border);border-radius:14px;padding:var(--nb-s4) var(--nb-s5);display:flex;flex-direction:column;gap:var(--nb-s3)}
.esc.open{border:2px solid var(--nb-navy);box-shadow:3px 4px 0 rgb(27 42 74 / 10%)}
.esc .who{display:flex;gap:.7rem;align-items:center;flex-wrap:wrap}
.esc .q{background:var(--nb-sticky-yellow);border-radius:4px 4px 14px 4px;padding:.6rem .9rem;font-family:var(--nb-font-note);font-size:1.2rem;line-height:1.35;border:1px solid rgb(27 42 74 / 12%)}
.esc .ctx{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
.replybox{border:2px solid var(--nb-redpen);border-radius:4px 16px 16px 16px;background:#FFFCF9;padding:.2rem var(--nb-s4) .5rem}
.replybox .lined{color:var(--nb-redpen);font-family:var(--nb-font-hand);font-weight:600;font-size:1.35rem;min-height:calc(var(--nb-rule) * 4)}
.caret{display:inline-block;width:2px;height:1.2em;background:var(--nb-redpen);vertical-align:-3px;margin-left:2px}
.done-reply{border-left:3px solid var(--nb-redpen);padding-left:.8rem;font-family:var(--nb-font-hand);font-weight:600;font-size:1.25rem;color:var(--nb-redpen);line-height:1.25}
.cl-card{border-radius:4px 4px 18px 4px;padding:var(--nb-s4);border:1.5px solid rgb(27 42 74 / 18%);box-shadow:2px 3px 0 rgb(27 42 74 / 8%);display:flex;flex-direction:column;gap:.5rem}
.cl-card .big{font-family:var(--nb-font-hand);font-weight:700;font-size:1.55rem;line-height:1.1}
.cl-card .snip{font-family:var(--nb-font-note);font-size:1.05rem;line-height:1.3;color:var(--nb-navy-muted)}
.cl-card .snip div::before{content:'“';color:var(--nb-ink-faint)}
.cl-card .snip div::after{content:'”';color:var(--nb-ink-faint)}
'''
def esc(name, roll, when, concept, q, state, extra=''):
    chip = {'open':'<span class="nb-chip nb-chip--orange">Open</span>','ans':f'<span class="nb-chip nb-chip--green">{ic("check")} Replied</span>'}[state]
    return f'''<article class="esc{" open" if extra and state=="open" else ""}"><div class="who"><span class="nb-avatar">{name[0]}</span><b>{name}</b><span class="nb-meta">Roll {roll} · {when}</span><span style="margin-left:auto">{chip}</span></div>
<div class="q">{q}</div><div class="ctx"><span class="nb-chip nb-chip--sky">{concept}</span><span class="nb-meta">Saathy wasn't sure, so the student chose to ask you. You see this question only, not their chat.</span></div>{extra}</article>'''

reply_open = f'''<div><div class="nb-label" style="margin-bottom:.35rem">Your reply</div>
<div class="replybox"><div class="lined">Good question, Aarav. Retardation is acceleration pointing against the motion. Q12 asks for the size of the retardation, so the book writes 2 m/s². As an acceleration it is −2 m/s². We'll draw the arrows in class tomorrow.<span class="caret"></span></div></div>
<div class="spread" style="margin-top:.6rem"><div class="row-x"><button class="nb-btn nb-btn--quiet nb-btn--sm">{ic("book")} Link a lesson note</button><label class="row-x nb-meta"><span class="nb-toggle"></span> Also answer in class (no name shown)</label></div><button class="nb-btn nb-btn--primary">{ic("send")} Send reply</button></div></div>'''
reply_done = '<div class="done-reply">Yes, Meera. Uniform speed on a circle still means changing velocity, because the direction keeps turning. See the last section of Motion.</div><div class="nb-meta">You replied Wed 4:10 pm · Meera opened it</div>'

doubts_body = f'''
<div class="nb-head"><div><div class="nb-head__eyebrow">Student doubts</div><h1 class="nb-h1">Doubts from IX-B</h1><div class="nb-sub">On the left, questions students chose to send you by name. On the right, what the whole class asked Saathy this week, with no names.</div></div>
<div class="nb-tabs"><button class="nb-tab">IX-A</button><button class="nb-tab is-active">IX-B</button></div></div>
<div class="p45">
 <div class="nb-col">
  <div class="spread"><div class="nb-tabs"><button class="nb-tab is-active">Waiting for you · 2</button><button class="nb-tab">Replied · 5</button></div><span class="nb-meta">Students see your reply in their chat and in Notifications.</span></div>
  {esc('Aarav Mehta',17,'Thu 9:42 pm','Motion · Acceleration','Retardation is negative acceleration, right? But in Q12 the book\'s answer is +2 m/s² for a car that is slowing down. Why is it positive?','open',reply_open)}
  {esc('Rohan Gupta',24,'Thu 8:15 pm','Motion · d-t graphs','The textbook line says "the slope of the distance-time graph gives speed". How do I find slope if the line is curved?','open','<div class="row-x"><button class="nb-btn nb-btn--ghost nb-btn--sm">'+ic("pencil")+' Reply</button><button class="nb-btn nb-btn--quiet nb-btn--sm">Answer in class instead</button></div>')}
  <div class="nb-label" style="margin-top:var(--nb-s3)">Replied this week</div>
  {esc('Meera Iyer',14,'Tue 9:05 pm','Motion · Uniform circular motion','If the speed is the same all the way round, how is it accelerated motion?','ans',reply_done)}
 </div>
 <aside>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">What the class asked Saathy</h3></div>
   <div class="nb-note" style="margin:-.3rem 0 .6rem">Last 7 days, grouped by concept. No names, ever.</div>
   <div class="nb-col" style="gap:var(--nb-s4)">
    <div class="cl-card" style="background:var(--nb-sticky-pink);transform:rotate(-.4deg)"><div class="big">17 doubts on Acceleration</div><span class="nb-meta">9 of them on sign convention</span>
     <div class="snip"><div>why is retardation minus</div><div>is deceleration same as negative acceleration</div></div>
     <button class="nb-btn nb-btn--primary nb-btn--sm" style="align-self:flex-start">{ic("send")} Push a reteach</button></div>
    <div class="cl-card" style="background:var(--nb-sticky-blue);transform:rotate(.4deg)"><div class="big">8 doubts on km/h ↔ m/s</div><span class="nb-meta">mostly when to multiply and when to divide</span>
     <div class="snip"><div>when do i do ×5/18</div></div>
     <span class="nb-chip nb-chip--green" style="align-self:flex-start">{ic("check")} Reteach goes out 6 pm</span></div>
    <div class="cl-card" style="background:var(--nb-sticky-green);transform:rotate(-.3deg)"><div class="big">5 doubts on d-t graphs</div><span class="nb-meta">reading slope from a curve</span>
     <button class="nb-btn nb-btn--ghost nb-btn--sm" style="align-self:flex-start">{ic("send")} Push a reteach</button></div>
   </div></section>
  <section class="nb-card nb-card--flat"><div class="nb-saathy-tip">{saathy("3rem","think")}<div class="nb-text" style="font-size:.92rem">Students only show up by name on the left, and only when they ticked "tell my teacher".</div></div></section>
 </aside>
</div>'''
P('teacher-doubts-inbox', 'Student doubts', doubts_body, D_CSS, active='doubts', **TEACHER)
print('ok')
