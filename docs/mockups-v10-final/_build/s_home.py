from lib import *
css = r'''
.pg-home .nb-grid{grid-template-rows:auto auto auto minmax(0,1fr)}
.pg-home .nb-col.main{display:contents}
.home-hero{grid-column:1;display:flex;align-items:flex-end;justify-content:space-between;gap:var(--nb-s4)}
.home-hero h1 .wave{width:2rem;height:2rem;vertical-align:middle;stroke:var(--nb-navy);fill:none;stroke-width:1.8;stroke-linecap:round}
.home-hero__saathy{position:relative;display:flex;align-items:flex-end;gap:var(--nb-s2);padding-right:var(--nb-s4)}
.home-hero__saathy .nb-bubble{margin-bottom:3.2rem}
.home-continue{display:grid;grid-template-columns:minmax(0,1fr) 17rem;gap:var(--nb-s6);align-items:center;padding:var(--nb-s5) var(--nb-s6)}
.home-continue h2{font-family:var(--nb-font-hand);font-weight:700;font-size:2.1rem;line-height:1;margin:var(--nb-s1) 0 var(--nb-s2)}
.home-continue .why{display:flex;gap:var(--nb-s2);align-items:flex-start;font-family:var(--nb-font-note);font-size:1.08rem;color:var(--nb-navy-muted);margin-bottom:var(--nb-s4);max-width:34rem}
.home-continue .row{display:flex;gap:var(--nb-s3);align-items:center;flex-wrap:wrap}
.home-thumb{height:9.5rem;border-radius:14px;border:1.75px solid var(--nb-navy);background:var(--nb-paper);position:relative;overflow:hidden;transform:rotate(1.2deg)}
.home-thumb svg{position:absolute;inset:0;width:100%;height:100%}
.home-subjects{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--nb-s3)}
.home-subj{display:flex;flex-direction:column;gap:var(--nb-s2);padding:var(--nb-s3);border-radius:14px;border:var(--nb-line) solid var(--nb-navy);background:var(--nb-cream-soft)}
.home-subj b{font-family:var(--nb-font-hand);font-size:1.35rem;line-height:1}
.home-subj .ch{font-family:var(--nb-font-hand);font-weight:600;font-size:1rem;color:var(--nb-navy-muted)}
.home-subj .foot{display:flex;justify-content:space-between;align-items:center;margin-top:auto}
.home-mid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.1fr);gap:var(--nb-s4)}
.days{display:flex;justify-content:space-between;margin-top:var(--nb-s2)}
.day{display:flex;flex-direction:column;align-items:center;gap:4px;font-family:var(--nb-font-hand);font-weight:700;font-size:.95rem;color:var(--nb-ink-soft)}
.day i{width:1.6rem;height:1.6rem;border-radius:50%;border:var(--nb-line) solid var(--nb-navy);background:var(--nb-track);display:grid;place-items:center}
.day.on i{background:var(--nb-gold)} .day.today i{background:var(--nb-navy)} .day.today{color:var(--nb-navy)}
.day i svg{width:.9rem;height:.9rem;stroke:var(--nb-navy);stroke-width:2.6;fill:none}
.game-mini{display:grid;grid-template-columns:4.4rem minmax(0,1fr);gap:var(--nb-s3);align-items:center}
.game-mini .thumb{width:4.4rem;height:4.4rem;border-radius:12px;background:var(--nb-sky);border:var(--nb-line) solid var(--nb-navy);display:grid;place-items:center}
.challenge{background:var(--nb-sticky-yellow);border:0;border-radius:2px 2px 16px 2px;transform:rotate(-.8deg);box-shadow:2px 4px 0 rgb(27 42 74 / 9%)}
.home-path{display:flex;flex-direction:column}
.path{flex:1;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:var(--nb-s2);position:relative;align-items:start;padding-top:var(--nb-s2)}
.path::before{content:'';position:absolute;left:10%;right:10%;top:2.4rem;border-top:2px dashed var(--nb-navy);opacity:.35}
.pnode{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:var(--nb-s1)}
.pnode .orb{width:3.9rem;height:3.9rem;border-radius:50%;border:2px solid var(--nb-navy);display:grid;place-items:center;background:var(--nb-paper);box-shadow:2px 2px 0 rgb(27 42 74 / 8%);margin-bottom:var(--nb-s1)}
.pnode .orb svg{width:1.4rem;height:1.4rem;stroke-width:2.4}
.pnode.done .orb{background:var(--nb-ok-soft);color:var(--nb-ok)}
.pnode.now .orb{background:var(--nb-gold);box-shadow:0 0 0 5px rgb(232 184 74 / 30%)}
.pnode.fix .orb{background:var(--nb-bad-soft);color:var(--nb-bad)}
.pnode.new .orb{background:var(--nb-sky);color:var(--nb-blue);border-style:dashed}
.pnode b{font-family:var(--nb-font-hand);font-size:1.2rem;line-height:1.05}
.pnode > span:not(.nb-mastery){font-size:.78rem;color:var(--nb-ink-soft)}
.goal{display:grid;grid-template-columns:1.3rem 1fr;gap:var(--nb-s2);align-items:center;font-family:var(--nb-font-hand);font-weight:600;font-size:1.2rem;padding:.2rem 0}
.goal .ck{width:1.2rem;height:1.2rem;border-radius:4px;border:var(--nb-line) solid var(--nb-navy);background:#fff;display:grid;place-items:center}
.goal.done .ck{background:var(--nb-blue);border-color:var(--nb-blue)}
.goal.done .ck svg{width:.8rem;height:.8rem;stroke:#fff;stroke-width:3;fill:none}
.goal.done span{text-decoration:line-through;text-decoration-color:#B8B0A2;color:var(--nb-ink-soft)}
.pg-home .rail{grid-column:2;grid-row:1 / span 4}
@media (max-width:1023px){
  .pg-home .nb-grid{display:flex;flex-direction:column;gap:var(--nb-s4)}
  .pg-home .rail{display:contents}
  .pg-home .nb-grid > *, .pg-home .rail > *{flex-shrink:0}
  .home-hero{order:1}.home-continue{order:2;grid-template-columns:1fr;padding:var(--nb-s4)}
  .pg-home .rail > :nth-child(1){order:3}.pg-home .rail > :nth-child(2){order:4}
  .pg-home .subjects-card{order:5}.pg-home .home-path{order:6}
  .pg-home .rail > :nth-child(3){order:7}.pg-home .rail > :nth-child(4){order:8}
  .home-subjects{grid-template-columns:1fr 1fr}
  .home-hero h1{font-size:2.4rem !important}
  .home-continue h2{font-size:1.7rem}
  .path{grid-template-columns:1fr;gap:var(--nb-s3)}
  .path::before{left:1.95rem;right:auto;top:1rem;bottom:1rem;border-top:0;border-left:2px dashed var(--nb-navy)}
  .home-subj > div:first-child{flex-wrap:wrap;gap:4px}
  .pnode{display:grid;grid-template-columns:3.9rem 1fr;text-align:left;align-items:center;column-gap:var(--nb-s3)}
  .pnode .orb{grid-row:1 / span 3;margin:0}
  .pnode .nb-mastery{justify-self:start}
}
'''
subj = [('phy','Physics','Ch 8 · Motion','3 / 8','38%','#3D6FB8','almost','Almost there'),('chem','Chemistry','Ch 3 · Atoms','2 / 5','40%','#D9823B','fix',"Let's fix this"),
        ('bio','Biology','Ch 5 · The Cell','1 / 4','25%','#5A9A62','new','New'),('math','Maths','Ch 2 · Polynomials','4 / 5','80%','#6B5CA5','top','Top form')]
