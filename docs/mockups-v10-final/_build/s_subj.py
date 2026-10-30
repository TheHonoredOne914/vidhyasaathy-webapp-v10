from lib import *
# ---------- SUBJECTS ----------
scss = r'''
.sj-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(14rem,1fr);gap:var(--nb-s5);flex:1}
.sj-card{display:flex;flex-direction:column;gap:var(--nb-s3);padding:var(--nb-s5);position:relative;transition:transform .15s}
.sj-card:first-child{transform:rotate(-.6deg)}
.sj-card .top{display:flex;justify-content:space-between;align-items:flex-start}
.sj-card .nb-ico{width:3.6rem;height:3.6rem;border-radius:16px}
.sj-card .nb-ico svg{width:1.9rem;height:1.9rem}
.sj-card h2{font-family:var(--nb-font-hand);font-weight:700;font-size:2.1rem;line-height:1}
.sj-card .ch{font-family:var(--nb-font-ui);font-size:.95rem;color:var(--nb-navy-muted)}
.sj-card .next{font-family:var(--nb-font-note);font-size:1.05rem;color:var(--nb-ink-soft);display:flex;gap:.4rem;align-items:center}
.sj-card .foot{margin-top:auto;display:flex;flex-direction:column;gap:.45rem}
.sj-card .foot .l{display:flex;justify-content:space-between;align-items:center}
.due{display:grid;grid-template-columns:.7rem minmax(0,1fr) auto;gap:var(--nb-s2);align-items:center;padding:.5rem 0;border-bottom:1px dashed var(--nb-border);font-family:var(--nb-font-hand);font-weight:600;font-size:1.15rem}
.due:last-child{border:0}.due i{width:.6rem;height:.6rem;border-radius:50%}
.due span{font-family:var(--nb-font-ui);font-size:.78rem;color:var(--nb-ink-soft)}
.wk{display:grid;grid-template-columns:5.5rem minmax(0,1fr) 2.6rem;gap:var(--nb-s2);align-items:center;font-family:var(--nb-font-hand);font-weight:600;font-size:1.05rem;padding:.25rem 0}
.wk .nb-meta{text-align:right}
@media (max-width:1023px){.sj-grid{grid-template-columns:1fr 1fr;grid-auto-rows:auto}}
@media (max-width:560px){.sj-grid{grid-template-columns:1fr}}
'''
S=[('phy','Physics','Ch 8 · Motion','Up next: Acceleration','3 of 8 ideas','38%','#3D6FB8','almost','Almost there','orange','Due today'),
   ('chem','Chemistry','Ch 3 · Atoms and Molecules','Revise: Valency','2 of 5 ideas','40%','#D9823B','fix',"Let's fix this",'red','Overdue'),
   ('bio','Biology','Ch 5 · Fundamental Unit of Life','Up next: Cell organelles','1 of 4 ideas','25%','#5A9A62','new','New','',''),
   ('math','Maths','Ch 2 · Polynomials','Up next: Factor theorem','4 of 5 ideas','80%','#6B5CA5','top','Top form','sand','Quiz Fri'),
   ('eng','English','Ch 4 · A Truly Beautiful Mind','Up next: Reading check','2 of 6 ideas','33%','#C99A2E','almost','Almost there','',''),
   ('sst','Social Science','Ch 2 · The Russian Revolution','Up next: Lenin and the Bolsheviks','5 of 7 ideas','71%','#C9433A','mastered','Mastered','','')]
