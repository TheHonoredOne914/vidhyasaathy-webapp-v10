from p45 import *

R_CSS = r'''
.a4{background:#FFFEFB;border:1.5px solid #D9D1C1;border-radius:4px;box-shadow:0 1px 0 #E9E2D3,0 18px 40px rgb(27 42 74 / 10%),4px 5px 0 rgb(27 42 74 / 6%);padding:clamp(1.5rem,3vw,2.8rem) clamp(1.5rem,3.4vw,3.2rem);position:relative;max-width:60rem;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:var(--nb-s5)}
.a4 .nb-tape{top:-.7rem}
.lh{display:flex;justify-content:space-between;gap:var(--nb-s4);flex-wrap:wrap;border-bottom:2px solid var(--nb-navy);padding-bottom:var(--nb-s3)}
.lh .sch{display:flex;gap:.7rem;align-items:center}
.crest{width:2.8rem;height:2.8rem;border-radius:50%;border:2px solid var(--nb-navy);display:grid;place-items:center;font-family:var(--nb-font-hand);font-weight:700;font-size:1.3rem}
.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--nb-s4)}
.fact{border:1.5px solid var(--nb-border);border-radius:12px;padding:var(--nb-s3) var(--nb-s4)}
.fact b{display:block;font-family:var(--nb-font-hand);font-weight:700;font-size:2.1rem;line-height:1.05}
.two{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:var(--nb-s5)}
.sec-t{font-family:var(--nb-font-hand);font-weight:700;font-size:1.45rem;margin-bottom:.4rem;display:flex;justify-content:space-between;align-items:baseline;gap:.6rem;flex-wrap:wrap}
.trend{display:grid;grid-template-columns:auto 6.5rem minmax(0,1fr) auto;gap:.6rem;align-items:center;padding:.5rem 0;border-bottom:1px dashed var(--nb-border)}
.trend:last-child{border-bottom:0}
.trend svg.sp{width:100%;height:2rem}
.trend .pc{font-family:var(--nb-font-hand);font-weight:700;font-size:1.15rem;white-space:nowrap}
.lamp{display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--nb-s4);align-items:center;border:1.5px solid var(--nb-border);border-radius:14px;padding:var(--nb-s3) var(--nb-s4)}
.lamp-steps{display:flex;gap:.4rem;margin-top:.4rem;flex-wrap:wrap}
.lamp-steps span{font-size:.8rem;padding:.05rem .55rem;border-radius:999px;border:1px solid var(--nb-border);color:var(--nb-ink-faint)}
.lamp-steps span.on{border-color:var(--nb-gold-deep);background:#FFF4CF;color:#8A6410;font-weight:600}
.summary{font-family:var(--nb-font-note);font-size:1.25rem;line-height:var(--nb-rule)}
.askthis{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--nb-s4);align-items:center}
.sign{display:flex;justify-content:space-between;gap:var(--nb-s4);flex-wrap:wrap;align-items:flex-end;border-top:1.5px dashed var(--nb-border);padding-top:var(--nb-s3)}
.remark{font-family:var(--nb-font-hand);font-weight:600;font-size:1.35rem;color:var(--nb-redpen);line-height:1.25}
.kid{display:flex;gap:.7rem;align-items:center;padding:.55rem .7rem;border-radius:12px;border:1.5px solid var(--nb-border);background:var(--nb-paper)}
.kid.on{border:2px solid var(--nb-navy);box-shadow:2px 3px 0 rgb(27 42 74 / 10%)}
.kid .nb-avatar{width:2.2rem;height:2.2rem}
.notin li{margin:.25rem 0}
@media (max-width:900px){.facts,.two{grid-template-columns:1fr}.trend{grid-template-columns:auto 1fr auto}.trend svg.sp{display:none}}
@media print{
  @page{size:A4;margin:12mm}
  .nb-side,.nb-top,.nb-mnav,.no-print,.p45 > aside{display:none!important}
  .nb-app,.nb-main,.nb-sheet{display:block!important;height:auto!important;overflow:visible!important;padding:0!important;background:#fff!important}
  .p45{display:block}
  .a4{box-shadow:none;border:0;max-width:none;padding:0}
  .a4 .nb-tape{display:none}
}
'''
def sp(pts, color):
    xs = [8 + i*(184/(len(pts)-1)) for i in range(len(pts))]
    ys = [30 - (p-20)*0.36 for p in pts]
    d = 'M' + ' L'.join(f'{x:.0f} {y:.0f}' for x,y in zip(xs,ys))
    return f'<svg class="sp" viewBox="0 0 200 34" preserveAspectRatio="none"><path d="M0 33H200" stroke="#E1DACB"/><path d="{d}" fill="none" stroke="{color}" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="{xs[-1]:.0f}" cy="{ys[-1]:.0f}" r="3.5" fill="{color}"/></svg>'