subj_html = ''.join(f'''<div class="home-subj"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div class="nb-ico nb-ico--{k}">{SUBJ[k]}</div><span class="nb-mastery nb-mastery--{m}">{mw}</span></div>
<div><b>{n}</b><div class="ch">{c}</div></div><div class="nb-bar"><i style="width:{p};background:{col}"></i></div><div class="foot"><span class="nb-meta">{f} ideas</span><a class="nb-link" style="font-size:1rem" href="#">Open {ic("arrow")}</a></div></div>''' for k,n,c,f,p,col,m,mw in subj)
days = ''.join(f'<div class="day {c}"><i>{ic("check") if c=="on" else ""}</i>{d}</div>' for d,c in [('M','on'),('T','on'),('W','on'),('T','on'),('F','today'),('S',''),('S','')])
body = f'''
<div class="nb-grid">
  <div class="home-hero">
    <div>
      <div class="nb-head__eyebrow">Friday, 30 Oct</div>
      <h1 class="nb-h1" style="font-size:3.1rem">Namaste, Aarav <svg class="wave" viewBox="0 0 24 24">{P["hand"]}</svg></h1>
      {scribble()}
      <p class="nb-sub">School's done for the day. Fifteen calm minutes and Motion is yours.</p>
    </div>
    <div class="home-hero__saathy nb-hide-m"><div class="nb-bubble nb-bubble--hand">Let's keep going!</div>{saathy("7.5rem","cheer")}</div>
  </div>

  <section class="nb-card home-continue">
    <span class="nb-tape nb-tape--left"></span>
    <div>
      <span class="nb-chip nb-chip--orange">Your next step · Physics</span>
      <h2>Acceleration · finish the lesson</h2>
      <p class="why">{ic("bulb")}<span>You've got speed and velocity down. Acceleration is the next idea, and it's the one Sharma Ma'am's diagnostic opens with.</span></p>
      <div class="row"><button class="nb-btn nb-btn--primary nb-btn--lg">Continue {ic("arrow")}</button><span class="nb-chip nb-chip--sky nb-chip--dashed">{ic("clock")} 8 min left</span><span class="nb-meta">Then a 3-question check</span></div>
    </div>
    <div class="home-thumb nb-hide-m">
      <svg viewBox="0 0 260 150" preserveAspectRatio="xMidYMid slice"><rect width="260" height="150" fill="#DCEAF6"/>
        <g stroke="#B8CDE6" stroke-width="1">{''.join(f'<path d="M0 {y}H260"/>' for y in range(18,150,18))}</g>
        <path d="M30 125V20M30 125H240" stroke="#1B2A4A" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M30 120 Q120 112 220 30" stroke="#3D6FB8" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M30 120 L220 82" stroke="#D9823B" stroke-width="3" fill="none" stroke-dasharray="6 5" stroke-linecap="round"/>
        <text x="150" y="58" font-family="Caveat" font-size="18" font-weight="700" fill="#3D6FB8">speeding up</text>
        <text x="160" y="108" font-family="Caveat" font-size="18" font-weight="700" fill="#D9823B">steady</text>
        <text x="200" y="142" font-family="Caveat" font-size="15" fill="#1B2A4A">time</text></svg>
    </div>
  </section>

  <section class="nb-card subjects-card">
    <div class="nb-card__head"><h3 class="nb-h3">Your subjects</h3><a class="nb-link" href="#">View all {ic("arrow")}</a></div>
    <div class="home-subjects">{subj_html}</div>
  </section>

  <section class="nb-card home-path">
    <div class="nb-card__head"><h3 class="nb-h3">Your path · Physics: Motion</h3><a class="nb-link" href="#">See full map {ic("arrow")}</a></div>
    <div class="path">
      <div class="pnode done"><div class="orb">{ic("check")}</div><span class="nb-mastery nb-mastery--mastered">Mastered</span><b>Distance &amp; displacement</b><span>Check 9/10</span></div>
      <div class="pnode done"><div class="orb">{ic("check")}</div><span class="nb-mastery nb-mastery--top">Top form</span><b>Speed &amp; velocity</b><span>Check 10/10</span></div>
      <div class="pnode now"><div class="orb">{ic("book")}</div><span class="nb-mastery nb-mastery--almost">Almost there</span><b>Acceleration</b><span>Lesson in progress</span></div>
      <div class="pnode fix"><div class="orb">{ic("refresh")}</div><span class="nb-mastery nb-mastery--fix">Let's fix this</span><b>Unit conversion</b><span>km/h to m/s slip</span></div>
      <div class="pnode new"><div class="orb">{ic("sparkle")}</div><span class="nb-mastery nb-mastery--new">New</span><b>Equations of motion</b><span>Opens after Acceleration</span></div>
    </div>
  </section>

  <aside class="rail nb-col">
    <section class="nb-card">
      <div class="nb-card__head"><h3 class="nb-h3">Today's goal</h3><span class="nb-meta">3 / 5</span></div>
      <div class="nb-bar" style="margin-bottom:var(--nb-s3)"><i style="width:60%"></i></div>
      <div class="goal done"><div class="ck">{ic("check")}</div><span>Read Speed notes</span></div>
      <div class="goal done"><div class="ck">{ic("check")}</div><span>Try 10 questions</span></div>
      <div class="goal done"><div class="ck">{ic("check")}</div><span>Watch Session 2 recap</span></div>
      <div class="goal"><div class="ck"></div><span>Finish Acceleration</span></div>
      <div class="goal"><div class="ck"></div><span>Ask Saathy one doubt</span></div>
    </section>
    <section class="nb-card challenge">
      <span class="nb-sticky__who">Daily challenge</span>
      <p class="nb-note" style="margin:.2rem 0 .5rem">A cheetah hits 72 km/h. How many metres does it run in 1 second?</p>
      <button class="nb-btn nb-btn--ghost nb-btn--sm">Try it · +15 XP</button>
    </section>
    <section class="nb-card">
      <div class="nb-card__head"><h3 class="nb-h3">This week</h3><span class="nb-meta">4 days</span></div>
      <div class="days">{days}</div>
    </section>
    <section class="nb-card nb-grow">
      <div class="nb-card__head"><h3 class="nb-h3">From your teacher</h3><a class="nb-link" style="font-size:1rem" href="#">View all</a></div>
      <div class="nb-row" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="nb-row__t" style="font-size:1.12rem">Session 3 · Motion diagnostic</div><div class="nb-row__s">Physics · Sharma Ma'am</div></div><span class="nb-chip nb-chip--orange">Today</span></div>
      <div class="nb-row" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="nb-row__t" style="font-size:1.12rem">Atoms and Molecules · sheet 2</div><div class="nb-row__s">Chemistry · Mr. Iyer</div></div><span class="nb-chip nb-chip--red">Overdue</span></div>
      <div class="nb-row" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="nb-row__t" style="font-size:1.12rem">Polynomials quiz</div><div class="nb-row__s">Maths · Mr. Khan</div></div><span class="nb-chip nb-chip--sand">Fri</span></div>
      <div class="nb-saathy-tip" style="margin-top:var(--nb-s3)">{saathy("3.4rem","happy")}<div><b class="nb-h3" style="font-size:1.2rem">Stuck on something?</b><div class="nb-text">Ask Saathy. Hints first, never just answers.</div></div></div>
    </section>
  </aside>
</div>'''
# rearrange: place middle row (week+game) — handled in rail
page('home','Home',body,css,active='home',bodycls='pg-home')
