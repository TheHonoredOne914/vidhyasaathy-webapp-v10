from lib import *
css = r'''
.qz-top{display:flex;align-items:center;justify-content:space-between;gap:var(--nb-s5);margin-bottom:var(--nb-s5)}
.qz-top .back{display:inline-flex;align-items:center;gap:6px;font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem;color:var(--nb-navy-muted)}
.qz-top .strip-wrap{flex:1;max-width:40rem}
.qz-top .strip-cap{display:flex;justify-content:space-between;font-family:var(--nb-font-hand);font-weight:700;font-size:1rem;color:var(--nb-ink-soft)}
.nb-quiz{min-height:calc(100% - 5.2rem)}
.qz-main{display:flex;flex-direction:column;gap:var(--nb-s4);min-width:0}
.nb-qcard{flex:1}
.qz-figure{display:grid;grid-template-columns:minmax(0,1fr) 16rem;gap:var(--nb-s5);align-items:center}
.qz-foot{display:flex;align-items:center;justify-content:space-between;gap:var(--nb-s4);margin-top:auto;padding-top:var(--nb-s4);border-top:1.5px dashed var(--nb-border)}
.qz-foot .left{display:flex;gap:var(--nb-s3);align-items:center}
.qz-rail{display:flex;flex-direction:column;gap:var(--nb-s4)}
.round{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--nb-s2);margin-top:var(--nb-s2)}
.round div{height:3rem;border-radius:10px;border:1.5px dashed var(--nb-border);display:grid;place-items:center;font-family:var(--nb-font-hand);font-weight:700;font-size:1.3rem;color:var(--nb-ink-faint)}
.round div.r{border:1.5px solid var(--nb-ok);background:var(--nb-ok-soft);color:var(--nb-ok)}
.round div.w{border:1.5px solid var(--nb-redpen);background:#FFF1EE;color:var(--nb-redpen)}
.round div.n{border:1.5px dashed var(--nb-blue);background:var(--nb-sky);color:var(--nb-blue)}
.round div.c{border:2px solid var(--nb-navy);background:var(--nb-gold);color:var(--nb-navy)}
.round svg{width:1.3rem;height:1.3rem;stroke-width:2.6}
.ladder{display:flex;align-items:center;gap:var(--nb-s2);margin-top:var(--nb-s2)}
.ladder i{flex:1;height:.7rem;border-radius:999px;background:var(--nb-track);border:1px solid var(--nb-border)}
.ladder i.on{background:var(--nb-gold);border-color:var(--nb-gold-deep)}
.doodle-arrow{position:absolute;right:-1.2rem;top:-2.2rem;width:5rem;height:3rem}
.working{font-family:var(--nb-font-note);font-size:1.2rem;line-height:var(--nb-rule);background:repeating-linear-gradient(180deg,transparent 0,transparent calc(var(--nb-rule) - 1px),var(--nb-rule-ink) calc(var(--nb-rule) - 1px),var(--nb-rule-ink) var(--nb-rule));padding:0 var(--nb-s3);position:relative}
.ww-box{background:var(--nb-paper);border:1.5px solid var(--nb-border);border-radius:14px;padding:var(--nb-s3) var(--nb-s4);position:relative}
.ww-box h4{font-family:var(--nb-font-hand);font-weight:700;font-size:1.3rem;margin-bottom:var(--nb-s1)}
.redmark{position:absolute;font-family:var(--nb-font-hand);font-weight:700;color:var(--nb-redpen);font-size:1.15rem;transform:rotate(-4deg)}
.diag-why{display:flex;gap:var(--nb-s3);align-items:flex-start}
@media (max-width:1023px){
  .qz-top{flex-wrap:wrap;gap:var(--nb-s2)} .qz-top .strip-wrap{order:3;flex-basis:100%}
  .qz-figure{grid-template-columns:1fr}
  .qz-foot{flex-wrap:wrap}
  .nb-strip__node{width:1.7rem;height:1.7rem;font-size:.9rem}.nb-strip__node.is-current{width:2.1rem;height:2.1rem}
  .qz-rail .nb-card:not(.keep-m){display:none}
}
'''
CONF_ICONS = {
 'sure':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>',
 'unsure':'<svg viewBox="0 0 24 24"><path d="M4 12c2-3 4-3 6 0s4 3 6 0 2-2 4-1"/><circle cx="12" cy="18.5" r=".6"/><path d="M12 4v4"/></svg>',
 'guess':'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/></svg>',
}
def conf(sel=None, locked=False):
    btn = lambda k,l,sub: f'<button class="nb-confbtn nb-confbtn--{k}{" is-selected" if sel==k else ""}"{" disabled" if locked and sel!=k else ""} style="{"opacity:.45" if locked and sel!=k else ""}">{CONF_ICONS[k]}<span>{l}<small>{sub}</small></span></button>'
    return f'''<div class="nb-conf"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap"><span class="nb-conf__q">How sure are you?</span><span class="nb-meta">Be honest. It changes what Saathy gives you next, not your marks.</span></div>
<div class="nb-conf__row">{btn("sure","Sure","I know this")}{btn("unsure","Unsure","I think so")}{btn("guess","Guess","No idea, picked one")}</div></div>'''