trends = [
 ('phy','Physics','#3D6FB8',[31,33,33,36,38],'31% → 38%','almost','Almost there'),
 ('chem','Chemistry','#D9823B',[41,40,40,39,40],'41% → 40%','fix',"Let's fix this"),
 ('bio','Biology','#5A9A62',[22,22,24,25,25],'22% → 25%','new','New'),
 ('math','Maths','#6B5CA5',[74,75,77,79,80],'74% → 80%','top','Top form'),
]
trend_html = ''.join(f'<div class="trend"><span class="nb-ico nb-ico--{k}">{SUBJ[k]}</span><b>{n}</b>{sp(p,c)}<span class="pc">{t}</span><span class="nb-mastery nb-mastery--{m}" style="grid-column:2 / -1;justify-self:start">{w}</span></div>' for k,n,c,p,t,m,w in trends)
# effort bars, minutes per day
days = [('Mon',30),('Tue',22),('Wed',35),('Thu',34),('Fri',26),('Sat',None),('Sun',None)]
bars = ''
for i,(d,m) in enumerate(days):
    x = 40 + i*52
    if m is None:
        bars += f'<rect x="{x}" y="118" width="30" height="12" rx="3" fill="none" stroke="#B9B2A3" stroke-dasharray="4 3"/><text x="{x+15}" y="148" text-anchor="middle">{d}</text>'
    else:
        h = m*2.6
        bars += f'<rect x="{x}" y="{130-h:.0f}" width="30" height="{h:.0f}" rx="4" fill="#9CC9E8" stroke="#1B2A4A" stroke-width="1.8"/><text x="{x+15}" y="{124-h:.0f}" text-anchor="middle" fill="#1B2A4A">{m}m</text><text x="{x+15}" y="148" text-anchor="middle">{d}</text>'
effort = f'''<svg viewBox="0 0 410 155" style="width:100%;height:auto" role="img" aria-label="Minutes studied each day">
<g stroke="#D7E2F0" stroke-width="1"><path d="M30 26H405M30 52H405M30 78H405M30 104H405M30 130H405"/></g><path d="M24 0V135" stroke="#E7A3A0" stroke-width="1.4"/>
<g font-family="Caveat" font-weight="700" font-size="16" fill="#5A6478">{bars}</g></svg>'''
lamp_svg = '''<svg viewBox="0 0 70 90" style="width:4.2rem;height:auto" aria-hidden="true"><g fill="none" stroke="#1B2A4A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
<path d="M14 40L22 12h26l8 28z" fill="#FFF1A6"/><path d="M35 40v34M22 80h26"/><path d="M28 62h14"/></g>
<g stroke="#E8B84A" stroke-width="2.4" stroke-linecap="round"><path d="M8 50l-5 4M62 50l5 4M35 50v6"/></g></svg>'''

