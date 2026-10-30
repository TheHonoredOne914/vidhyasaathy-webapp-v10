from lib import *
# ---------- GAMES ----------
gcss=r'''
.gm-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-rows:1fr;gap:var(--nb-s4);flex:1}
.gm{display:flex;flex-direction:column;gap:.5rem;padding:var(--nb-s3);position:relative}
.gm .art{aspect-ratio:4/3;border-radius:12px;border:1.75px solid var(--nb-navy);display:grid;place-items:center;overflow:hidden}
.gm .art svg{width:60%;height:60%;stroke:var(--nb-navy);stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}
.gm b{font-family:var(--nb-font-hand);font-size:1.4rem;font-weight:700;line-height:1}
.gm .foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center}
.gm.lock{opacity:.6}.gm.lock .art{border-style:dashed;background:var(--nb-cream-soft) !important}
.gm.today{outline:3px solid var(--nb-gold);outline-offset:3px}
.feat{display:grid;grid-template-columns:14rem minmax(0,1fr) auto;gap:var(--nb-s5);align-items:center;padding:var(--nb-s4) var(--nb-s5)}
@media (max-width:1023px){.gm-grid{grid-template-columns:1fr 1fr}.feat{grid-template-columns:1fr}}
'''
art={'cricket':'<path d="M20 80l40-50M55 25l10 10"/><circle cx="72" cy="70" r="7"/><path d="M15 88h70" stroke-dasharray="4 5"/>',
'race':'<path d="M10 70q40-50 80 0"/><path d="M10 82h80"/><rect x="38" y="44" width="22" height="12" rx="3"/><path d="M78 30v20M78 30h10l-3 4 3 4H78"/>',
'bus':'<path d="M15 80V20M15 80h70"/><path d="M15 78L80 28"/><path d="M15 78L80 55" stroke-dasharray="5 4"/>',
'atom':'<circle cx="50" cy="50" r="5"/><ellipse cx="50" cy="50" rx="34" ry="13"/><ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(120 50 50)"/>',
'particle':'<circle cx="30" cy="35" r="7"/><circle cx="62" cy="28" r="7"/><circle cx="48" cy="60" r="7"/><circle cx="75" cy="65" r="7"/><path d="M22 70l-6 6M86 35l6-6M40 20l-3-8"/>',
'bio':'<ellipse cx="50" cy="50" rx="36" ry="26"/><circle cx="52" cy="48" r="9"/><path d="M28 38q6 4 2 9M70 64q-5-3-1-8"/>',
'poly':'<rect x="18" y="20" width="26" height="26" rx="3"/><rect x="50" y="20" width="32" height="26" rx="3"/><rect x="18" y="52" width="26" height="30" rx="3"/><rect x="50" y="52" width="32" height="30" rx="3"/>',
'float':'<path d="M10 55q10-6 20 0t20 0 20 0 20 0"/><rect x="32" y="32" width="18" height="18" rx="2"/><circle cx="70" cy="72" r="8"/>',
'energy':'<path d="M15 25q30 0 45 40t30 15"/><circle cx="25" cy="22" r="6"/>',
'echo':'<path d="M20 50h8"/><path d="M38 35q10 15 0 30M52 26q16 24 0 48M66 17q22 33 0 66"/>'}
G=[('cricket','Cricket Lab','Motion · acceleration','#DCEAF6','open','Today'),('race','Race Track','Motion · speed','#FFF1A6','played','Best 42 s'),('bus','Bus Stop Graphs','Motion · d-t graphs','#E4F1E2','open','New'),
   ('atom','Atom Forge','Chemistry · atoms','#FBE3D6','pause',''),('particle','Particle Party','Chemistry · matter','#ECE6FA','played','3 stars'),
   ('bio','Bio Quest','Biology · the cell','#E4F1E2','open',''),('poly','Polynomial Factory','Maths · factorising','#ECE6FA','played','2 stars'),
   ('float','Float or Sink','Physics · Ch 10','#DCEAF6','lock','after Gravitation'),('energy','Energy Slide','Physics · Ch 11','#FFF1A6','lock','after Work &amp; Energy'),('echo','Echo Corridor','Physics · Ch 12','#FBE3D6','lock','after Sound')]