def strip(states, cap_left, cap_right):
    out=[]
    for i,s in enumerate(states):
        inner = {'r':ic('check'),'w':ic('x'),'n':'?','c':str(i+1),'':str(i+1)}[s]
        cls = {'r':'is-right','w':'is-wrong','n':'is-notyet','c':'is-current','':''}[s]
        if i: out.append(f'<svg class="nb-strip__link{" is-done" if s in "rwn" and s else ""}" viewBox="0 0 40 10" preserveAspectRatio="none"><path d="M0 5 Q10 1 20 5 T40 5"/></svg>')
        star_ = star('',"0.9rem","position:absolute;top:-.55rem;right:-.5rem") if s=='r' else ''
        out.append(f'<div class="nb-strip__node {cls}">{inner}{star_}</div>')
    return f'<div class="strip-wrap"><div class="nb-strip">{"".join(out)}</div><div class="strip-cap"><span>{cap_left}</span><span>{cap_right}</span></div></div>'

def opt(k, text, state='', mark=''):
    return f'<button class="nb-opt {state}"><span class="nb-opt__key">{k}</span><span class="nb-opt__body">{text}</span><span class="nb-opt__mark">{mark}</span></button>'

def round_card(cells, title='This round', note=''):
    cmap={'r':ic('check'),'w':ic('x'),'n':'?'}
    cs=''.join(f'<div class="{c}">{cmap.get(c, str(i+1))}</div>' for i,c in enumerate(cells))
    return f'<section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">{title}</h3><span class="nb-meta">{note}</span></div><div class="round">{cs}</div></section>'

def hint_card(mood='think', title='Stuck?', text="I'll give you a hint, not the answer.", chips=('Give me a hint','Show the formula','Explain simpler')):
    ch=''.join(f'<button class="nb-chip nb-chip--sky">{c}</button>' for c in chips)
    return f'''<section class="nb-card keep-m"><div class="nb-saathy-tip">{saathy("4.2rem",mood)}<div><div class="nb-h3" style="font-size:1.4rem">{title}</div><div class="nb-text">{text}</div></div></div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:var(--nb-s3)">{ch}</div></section>'''

formula = '''<section class="nb-sticky" style="margin:.4rem .3rem"><span class="nb-tape nb-tape--sky" style="width:4.5rem;top:-.6rem"></span><span class="nb-sticky__who">From your notes</span>
<div style="font-family:var(--nb-font-hand);font-weight:700;font-size:1.6rem;line-height:1.1;margin:.2rem 0">km/h <span style="color:var(--nb-blue)">÷ 3.6</span> = m/s</div>
<div>1 km = 1000 m, 1 h = 3600 s<br/>so 1 km/h = 1000/3600 = 5/18 m/s</div></section>'''

ladder = '''<section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Next up</h3></div><div class="nb-text">Get 3 right in a row and Saathy gives you a tougher one.</div><div class="ladder"><i class="on"></i><i class="on"></i><i></i></div><div class="nb-meta" style="margin-top:.3rem">2 of 3 in a row</div></section>'''