cards=''.join(f'''<a class="nb-card sj-card" href="#"><div class="top"><div class="nb-ico nb-ico--{k}">{SUBJ[k]}</div>{f'<span class="nb-chip nb-chip--{dc}">{dt}</span>' if dt else ''}</div>
<div><h2>{n}</h2><div class="ch">{c}</div></div><div class="next">{ic("arrow")} {nx}</div><div><span class="nb-mastery nb-mastery--{m}">{mw}</span></div>
<div class="foot"><div class="l"><span class="nb-meta">{f}</span><span class="nb-meta">{p}</span></div><div class="nb-bar"><i style="width:{p};background:{col}"></i></div></div></a>''' for k,n,c,nx,f,p,col,m,mw,dc,dt in S)
wk=''.join(f'<div class="wk"><span>{n}</span><div class="nb-bar"><i style="width:{w}%;background:{c}"></i></div><span class="nb-meta">{t}</span></div>' for n,w,c,t in [('Physics',80,'#3D6FB8','52m'),('Chemistry',35,'#D9823B','22m'),('Maths',55,'#6B5CA5','36m'),('Biology',15,'#5A9A62','9m'),('English',20,'#C99A2E','12m'),('SSt',25,'#C9433A','16m')])
sbody=f'''<div class="nb-grid">
<div class="nb-col">
 <div class="nb-head"><h1 class="nb-h1">Your subjects</h1>{scribble()}<p class="nb-sub">Class 9-B · Friday, 30 Oct · pick one and carry on</p></div>
 <div class="nb-tabs" style="align-self:flex-start"><button class="nb-tab is-active">All 6</button><button class="nb-tab">Needs a look · 1</button><button class="nb-tab">Due this week · 3</button></div>
 <div class="sj-grid">{cards}</div>
</div>
<aside class="nb-col">
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Due soon</h3><a class="nb-link" href="#" style="font-size:1rem">Homework {ic("arrow")}</a></div>
  <div class="due"><i style="background:#D9823B"></i>Chemistry worksheet<span>overdue</span></div>
  <div class="due"><i style="background:#3D6FB8"></i>Motion diagnostic<span>today, 9 pm</span></div>
  <div class="due"><i style="background:#6B5CA5"></i>Polynomials quiz<span>Fri 6 Nov</span></div></section>
 <section class="nb-sticky nb-sticky--pink" style="margin:.4rem .3rem"><span class="nb-tape nb-tape--sky" style="width:4.5rem;top:-.6rem"></span><div style="display:grid;grid-template-columns:auto 1fr;gap:.8rem;align-items:center">{saathy("3.6rem","think")}<div>Valency tripped you up on Monday. Six minutes fixes it.<br/><a class="nb-link" href="#" style="font-size:1.05rem">Revise with me {ic("arrow")}</a></div></div></section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Time this week</h3><span class="nb-meta">2 h 27 m</span></div>{wk}
  <div class="nb-note" style="margin-top:.8rem;color:var(--nb-navy-muted)">Biology's been quiet. One 10-minute idea keeps it fresh.</div></section>
</aside></div>'''
page('subjects','My subjects',sbody,scss,active='subjects')

# ---------- SUBJECT PATH ----------
pcss = r'''
.sp-left .subj{display:grid;grid-template-columns:auto 1fr;gap:var(--nb-s3);align-items:center}
.chap{display:grid;grid-template-columns:1.7rem 1fr auto;gap:var(--nb-s2);align-items:center;padding:.45rem .6rem;border-radius:10px;font-family:var(--nb-font-hand);font-weight:600;font-size:1.15rem;color:var(--nb-navy-muted)}
.chap b{width:1.6rem;height:1.6rem;border-radius:50%;display:grid;place-items:center;font-family:var(--nb-font-ui);font-size:.72rem;border:1.5px solid var(--nb-border);background:#fff}
.chap.on{background:var(--nb-sky);color:var(--nb-navy)} .chap.on b{background:var(--nb-blue);color:#fff;border-color:var(--nb-blue)}
.chap svg{width:.9rem;height:.9rem;opacity:.5}
.sp-map{position:relative;display:flex;flex-direction:column;align-items:center;gap:0}
.unit{width:min(26rem,90%);background:var(--nb-blue);color:#fff;border:2px solid var(--nb-navy);border-radius:var(--nb-radius-sketch);padding:var(--nb-s3) var(--nb-s5);display:flex;justify-content:space-between;align-items:center;box-shadow:3px 4px 0 var(--nb-navy)}
.unit small{font-family:var(--nb-font-hand);font-size:1rem;opacity:.85}.unit h2{font-family:var(--nb-font-hand);font-weight:700;font-size:2rem;line-height:1}
.unit.lock{background:var(--nb-paper);color:var(--nb-navy);box-shadow:3px 4px 0 var(--nb-border);border-color:var(--nb-border)}
.trail{position:relative;width:100%;height:var(--h)}
.trail svg.line{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.st{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:var(--nb-s3)}
.st .o{width:3.6rem;height:3.6rem;border-radius:50%;display:grid;place-items:center;border:2px solid var(--nb-navy);background:var(--nb-paper);box-shadow:0 4px 0 var(--nb-navy);position:relative;flex-shrink:0}
.st .o svg{width:1.4rem;height:1.4rem}
.st .lab{position:absolute;left:calc(100% + .7rem);white-space:nowrap;display:flex;flex-direction:column;gap:2px}
.st.l .lab{left:auto;right:calc(100% + .7rem);align-items:flex-end}
.st .lab b{font-family:var(--nb-font-hand);font-weight:700;font-size:1.2rem;line-height:1}
.st.done .o{background:var(--nb-blue);color:#fff}
.st.done .o::after{content:'';position:absolute;right:-.3rem;bottom:-.3rem;width:1.2rem;height:1.2rem;border-radius:50%;background:var(--nb-gold) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231B2A4A' stroke-width='3.5'%3E%3Cpath d='M5 12l5 5 9-10'/%3E%3C/svg%3E") center/70% no-repeat;border:1.5px solid var(--nb-navy)}
.st.fix .o{background:var(--nb-bad-soft);color:var(--nb-bad);border-color:var(--nb-bad);box-shadow:0 4px 0 var(--nb-bad)}
.st.now .o{width:5rem;height:5rem;background:var(--nb-gold);box-shadow:0 0 0 .5rem rgb(232 184 74 / 25%),0 0 0 1rem rgb(232 184 74 / 12%),0 5px 0 var(--nb-navy)}
.st.now .o svg{width:1.9rem;height:1.9rem}
.st.next .o{background:var(--nb-cream-soft);border-style:dashed;border-color:#B9AE9B;box-shadow:0 4px 0 #D5CBB9;color:#9C927F}
.st.next .lab b{color:var(--nb-ink-soft)}
.st.game .o{border-radius:16px}
.pop{position:absolute;width:17rem;padding:var(--nb-s4);z-index:2}
.pop h3{font-family:var(--nb-font-hand);font-weight:700;font-size:1.9rem;line-height:1}
.ring{width:4.6rem;height:4.6rem;flex-shrink:0}
.wk{display:grid;grid-template-columns:6.5rem minmax(0,1fr) 1.5rem;gap:var(--nb-s2);align-items:center;padding:.3rem 0}.wk .nb-meta{text-align:right}
.legend{display:grid;grid-template-columns:1fr 1fr;gap:.4rem .8rem;margin-top:.4rem}
@media (max-width:1023px){ .sp-left,.sp-right{display:none} .st .lab b{font-size:1rem} .pop{position:static;width:auto;margin:1rem}}
'''
# stations: (x%, y rem, cls, icon, label, sub, side)
st=[(46,3,'done','book','Distance &amp; displacement','Mastered','r'),(54,9,'done','book','Uniform motion','Mastered','r'),
    (58,15,'done game','game','Race Track','game · played','r'),(50,21,'fix','refresh','Speed &amp; velocity','Let\'s fix this · units','r'),
    (40,28.5,'now','book','','','r'),(34,36,'next game','game','Cricket Lab','game','l'),(30,42,'next','book','Distance-time graphs','New','l'),
    (36,48,'next','book','Velocity-time graphs','New','l'),(46,54,'next','question','Motion check · 10 Qs','','r'),(54,60,'next','book','Equations of motion','New','r'),
    (48,66,'next','book','Circular motion','New','r')]