report = f'''<article class="a4">
 <span class="nb-tape nb-tape--sky" style="left:auto;right:3rem;width:5rem"></span>
 <div class="lh"><div class="sch"><span class="crest">D</span><div><b>Delhi Public School</b><div class="nb-meta">Class IX-B · Roll 17</div></div></div>
  <div style="text-align:right"><div class="nb-label">Weekly progress note</div><div class="nb-meta">Mon 26 Oct to Sun 1 Nov 2026 · so far</div></div></div>
 <div><h1 class="nb-h1" style="font-size:clamp(2.4rem,3.4vw,3.2rem)">Aarav's week</h1><div class="nb-sub">Made from Aarav's own practice in VidhyaSaathy.</div></div>
 <div class="facts">
  <div class="fact"><span class="nb-label">Time studied</span><b>2 h 27 m</b><span class="nb-meta">18 min more than last week</span></div>
  <div class="fact"><span class="nb-label">Days studied</span><b>5 in a row</b><span class="nb-meta">1 streak freeze still saved</span></div>
  <div class="fact"><span class="nb-label">Homework</span><b>4 of 5</b><span class="nb-meta">Chemistry sheet is late</span></div>
 </div>
 <div class="two">
  <div><div class="sec-t">Effort, day by day<span class="nb-meta">minutes</span></div>{effort}</div>
  <div><div class="sec-t">How much of the term he's got<span class="nb-tabs no-print"><button class="nb-tab">Physics</button><button class="nb-tab">Maths</button><button class="nb-tab is-active">All</button></span></div>{trend_html}</div>
 </div>
 <div class="lamp">{lamp_svg}<div><div class="sec-t" style="margin:0">Half-yearly exam: getting there</div><div class="nb-text" style="font-size:.95rem">Motion and Polynomials are on track. Atoms and Molecules needs two or three more short sessions before December.</div>
  <div class="lamp-steps"><span>Needs support</span><span class="on">Getting there</span><span>Ready</span></div></div></div>
 <div><div class="sec-t">In plain words</div><div class="summary lined">A steady week. Aarav studied five days running, mostly around 6 pm, and moved up in Physics after fixing his unit conversions. Valency in Chemistry is still shaky; Saathy has set him a 6-minute recap for Saturday. He is not behind, but Chemistry needs a little push.</div></div>
 <div class="askthis nb-sticky" style="transform:rotate(-.4deg)"><div><span class="nb-sticky__who">Ask this at dinner</span><div style="font-size:1.25rem">"Why is 36 km/h only 10 m/s?" He worked it out himself on Wednesday. Ask him to explain it to you.</div></div>
  <button class="nb-btn nb-btn--ghost nb-btn--sm no-print">{ic("check")} We talked about it</button></div>
 <div class="sign"><div style="max-width:34rem"><div class="nb-label" style="margin-bottom:.2rem">From Sharma Ma'am · Physics</div><div class="remark">Aarav asks good questions in class. Unit conversions need a little more practice.</div></div>
  <div class="nb-meta" style="text-align:right">Not in this note, on purpose:<br/>chats with Saathy, single answers,<br/>marks tables, ranks.</div></div>
</article>'''