def gcard(k,n,s,bg,st,tag):
    cls='gm nb-card'+(' lock' if st=='lock' else '')+(' today' if tag=='Today' else '')
    if st=='lock': foot=f'<span class="nb-meta">{ic("lock")} Opens {tag}</span>'
    elif st=='pause': foot='<span class="nb-chip nb-chip--sand">Coming back soon</span>'
    else: foot=f'<span class="nb-meta">{tag}</span><button class="nb-btn nb-btn--{"primary" if tag=="Today" else "ghost"} nb-btn--sm">{"Play" if st=="open" else "Again"}</button>'
    return f'<div class="{cls}"><div class="art" style="background:{bg}"><svg viewBox="0 0 100 100">{art[k]}</svg></div><b>{n}</b><span class="nb-meta">{s}</span><div class="foot">{foot}</div></div>'
body=f'''<div class="nb-col" style="min-height:100%">
 <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:1rem"><div class="nb-head" style="margin:0"><h1 class="nb-h1">Games</h1>{scribble()}<p class="nb-sub">Each one is a real idea from your chapters, played instead of read.</p></div>
  <div class="nb-tabs"><button class="nb-tab is-active">All 10</button><button class="nb-tab">Physics</button><button class="nb-tab">Chemistry</button><button class="nb-tab">Biology</button><button class="nb-tab">Maths</button></div></div>
 <section class="nb-card feat"><span class="nb-tape"></span><div class="gm" style="padding:0"><div class="art" style="background:#DCEAF6"><svg viewBox="0 0 100 100">{art["cricket"]}</svg></div></div>
  <div><span class="nb-chip nb-chip--orange">Today's game</span><h2 class="nb-h2" style="font-size:2.2rem;margin:.3rem 0">Cricket Lab</h2><div class="nb-text">Bowl the ball and change how fast it speeds up. Watch the v-t graph draw itself as it flies. Goes with the Acceleration lesson you're on.</div></div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:.6rem">{saathy("4.6rem","cheer")}<button class="nb-btn nb-btn--primary nb-btn--lg">Play · 5 min {ic("play")}</button></div></section>
 <div class="gm-grid">{''.join(gcard(*g) for g in G)}</div>
</div>'''
page('games','Games',body,gcss,active='games')

# ---------- NOTIFICATIONS ----------
ncss=r'''
.nt{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--nb-s3);align-items:center;padding:var(--nb-s3);border-radius:14px;margin-bottom:.4rem}
.nt.new{background:var(--nb-sticky-yellow);border:1.5px solid var(--nb-gold-deep)}
.nt .ic{width:2.6rem;height:2.6rem;border-radius:50%;display:grid;place-items:center;border:1.5px solid var(--nb-navy);background:#fff}
.nt b{font-family:var(--nb-font-hand);font-size:1.25rem;font-weight:700;line-height:1.1;display:block}
.tg{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--nb-s3);align-items:center;padding:.65rem 0;border-bottom:1px dashed var(--nb-border)}
.tg:last-child{border:0}.tg b{font-family:var(--nb-font-hand);font-size:1.2rem;font-weight:700;display:block;line-height:1}
'''
def nt(icn,col,t,s,when,new=False,act=''):
    return f'<div class="nt{" new" if new else ""}"><div class="ic" style="background:{col}">{ic(icn)}</div><div><b>{t}</b><span class="nb-meta">{s}</span></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem"><span class="nb-meta">{when}</span>{act}</div></div>'