def practice(name, state):
    q = 'A car moves at <span class="nb-hl">36 km/h</span>. What is its speed in <span class="nb-hl nb-hl--blue">m/s</span>?'
    if state=='ask':
        opts = opt('a','10 m/s','is-selected')+opt('b','129.6 m/s')+opt('c','3.6 m/s')+opt('d','100 m/s')
        conf_html = conf(None)
        foot = f'<div class="left"><button class="nb-btn nb-btn--quiet">{ic("bulb")} Hint</button><span class="nb-meta">Pick how sure you are to check</span></div><button class="nb-btn nb-btn--primary nb-btn--lg" disabled>Check answer {ic("arrow")}</button>'
        stripst = ['r','r','w','c','','','','']
        rnd = ['r','r','w','c','','','','']
        rail = hint_card()+formula+round_card(rnd,'This round','2 right')+ladder
        fb=''
    elif state=='right':
        opts = opt('a','10 m/s','is-correct',ic('check')+' +10 XP')+opt('b','129.6 m/s','is-dim')+opt('c','3.6 m/s','is-dim')+opt('d','100 m/s','is-dim')
        conf_html = conf('sure', locked=True)
        fb = f'''<div class="nb-feedback nb-feedback--right">{saathy("4.6rem","cheer")}<div><div class="nb-feedback__title" style="color:#1F6B47">Yes! 36 km/h is 10 m/s.</div><div class="nb-feedback__body">You divided by 3.6, and you were sure. That's exactly how it should feel. <span class="nb-hl nb-hl--green">36 ÷ 3.6 = 10</span>.</div></div><span class="nb-xp-pop">+10 XP</span></div>'''
        foot = f'<div class="left"><span class="nb-chip nb-chip--green">{ic("check")} 3 right in a row</span><span class="nb-meta">A tougher one is next</span></div><button class="nb-btn nb-btn--primary nb-btn--lg">Next question {ic("arrow")}</button>'
        stripst = ['r','r','w','r','','','','']
        rnd = ['r','r','w','r','c','','','']
        rail = hint_card('cheer','Nice going','You got it without a hint. Keep it moving.',('Why ÷ 3.6?','Give me a harder one'))+round_card(rnd,'This round','3 right')+'<section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Next up</h3></div><div class="nb-text">3 in a row. Saathy is moving you to a tougher question.</div><div class="ladder"><i class="on"></i><i class="on"></i><i class="on"></i></div></section>'+formula
    else:
        opts = opt('a','10 m/s','is-correct',ic('check')+' right answer')+opt('b','129.6 m/s','is-wrong',ic('x')+' your pick')+opt('c','3.6 m/s','is-dim')+opt('d','100 m/s','is-dim')
        conf_html = conf('sure', locked=True)
        fb = f'''<div class="nb-feedback nb-feedback--wrong" style="grid-template-columns:auto minmax(0,1fr)">{saathy("4.6rem","oops")}<div><div class="nb-feedback__title" style="color:var(--nb-redpen)">Not quite. You multiplied instead of divided.</div><div class="nb-feedback__body">You felt sure about this one, so it's worth a proper look. Here's what happened:</div></div></div>
<div class="nb-whywrong">
  <div class="ww-box"><h4>What you did</h4><div class="working">36 km/h <span class="nb-circle-pen">× 3.6</span> = 129.6 m/s<br/><span class="nb-strike">129.6 m/s</span></div>
  <div class="redmark" style="position:static;margin-top:.3rem">m/s is the bigger unit, so the number gets smaller!</div></div>
  <div class="ww-box" style="border-color:var(--nb-ok)"><h4 style="color:#1F6B47">Fix it</h4><div class="working">36 km/h = 36 × <span class="nb-hl">1000 m</span> ÷ <span class="nb-hl">3600 s</span><br/>= 36 ÷ 3.6 = <b class="nb-hl nb-hl--green">10 m/s</b></div></div>
</div>'''
        foot = f'<div class="left"><span class="nb-chip nb-chip--red">Mistake type: unit conversion</span><span class="nb-meta">Saved to your revision list</span></div><div style="display:flex;gap:.6rem"><button class="nb-btn nb-btn--ghost">Explain simpler</button><button class="nb-btn nb-btn--primary nb-btn--lg">Try a similar one {ic("arrow")}</button></div>'
        stripst = ['r','r','w','w','','','','']
        rnd = ['r','r','w','w','c','','','']
        rail = '<section class="nb-card keep-m" style="background:#FFF6F3;border-color:var(--nb-redpen)"><div class="nb-card__head"><h3 class="nb-h3" style="color:var(--nb-redpen)">Twice now</h3></div><div class="nb-note">This is the second unit slip today. Saathy will add a 4-minute recap on km/h ↔ m/s before your next set.</div><button class="nb-btn nb-btn--ghost nb-btn--sm" style="margin-top:.6rem">Do the recap now</button></section>'+formula+round_card(rnd,'This round','2 right')+'<section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Next up</h3></div><div class="nb-text">An easier one first, with the conversion step shown. Then back up.</div><div class="ladder"><i class="on"></i><i></i><i></i></div></section>'
    body = f'''
<div class="qz-top"><a class="back" href="#">{ic("back")} Motion · Speed &amp; velocity</a>{strip(stripst,'Practice set · 8 questions','Question '+str(stripst.index("c")+1 if "c" in stripst else 4)+' of 8')}<span class="nb-chip nb-chip--sky nb-hide-m">{ic("clock")} ~6 min left</span></div>
<div class="nb-quiz">
  <div class="qz-main">
    <section class="nb-qcard">
      <span class="nb-tape" style="left:auto;right:3rem"></span>
      <div class="nb-q__label"><span class="nb-q__num">{4 if state=="ask" else 4}</span><span class="nb-label">Practice · Speed &amp; velocity</span><span class="nb-mastery nb-mastery--almost">Almost there</span></div>
      <div class="qz-figure"><div><h1 class="nb-q__text">{q}</h1><p class="nb-q__hint" style="margin-top:.4rem">Think: is a metre per second a bigger or smaller unit than a km per hour?</p></div>
        <svg class="nb-hide-m" viewBox="0 0 220 110" style="width:100%"><path d="M10 92H210" stroke="#1B2A4A" stroke-width="2" stroke-dasharray="6 6"/><g fill="none" stroke="#1B2A4A" stroke-width="2.2" stroke-linejoin="round"><path d="M60 82V64l18-14h46l20 14h24v18z" fill="#DCEAF6"/><circle cx="82" cy="84" r="9" fill="#FFFDF8"/><circle cx="148" cy="84" r="9" fill="#FFFDF8"/><path d="M84 52v12h36V52"/></g><path d="M18 58h28M24 68h18M14 78h26" stroke="#E8B84A" stroke-width="3" stroke-linecap="round"/><text x="120" y="30" font-family="Caveat" font-weight="700" font-size="22" fill="#3D6FB8">36 km/h</text></svg></div>
      <div class="nb-opts">{opts}</div>
      {conf_html}
      {fb}
      <div class="qz-foot">{foot}</div>
    </section>
  </div>
  <aside class="qz-rail">{rail}</aside>
</div>'''
    page(name,'Practice',body,css,active='subjects',bodycls='pg-quiz')