report_body = f'''
<div class="nb-head no-print"><div><div class="nb-head__eyebrow">Progress report</div><h1 class="nb-h1">The one-page note</h1><div class="nb-sub">Print it, save it as a PDF, or bring it to the parent-teacher meet.</div></div>
<div class="row-x"><button class="nb-btn nb-btn--ghost">{ic("doc")} Save as PDF</button><button class="nb-btn nb-btn--primary">{ic("doc")} Print</button></div></div>
<div class="p45">
 <div class="nb-col">{report}</div>
 <aside class="no-print">
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Your children</h3></div>
   <div class="nb-col" style="gap:.5rem"><div class="kid on"><span class="nb-avatar">A</span><div><b>Aarav</b><div class="nb-meta">Class IX-B</div></div><span style="margin-left:auto">{ic("check")}</span></div>
   <div class="kid"><span class="nb-avatar" style="background:var(--nb-sticky-lilac)">T</span><div><b>Tara</b><div class="nb-meta">Class VI-C</div></div></div></div>
   <div class="nb-meta" style="margin-top:.6rem">Only children the school has linked to you show here.</div></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Which week</h3></div>
   <div class="nb-col" style="gap:.4rem"><span class="nb-chip nb-chip--sky" style="justify-content:flex-start">This week · 26 Oct</span><span class="nb-chip" style="justify-content:flex-start">19 Oct</span><span class="nb-chip" style="justify-content:flex-start">12 Oct</span></div></section>
  <section class="nb-card nb-card--flat"><div class="nb-saathy-tip">{saathy("3.2rem","happy")}<div><div class="nb-h3" style="font-size:1.2rem">What this is not</div><ul class="notin nb-text" style="font-size:.92rem;padding-left:1rem;margin:.2rem 0 0"><li>Not Aarav's chats with Saathy</li><li>Not his answers to single questions</li><li>No ranks, no class comparison</li></ul></div></div></section>
 </aside>
</div>'''
P('parent-report', 'Progress report', report_body, R_CSS, active='report', **PARENT)