tog=lambda t,s,on: f'<div class="tg"><div><b>{t}</b><span class="nb-meta">{s}</span></div><span class="nb-toggle{" is-on" if on else ""}"></span></div>'
body=f'''<div class="nb-grid">
<div class="nb-col">
 <div style="display:flex;justify-content:space-between;align-items:flex-end"><div class="nb-head" style="margin:0"><h1 class="nb-h1">Notifications</h1>{scribble()}<p class="nb-sub">2 new since this morning</p></div><button class="nb-btn nb-btn--quiet">{ic("check")} Mark all read</button></div>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Today</h3></div>
  {nt("clipboard" if "clipboard" in P else "doc","#FBE3D6","Sharma Ma'am set Session 3 · Motion diagnostic","Physics · 6 warm-up questions · no marks","2:40 pm",True,'<button class="nb-btn nb-btn--primary nb-btn--sm">Start</button>')}
  {nt("pencil","#DCEAF6","Mr. Khan handed back Number systems","Maths · 9/10 · one note on Q7","1:15 pm",True,'<a class="nb-link" style="font-size:1rem" href="#">See it</a>')}
  {nt("flame","#FFF1A6","5 days in a row","Your longest streak this month is 6. One more lesson ties it.","8:00 am")}</section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Earlier</h3></div>
  {nt("refresh","#FBE3D6","Valency needs a quick look","Chemistry · Saathy made you a 6-minute recap","Mon")}
  {nt("game","#ECE6FA","Bus Stop Graphs is open","Finish Session 2 to play","Sun")}
  {nt("star","#E4F1E2","Polynomials reached Top form","Maths · 10/10 on the last check","Sat")}
  {nt("calendar","#DCEAF6","Chemistry worksheet due Wednesday","Atoms and Molecules · sheet 2","Mon")}
  {nt("mail","#FFF1A6","Message from school","Unit test timetable for November is out","Fri")}</section>
</div>
<aside class="nb-col">
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Tell me about</h3></div>{tog("Homework from teachers","New work and marks",True)}{tog("Saathy's nudges","Fix-it recaps and next steps",True)}{tog("Streak reminders","Once a day, 6 pm",True)}{tog("New games","When one unlocks",False)}{tog("School notices","Circulars, timetables",True)}</section>
 <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Quiet hours</h3><span class="nb-toggle is-on"></span></div><div class="nb-text">Nothing after <b>9 pm</b> or before <b>7 am</b>. Sleep matters more than streaks.</div></section>
 <section class="nb-sticky nb-sticky--blue" style="margin:.4rem .3rem"><span class="nb-tape" style="width:4.5rem;top:-.6rem"></span><div style="display:flex;gap:.7rem;align-items:center">{saathy("3.6rem","sleep")}<div>9:00 pm. Saathy kept your place. See you tomorrow.</div></div></section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Who can reach you here</h3></div>
  <div class="lk" style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px dashed var(--nb-border);font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem">Your teachers<span class="nb-chip nb-chip--green">On</span></div>
  <div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px dashed var(--nb-border);font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem">School office<span class="nb-chip nb-chip--green">On</span></div>
  <div style="display:flex;justify-content:space-between;padding:.5rem 0;font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem">Other students<span class="nb-chip nb-chip--sand">Never</span></div></section>
</aside></div>'''
page('notifications','Notifications',body,ncss,active='notifications')

