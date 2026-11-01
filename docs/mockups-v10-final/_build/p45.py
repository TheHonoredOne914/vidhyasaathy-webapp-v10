# Shared bits for phase 4-5 mockups
from lib import *
import re, os

# Full-width layout rule from the brief: rail clamps, stacks under 1180px.
BASE = r'''
.p45{display:grid;grid-template-columns:minmax(0,1fr) clamp(260px,22vw,340px);gap:var(--nb-s5) var(--nb-s6);align-items:start}
.p45 > .nb-col, .p45 > aside{min-width:0;display:flex;flex-direction:column;gap:var(--nb-s4)}
@media (max-width:1179px){.p45{grid-template-columns:minmax(0,1fr)}}
.ex-tag{position:fixed;right:.8rem;bottom:.7rem;z-index:80;font-family:var(--nb-font-hand);font-weight:700;font-size:.95rem;color:var(--nb-ink-soft);background:var(--nb-paper);border:1.5px dashed var(--nb-border);border-radius:999px;padding:.1rem .7rem;transform:rotate(-1.5deg)}
@media print{.ex-tag{display:none}}
.lined{background:repeating-linear-gradient(180deg,transparent 0,transparent calc(var(--nb-rule) - 1px),var(--nb-rule-ink) calc(var(--nb-rule) - 1px),var(--nb-rule-ink) var(--nb-rule));line-height:var(--nb-rule);font-family:var(--nb-font-note);font-size:1.2rem;color:var(--nb-navy)}
.hand{font-family:var(--nb-font-hand);font-weight:700}
.note{font-family:var(--nb-font-note)}
.chk{width:1.35rem;height:1.35rem;border:2px solid var(--nb-navy);border-radius:5px;display:inline-grid;place-items:center;flex-shrink:0;background:var(--nb-paper)}
.chk.on{background:var(--nb-navy)} .chk.on svg{stroke:#fff;width:1rem;height:1rem;stroke-width:3}
.row-x{display:flex;align-items:center;gap:var(--nb-s3);flex-wrap:wrap}
.spread{display:flex;align-items:center;justify-content:space-between;gap:var(--nb-s3);flex-wrap:wrap}
'''
EX = '<span class="ex-tag">Example data</span>'

TEACHER = dict(role='teacher', who=('S',"Sharma Ma'am",'Physics · IX-A, IX-B'),
               top_extra=f'<button class="nb-bell" aria-label="Notifications">{ic("bell")}<i></i></button>')
PARENT = dict(role='parent', who=('M','Mrs. Mehta',"Aarav's parent"),
              top_extra=f'<button class="nb-bell" aria-label="Notifications">{ic("bell")}</button>')

def P(name, title, body, css='', **kw):
    page(name, title, body + EX, BASE + css, **kw)

OVERLAY_CSS = r'''
.ov{position:fixed;inset:0;z-index:60;background:rgb(27 42 74 / 34%);display:grid;place-items:center;padding:1.5rem;overflow:auto}
.sheet{width:min(66rem,100%);max-height:calc(100vh - 3rem);overflow:auto;position:relative;background:var(--nb-paper);border:2px solid var(--nb-navy);border-radius:6px 22px 8px 18px;box-shadow:6px 8px 0 rgb(27 42 74 / 14%),0 24px 60px rgb(27 42 74 / 25%);padding:var(--nb-s6) var(--nb-s6) var(--nb-s5) calc(var(--nb-s6) + 1.4rem)}
.sheet::before{content:'';position:absolute;left:2rem;top:0;bottom:0;width:1.5px;background:var(--nb-margin-ink)}
.sheet > *{position:relative}
.sheet .x{position:absolute;right:1rem;top:1rem;width:2.3rem;height:2.3rem;border-radius:50%;border:1.5px solid var(--nb-border);display:grid;place-items:center;background:var(--nb-paper)}
.sheet .x svg{width:1.1rem;height:1.1rem}
.sheet-head{display:flex;gap:var(--nb-s4);align-items:center;margin-bottom:var(--nb-s5);padding-right:3rem}
.sheet-foot{display:flex;align-items:center;justify-content:space-between;gap:var(--nb-s4);flex-wrap:wrap;margin-top:var(--nb-s5);padding-top:var(--nb-s4);border-top:1.5px dashed var(--nb-border)}
.privacy-line{display:flex;gap:.5rem;align-items:flex-start;font-family:var(--nb-font-note);font-size:1.05rem;color:var(--nb-ink-soft);max-width:32rem}
.privacy-line svg{width:1.1rem;height:1.1rem;flex-shrink:0;margin-top:.2rem;stroke:var(--nb-ok)}
.nb-sheet{filter:saturate(.85)}
'''

def over_ask(name, title, sheet_html, css=''):
    """Take the shipped ask.html as the dimmed background and lay a sheet over it."""
    src = open(os.path.join(OUT, 'ask.html')).read()
    src = src.replace('<title>VidhyaSaathy · ', '<title>VidhyaSaathy · '+title+' · ', 1)
    src = src.replace('</style></head>', BASE + OVERLAY_CSS + css + '\n</style></head>', 1)
    src = src.replace('\n<nav class="nb-mnav">', f'\n<div class="ov" role="dialog" aria-modal="true">{sheet_html}</div>{EX}\n<nav class="nb-mnav">', 1)
    open(os.path.join(OUT, name + '.html'), 'w').write(src)