# ---------------------------------------------------------------- privacy
PV_CSS = r'''
.wsw-wrap{overflow-x:auto;border:2px solid var(--nb-navy);border-radius:6px 20px 8px 18px;background:var(--nb-paper);box-shadow:4px 5px 0 rgb(27 42 74 / 10%)}
.wsw{width:100%;border-collapse:collapse;min-width:40rem}
.wsw th{font-family:var(--nb-font-hand);font-weight:700;font-size:1.3rem;padding:.7rem .8rem;text-align:center;border-bottom:2px solid var(--nb-navy);background:var(--nb-cream);vertical-align:bottom}
.wsw th:first-child{text-align:left}
.wsw th small{display:block;font-family:var(--nb-font-ui);font-weight:500;font-size:.75rem;color:var(--nb-ink-soft)}
.wsw td{padding:.65rem .8rem;border-bottom:1px dashed var(--nb-border);text-align:center;vertical-align:middle;font-size:.92rem}
.wsw td:first-child{text-align:left}
.wsw td:first-child b{display:block;font-size:1rem}
.wsw td:first-child span{font-size:.82rem;color:var(--nb-ink-soft)}
.wsw tr:last-child td{border-bottom:0}
.yes,.no{display:inline-grid;place-items:center;width:2rem;height:2rem;border-radius:50%}
.yes{border:2px solid var(--nb-ok);background:var(--nb-ok-soft)} .yes svg{stroke:var(--nb-ok);width:1.1rem;height:1.1rem;stroke-width:3}
.no svg{stroke:var(--nb-redpen);width:1.2rem;height:1.2rem;stroke-width:3}
.some{font-family:var(--nb-font-hand);font-weight:700;font-size:1.05rem;color:#8A6410;line-height:1.1;display:block}
.you-col{background:rgb(255 241 166 / 35%)}
.keep{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--nb-s4)}
.keep .nb-sticky b{font-family:var(--nb-font-hand);font-size:1.5rem;display:block;line-height:1.1}
.never li{display:flex;gap:.5rem;align-items:flex-start;margin:.35rem 0}
.never svg{stroke:var(--nb-redpen);width:1.1rem;height:1.1rem;flex-shrink:0;margin-top:.2rem;stroke-width:2.6}
.lockrow{display:flex;gap:.5rem;align-items:center;font-size:.85rem;color:var(--nb-ink-soft)}
.lockrow svg{width:1rem;height:1rem}
@media (max-width:900px){.keep{grid-template-columns:1fr}}
'''
Y = f'<span class="yes" aria-label="Yes">{ic("check")}</span>'
N = f'<span class="no" aria-label="No">{ic("x")}</span>'
def S(t): return f'<span class="some">{t}</span>'
rows = [
 ('Your chats with Saathy','Cleared after 24 hours', Y, N, N, N),
 ('Photos you snap','Deleted after 24 hours', Y, N, N, N),
 ('A doubt you send to your teacher','Only when you tick "tell my teacher"', Y, S('Only that question'), N, N),
 ('Your answers to questions','Every practice, quiz and game answer', Y, S('Your subject teachers'), N, N),
 ('Progress words','Mastered, Almost there, and so on', Y, Y, Y, S('Whole-school totals only')),
 ('Time studied and streak','Minutes per day', Y, Y, Y, S('Whole-school totals only')),
 ('Homework handed in','Done, late, or not yet', Y, Y, Y, N),
]
trs = ''.join(f'<tr><td><b>{a}</b><span>{b}</span></td><td class="you-col">{c}</td><td>{d}</td><td>{e}</td><td>{f}</td></tr>' for a,b,c,d,e,f in rows)
privacy_body = f'''
<div class="nb-head"><div style="display:flex;gap:var(--nb-s4);align-items:center">{saathy("4.6rem","happy")}<div><div class="nb-head__eyebrow">Settings · Privacy</div><h1 class="nb-h1">Who sees what</h1><div class="nb-sub">No small print. Here's exactly who can see each thing you do here.</div></div></div>
<a class="nb-link" href="#">{ic("back")} Settings</a></div>
<div class="p45">
 <div class="nb-col">
  <div class="wsw-wrap"><table class="wsw"><thead><tr><th>Your stuff</th><th class="you-col">You</th><th>Your teachers<small>Sharma Ma'am and others</small></th><th>Your parent<small>once the school links them</small></th><th>School admin</th></tr></thead><tbody>{trs}</tbody></table></div>
  <div class="lockrow">{ic("lock")} Nobody at school can change this table. It's built into how VidhyaSaathy works.</div>
  <div class="keep">
   <div class="nb-sticky nb-sticky--blue" style="transform:rotate(-.6deg)"><span class="nb-sticky__who">Kept for 24 hours</span><b>Chats and photos</b>Then they're gone. The question's title stays in your doubts list.</div>
   <div class="nb-sticky nb-sticky--green" style="transform:rotate(.5deg)"><span class="nb-sticky__who">Kept until you remove it</span><b>Saved explanations</b>Anything you bookmark from Saathy stays in Saved.</div>
   <div class="nb-sticky" style="transform:rotate(-.3deg)"><span class="nb-sticky__who">Kept for the school year</span><b>Your progress</b>So Saathy knows what to give you next.</div>
  </div>
 </div>
 <aside>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">We never</h3></div>
   <ul class="never nb-text" style="list-style:none;padding:0;margin:0;font-size:.95rem"><li>{ic("x")} Show your marks or progress to other students</li><li>{ic("x")} Rank you against your classmates</li><li>{ic("x")} Show ads or sell your data</li><li>{ic("x")} Show your chats to your parent or teacher</li></ul></section>
  <section class="nb-card"><div class="nb-card__head"><h3 class="nb-h3">Linked parent</h3></div>
   <div class="nb-row" style="grid-template-columns:auto 1fr"><span class="nb-avatar" style="background:var(--nb-sticky-lilac)">M</span><div><div class="nb-row__t">Mrs. Mehta</div><div class="nb-row__s">Linked by the school on 2 Sep</div></div></div>
   <div class="nb-note" style="margin-top:.5rem">She sees your progress, never your chats.</div></section>
  <section class="nb-card nb-card--flat"><div class="nb-card__head"><h3 class="nb-h3">Your data</h3></div>
   <div class="nb-col" style="gap:.5rem"><button class="nb-btn nb-btn--ghost">Download my data</button><button class="nb-btn nb-btn--quiet">Ask to delete my account</button></div>
   <div class="nb-meta" style="margin-top:.5rem">Deleting needs a parent's okay, so nothing goes by mistake.</div></section>
 </aside>
</div>'''
P('privacy', 'Privacy', privacy_body, PV_CSS, active='settings')
print('ok')