# ---------- SETTINGS ----------
scss=r'''
.st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--nb-s5);flex:1;align-content:stretch}
.opt-row{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.4rem}
.opt-row .c{padding:.55rem 1rem;border-radius:12px;border:1.5px solid var(--nb-border);background:#fff;font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem}
.opt-row .c.on{border:2px solid var(--nb-navy);background:var(--nb-sticky-yellow)}
.lk{display:flex;justify-content:space-between;align-items:center;padding:.65rem 0;border-bottom:1px dashed var(--nb-border);font-family:var(--nb-font-hand);font-weight:700;font-size:1.2rem}
.lk:last-child{border:0}
@media (max-width:1023px){.st-grid{grid-template-columns:1fr}}
'''
body=f'''<div class="nb-grid">
<div class="nb-col">
 <div class="nb-head"><h1 class="nb-h1">Settings</h1>{scribble()}<p class="nb-sub">Make VidhyaSaathy work the way you do.</p></div>
 <div class="st-grid">
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Learn your way</h3></div><div class="nb-meta">How Saathy explains new ideas first</div>
   <div class="opt-row"><span class="c on">Notes</span><span class="c">Story</span><span class="c">Diagram</span><span class="c">Exam style</span></div>
   <div class="nb-meta" style="margin-top:1rem">When you're stuck</div><div class="opt-row"><span class="c on">Hints first</span><span class="c">Explain fully</span></div>
   <div class="nb-meta" style="margin-top:1rem">Questions per practice set</div><div class="opt-row"><span class="c">5</span><span class="c on">8</span><span class="c">12</span></div></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Daily goal</h3><span class="nb-meta">resets at midnight</span></div>
   <div class="opt-row"><span class="c">10 min</span><span class="c on">15 min</span><span class="c">25 min</span><span class="c">40 min</span></div>
   <div class="nb-meta" style="margin-top:1rem">Remind me at</div><div class="opt-row"><span class="c on">6:00 pm</span><span class="c">Change</span></div>
   <div class="nb-sticky" style="margin-top:1.2rem;transform:rotate(.8deg)">You hit 15 minutes on 4 of 5 school days this week. Nice and steady.</div></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Easier to read</h3></div>
   <div class="tg" style="display:grid;grid-template-columns:1fr auto;padding:.5rem 0"><div><b class="nb-row__t" style="font-size:1.15rem">Bigger text</b><div class="nb-meta">All notes and questions</div></div><span class="nb-toggle"></span></div>
   <div class="tg" style="display:grid;grid-template-columns:1fr auto;padding:.5rem 0"><div><b class="nb-row__t" style="font-size:1.15rem">Plain font for notes</b><div class="nb-meta">Swap handwriting for print</div></div><span class="nb-toggle"></span></div>
   <div class="tg" style="display:grid;grid-template-columns:1fr auto;padding:.5rem 0"><div><b class="nb-row__t" style="font-size:1.15rem">Reduce motion</b><div class="nb-meta">Fewer animations</div></div><span class="nb-toggle is-on"></span></div>
   <div class="nb-card nb-card--flat" style="margin-top:.8rem;padding:.6rem .9rem"><span class="nb-meta">Preview</span><div class="nb-note">Acceleration is how fast <span class="nb-hl">velocity</span> changes.</div></div></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Language</h3></div><div class="nb-meta">Saathy can explain in</div>
   <div class="opt-row"><span class="c on">English</span><span class="c">हिन्दी</span><span class="c">Hinglish</span><span class="c">मराठी</span></div>
   <div class="nb-meta" style="margin-top:1rem">Questions and notes stay in English, as in your NCERT book.</div></section>
 </div>
</div>
<aside class="nb-col">
 <section class="nb-card" style="text-align:center"><span class="nb-tape"></span><div class="nb-avatar" style="width:5rem;height:5rem;font-size:2.2rem;margin:.6rem auto">A</div><h2 class="nb-h2">Aarav Mehta</h2><div class="nb-meta">Class 9-B · Roll 17 · Delhi Public School</div><button class="nb-btn nb-btn--ghost nb-btn--sm" style="margin-top:.8rem">Change PIN</button></section>
 <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">Account</h3></div>
  <div class="lk">Privacy &amp; what's shared<span>{ic("arrow")}</span></div><div class="lk">Linked parent · Mrs. Mehta<span>{ic("arrow")}</span></div><div class="lk">Help &amp; feedback<span>{ic("arrow")}</span></div><div class="lk" style="color:var(--nb-bad)">Sign out<span>{ic("arrow")}</span></div>
  <div class="nb-saathy-tip" style="margin-top:1rem">{saathy("3.2rem","happy")}<div class="nb-text">Your parent sees progress and homework, never your chats with me.</div></div></section>
</aside></div>'''
page('settings','Settings',body,scss,active='settings')