practice('quiz','ask'); practice('quiz-right','right'); practice('quiz-wrong','wrong')

# diagnostic
dopts = opt('a','40 km/h','is-selected')+opt('b','360 km/h')+opt('c','123 km/h')+opt('d','117 km/h')+'<button class="nb-opt is-notyet"><span class="nb-opt__key">?</span><span class="nb-opt__body">I haven\'t learned this yet</span><span class="nb-opt__mark" style="font-family:var(--nb-font-ui);font-weight:500;font-size:.8rem">No penalty. We\'ll teach it first.</span></button>'
dbody = f'''
<div class="qz-top"><a class="back" href="#">{ic("back")} Motion · before we start</a>{strip(['r','n','r','c','',''],'Warm-up check · 6 questions','Question 4 of 6')}<span class="nb-chip nb-chip--green nb-hide-m">No marks</span></div>
<div class="nb-quiz">
  <div class="qz-main">
    <section class="nb-qcard">
      <span class="nb-tape nb-tape--green" style="left:auto;right:3rem"></span>
      <div class="nb-q__label"><span class="nb-q__num" style="background:var(--nb-sky)">4</span><span class="nb-label" style="color:var(--nb-blue)">From Class 7 · Motion and Time</span><span class="nb-chip nb-chip--sand">Idea you need: speed</span></div>
      <div class="qz-figure"><div><h1 class="nb-q__text">A bus covers <span class="nb-hl">120 km</span> in <span class="nb-hl nb-hl--pink">3 hours</span>. What is its average speed?</h1><p class="nb-q__hint" style="margin-top:.4rem">This is a Class 7 idea that Motion builds on.</p></div>
      <svg class="nb-hide-m" viewBox="0 0 220 110" style="width:100%"><path d="M14 80H206" stroke="#1B2A4A" stroke-width="2"/><g stroke="#1B2A4A" stroke-width="2" fill="none" stroke-linecap="round"><path d="M14 72v16M206 72v16"/><path d="M40 64h70v-26H46l-6 10z" fill="#FFF1A6"/><circle cx="56" cy="66" r="7" fill="#FFFDF8"/><circle cx="96" cy="66" r="7" fill="#FFFDF8"/><path d="M52 44h12M70 44h12M88 44h12"/></g><text x="120" y="104" font-family="Caveat" font-weight="700" font-size="20" fill="#3D6FB8">120 km</text><text x="140" y="44" font-family="Caveat" font-weight="700" font-size="20" fill="#C9433A">3 h</text></svg></div>
      <div class="nb-opts">{dopts}</div>
      {conf(None)}
      <div class="qz-foot"><div class="left"><span class="nb-meta">Skipping is fine too. Nothing here counts against you.</span></div><button class="nb-btn nb-btn--primary nb-btn--lg" disabled>Next {ic("arrow")}</button></div>
    </section>
  </div>
  <aside class="qz-rail">
    <section class="nb-sticky nb-sticky--green keep-m" style="margin:.5rem .3rem"><span class="nb-tape" style="width:4.5rem;top:-.6rem"></span><span class="nb-sticky__who" style="color:#2F6B3F">Why these questions?</span>These are ideas from Class 6 to 8 that Motion stands on. If you haven't learned one, tap <b>"I haven't learned this yet"</b>. We'll teach it before Motion, no penalty.</section>
    {hint_card('happy','Take your time','No timer. No marks. Just tell Saathy what you know.',('Read it again','What does average mean?'))}
    <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">So far</h3><span class="nb-meta">3 of 6</span></div>
      <div class="nb-row" style="grid-template-columns:auto 1fr"><span class="nb-strip__node is-right">{ic("check")}</span><div><div class="nb-row__t" style="font-size:1.1rem">Distance between two points</div><div class="nb-row__s">Class 6 · Motion and measurement</div></div></div>
      <div class="nb-row" style="grid-template-columns:auto 1fr"><span class="nb-strip__node is-notyet">?</span><div><div class="nb-row__t" style="font-size:1.1rem">Reading a distance-time graph</div><div class="nb-row__s">Not taught yet · we'll start here</div></div></div>
      <div class="nb-row" style="grid-template-columns:auto 1fr"><span class="nb-strip__node is-right">{ic("check")}</span><div><div class="nb-row__t" style="font-size:1.1rem">Units of time</div><div class="nb-row__s">Class 7 · Motion and Time</div></div></div>
    </section>
    <section class="nb-card nb-grow"><div class="nb-card__head"><h3 class="nb-h3">After this</h3></div><div class="nb-text">Saathy builds your Motion path from these answers. New ideas start as <span class="nb-mastery nb-mastery--new">New</span>, never as weak spots.</div></section>
  </aside>
</div>'''
page('diagnostic','Diagnostic',dbody,css,active='subjects',bodycls='pg-quiz')