pts=' '.join(f'{x*10},{y*10}' for x,y,*_ in st)
def d(a): return ' '.join(f'{"M" if i==0 else "L"}{x*10} {y*16}' for i,(x,y,*_) in enumerate(a))
stations=''.join(f'<div class="st {c} {s}" style="left:{x}%;top:{y}rem"><div class="o">{ic(i)}</div>{f"<div class=lab><b>{lab}</b><span class=nb-meta>{sub}</span></div>" if lab else ""}</div>' for x,y,c,i,lab,sub,s in st)
done_d=' '.join(f'{"M" if k==0 else "L"}{x} {y}' for k,(x,y,*_) in enumerate(st[:5]))
todo_d=' '.join(f'{"M" if k==0 else "L"}{x} {y}' for k,(x,y,*_) in enumerate(st[4:]))
pbody=f'''<div class="nb-grid nb-grid--3col">
<aside class="nb-col sp-left">
 <a class="nb-link" href="#" style="font-size:1.1rem">{ic("back")} All subjects</a>
 <section class="nb-card"><div class="subj"><div class="nb-ico nb-ico--phy nb-ico--lg">{SUBJ["phy"]}</div><div><h2 class="nb-h2" style="font-size:1.8rem">Physics</h2><div class="nb-meta">Sharma Ma'am</div></div></div>
  <div style="display:flex;justify-content:space-between;margin:.8rem 0 .3rem"><b class="nb-label" style="color:var(--nb-navy)">Ch 8 · Motion</b><span class="nb-meta">4 of 11 ideas</span></div><div class="nb-bar"><i style="width:36%;background:var(--nb-blue)"></i></div></section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Jump to chapter</h3></div>
  <div class="chap on"><b>8</b>Motion<span></span></div><div class="chap"><b>9</b>Force and Laws of Motion{ic("lock")}</div><div class="chap"><b>10</b>Gravitation{ic("lock")}</div><div class="chap"><b>11</b>Work and Energy{ic("lock")}</div><div class="chap"><b>12</b>Sound{ic("lock")}</div>
  <div class="nb-h3" style="font-size:1.2rem;margin-top:1.2rem">What the colours mean</div>
  <div class="legend"><span class="nb-mastery nb-mastery--mastered">Mastered</span><span class="nb-mastery nb-mastery--top">Top form</span><span class="nb-mastery nb-mastery--almost">Almost there</span><span class="nb-mastery nb-mastery--fix">Let's fix this</span><span class="nb-mastery nb-mastery--new">New</span></div></section>
</aside>
<section class="sp-map">
 <div class="unit"><div><small>Unit 1 · Physics</small><h2>Ch 8 · Motion</h2></div><button class="nb-btn nb-btn--ghost nb-btn--sm" style="background:transparent;color:#fff;border-color:#fff">{ic("book")} Notes</button></div>
 <div class="trail" style="--h:70rem">
  <svg class="line" viewBox="0 0 100 70" preserveAspectRatio="none"><path d="{done_d}" stroke="#3D6FB8" stroke-width="5" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/><path d="{todo_d}" stroke="#B9AE9B" stroke-width="3" stroke-dasharray="2 9" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round"/></svg>
  {stations}
  <div class="nb-card pop" style="left:calc(40% + 3.8rem);top:25rem;width:14rem"><span class="nb-label" style="color:var(--nb-gold-deep)">Up next · idea 5 of 11</span><h3>Acceleration</h3><div class="nb-meta" style="margin:.3rem 0 .8rem">Lesson · 8 min · then a 3-question check</div><button class="nb-btn nb-btn--primary" style="width:100%;justify-content:center">Continue {ic("arrow")}</button></div>
  <div style="position:absolute;left:58%;top:37rem;display:flex;flex-direction:column;align-items:center;gap:.4rem" class="nb-hide-m"><div class="nb-bubble nb-bubble--hand" style="max-width:12rem">Acceleration is just how fast speed changes. You've got this.</div>{saathy("6rem","cheer")}</div>
 </div>
 <div class="unit lock"><div><small>{ic("lock")} Unit 2 · opens after the Motion check</small><h2>Ch 9 · Force and Laws of Motion</h2></div></div>
</section>
<aside class="nb-col sp-right">
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Today's goal</h3></div><div style="display:flex;gap:.9rem;align-items:center">
  <svg class="ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" stroke="#EDE6D9" stroke-width="5" fill="none"/><circle cx="20" cy="20" r="16" stroke="#E8B84A" stroke-width="5" fill="none" stroke-dasharray="40.2 100.5" transform="rotate(-90 20 20)" stroke-linecap="round"/><text x="20" y="23.5" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="10" fill="#1B2A4A">6/15</text></svg>
  <div><b class="nb-h3" style="font-size:1.3rem">15 min today</b><div class="nb-meta">9 more to go. One lesson does it.</div></div></div></section>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Next due</h3></div><div class="nb-meta">From Sharma Ma'am</div><div class="nb-row__t" style="font-size:1.2rem;margin:.2rem 0 .5rem">Session 3 · Motion diagnostic</div><span class="nb-chip nb-chip--orange">Today, 9 pm</span></section>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Today's game</h3></div><div style="display:grid;grid-template-columns:3.6rem 1fr;gap:.8rem;align-items:center"><div class="nb-ico" style="width:3.6rem;height:3.6rem;background:var(--nb-navy);color:var(--nb-gold)">{ic("game")}</div><div><b class="nb-h3" style="font-size:1.2rem">Cricket Lab</b><div class="nb-meta">Feel acceleration. Opens after this lesson.</div></div></div></section>
 <section class="nb-sticky" style="margin:.4rem .3rem"><span class="nb-tape nb-tape--pink" style="width:4.5rem;top:-.6rem"></span><span class="nb-sticky__who">Fix-it stop</span>Speed &amp; velocity is marked <b>Let's fix this</b> because of the km/h to m/s slip. A 4-minute recap clears it.<br/><button class="nb-btn nb-btn--ghost nb-btn--sm" style="margin-top:.6rem">Start recap</button></section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Motion at a glance</h3><span class="nb-meta">11 ideas</span></div>
  <div class="wk"><span class="nb-mastery nb-mastery--mastered">Mastered</span><div class="nb-bar"><i style="width:18%;background:var(--nb-ok)"></i></div><span class="nb-meta">2</span></div>
  <div class="wk"><span class="nb-mastery nb-mastery--fix">Fix this</span><div class="nb-bar"><i style="width:9%;background:var(--nb-bad)"></i></div><span class="nb-meta">1</span></div>
  <div class="wk"><span class="nb-mastery nb-mastery--almost">Almost</span><div class="nb-bar"><i style="width:9%;background:var(--nb-gold)"></i></div><span class="nb-meta">1</span></div>
  <div class="wk"><span class="nb-mastery nb-mastery--new">New</span><div class="nb-bar"><i style="width:64%;background:var(--nb-blue)"></i></div><span class="nb-meta">7</span></div>
  <div class="nb-note" style="margin-top:.8rem;color:var(--nb-navy-muted)">Games along the path open as you finish the idea before them.</div></section>
</aside></div>'''
page('subject-path','Physics · Motion',pbody,pcss,active='subjects')
