import os
OUT = '/workspace/mockups-v10-final'
P = {
 'home':'<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/>',
 'grid':'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
 'clock':'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
 'bookmark':'<path d="M7 4h10v16l-5-3-5 3V4z"/>',
 'game':'<rect x="3" y="8" width="18" height="10" rx="4"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r=".8"/><circle cx="18" cy="14" r=".8"/>',
 'chat':'<path d="M5 6h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><path d="M8 11h8M8 14h5"/>',
 'chart':'<path d="M4 20h16"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
 'bell':'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10 19a2 2 0 0 0 4 0"/>',
 'gear':'<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 'search':'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
 'flame':'<path d="M12 3c2 3 4 5 4 9a4 4 0 1 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z"/>',
 'star':'<path d="M12 3l2.2 6.5H21l-5.4 3.9 2.1 6.6L12 16.8 6.3 20l2.1-6.6L3 9.5h6.8z"/>',
 'arrow':'<path d="M5 12h14M13 6l6 6-6 6"/>',
 'back':'<path d="M19 12H5M11 6l-6 6 6 6"/>',
 'check':'<path d="M5 12l5 5L20 7"/>',
 'x':'<path d="M6 6l12 12M18 6 6 18"/>',
 'lock':'<rect x="6" y="11" width="12" height="9" rx="1.5"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
 'book':'<path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z"/><path d="M12 6v13.5"/>',
 'play':'<path d="M8 5v14l11-7z"/>',
 'bulb':'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.7.5 1 1.2 1 2.1h5c0-.9.3-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
 'users':'<circle cx="9" cy="9" r="3"/><path d="M3 19c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5"/><circle cx="17" cy="8" r="2.5"/><path d="M16 13.5c2.3 0 4 1.3 5 4"/>',
 'mail':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
 'phone':'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
 'key':'<circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M17 5l3 3M15 7l2 2"/>',
 'cap':'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
 'board':'<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l4-4 4 4"/>',
 'heart':'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
 'eye':'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
 'shield':'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
 'pencil':'<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
 'camera':'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13" r="3.5"/>',
 'send':'<path d="M12 19V5M6 11l6-6 6 6"/>',
 'flag':'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
 'refresh':'<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
 'video':'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
 'plus':'<path d="M12 5v14M5 12h14"/>',
 'target':'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',
 'sparkle':'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
 'hand':'<path d="M8 12V7a1.5 1.5 0 0 1 3 0v5"/><path d="M11 11V6a1.5 1.5 0 0 1 3 0v6"/><path d="M14 11V7.5a1.5 1.5 0 0 1 3 0V14a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5v-2a1.5 1.5 0 0 1 3 0"/>',
 'check-circle':'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
 'wave':'<path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>',
 'dice':'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>',
 'question':'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><path d="M12 17h.01"/>',
 'doc':'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
 'calendar':'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
 'leaf':'<path d="M6 19c0-8 5-14 14-14-1 8-5 13-12 14"/><path d="M6 19c3-3 6-7 9-10"/>',
}
def ic(name, cls='i', extra=''):
    return f'<svg class="{cls}" viewBox="0 0 24 24"{extra}>{P[name]}</svg>'

SUBJ = {
 'phy':'<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.6" stroke-linecap="round"><circle cx="16" cy="16" r="2.5" fill="#3D6FB8" stroke="none"/><ellipse cx="16" cy="16" rx="11" ry="5"/><ellipse cx="16" cy="16" rx="11" ry="5" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="11" ry="5" transform="rotate(120 16 16)"/></svg>',
 'chem':'<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4h8v6l5 14H7l5-14V4z"/><path d="M12 10h8" stroke="#D9823B"/><circle cx="14" cy="20" r="1.2" fill="#D9823B" stroke="none"/><circle cx="19" cy="22" r="1.5" fill="#E8B84A" stroke="none"/></svg>',
 'bio':'<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 24c0-8 6-16 16-16-2 8-2 14-8 18"/><path d="M10 22c4-2 8-6 10-12" stroke="#5A9A62"/></svg>',
 'math':'<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="10" r="3"/><path d="M16 13 L10 26"/><path d="M16 13 L22 26"/><path d="M11 21h10" stroke="#6B5CA5"/></svg>',
 'eng':'<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8c4-1.5 8-1.5 11 1 3-2.5 7-2.5 11-1v16c-4-1.5-8-1.5-11 1-3-2.5-7-2.5-11-1z"/><path d="M16 9v16"/><path d="M8 13h5M8 17h5M19 13h5" stroke="#C9962E"/></svg>',
 'sst':'<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="14" r="9"/><path d="M8 12c3 1 4 3 3 6M18 6c-1 3 1 5 4 5M17 23c0-3 2-4 4-4" stroke="#C9433A"/><path d="M16 23v4M11 28h10"/></svg>',
}

def saathy(size='5rem', mood='happy', style=''):
    eyes = {
      'happy':'<path class="face" d="M45 50q4-5 8 0"/><path class="face" d="M67 50q4-5 8 0"/><path class="face" d="M54 60q6 5 12 0"/>',
      'think':'<circle cx="49" cy="50" r="2.6" fill="#1B2A4A"/><circle cx="71" cy="50" r="2.6" fill="#1B2A4A"/><path class="face" d="M55 61q5-2 10 0"/>',
      'cheer':'<path class="face" d="M45 50q4-5 8 0"/><path class="face" d="M67 50q4-5 8 0"/><path d="M53 58q7 9 14 0z" fill="#1B2A4A"/>',
      'oops':'<circle cx="49" cy="50" r="2.6" fill="#1B2A4A"/><circle cx="71" cy="50" r="2.6" fill="#1B2A4A"/><path class="face" d="M55 62q5-4 10 0"/><path class="face" d="M84 30q3 4 0 7" />',
      'sleep':'<path class="face" d="M45 49q4 4 8 0"/><path class="face" d="M67 49q4 4 8 0"/><path class="face" d="M56 60q4 3 8 0"/>',
    }[mood]
    return (f'<svg class="nb-saathy" viewBox="0 0 120 90" style="width:{size};height:auto;{style}" role="img" aria-label="Saathy">'
      '<path class="body" d="M30 76C15 76 8 63 15 53C8 42 18 29 31 32C34 18 52 11 63 21C73 11 93 16 95 32C108 33 115 48 107 58C111 69 102 77 92 76Z"/>'
      '<path class="shade" d="M22 64q4 6 12 6"/><path class="shade" d="M98 40q5 3 5 9"/>'
      f'<ellipse class="blush" cx="40" cy="59" rx="5.5" ry="3.2"/><ellipse class="blush" cx="80" cy="59" rx="5.5" ry="3.2"/>{eyes}</svg>')

def star(cls='', size='1.1rem', style=''):
    return f'<svg class="{cls}" viewBox="0 0 24 24" style="width:{size};height:{size};{style}"><path class="nb-star" d="M12 2.5l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 16.4 6.4 19.7l1.5-6.3L3 9.1l6.4-.6z"/></svg>'

def scribble(color='#E8B84A', w='9rem'):
    return f'<svg class="nb-scribble" style="width:{w}" viewBox="0 0 140 10" preserveAspectRatio="none"><path d="M2 6c20-4 40 3 60-1s45-3 76 0" stroke="{color}" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>'

STUDENT_NAV = [('home','Home','home'),('grid','My subjects','subjects'),('clock','Study sessions','sessions'),('bookmark','Homework','homework',2),
  ('sec','Play'),('game','Games','games'),('chat','Ask Saathy','ask'),('sec','You'),('chart','My progress','progress'),('bell','Notifications','notifications',2),('gear','Settings','settings')]
TEACHER_NAV = [('home','Home','home'),('users','My classes','classes'),('clock','Sessions','sessions'),('bookmark','Homework','homework'),('sec','Insight'),('target','Class mastery','mastery'),('doc','Lesson review','review',3),('sec','You'),('bell','Notifications','notifications'),('gear','Settings','settings')]
PARENT_NAV = [('home','Home','home'),('chart','Progress report','report'),('bookmark','Homework','homework'),('mail','From school','school',1),('sec','You'),('gear','Settings','settings')]

def nav_html(items, active):
    out=[]
    for it in items:
        if it[0]=='sec': out.append(f'<div class="nb-nav__sec">{it[1]}</div>'); continue
        badge = f'<span class="nb-nav__badge">{it[3]}</span>' if len(it)>3 else ''
        cls = 'nb-nav__item is-active' if it[2]==active else 'nb-nav__item'
        out.append(f'<a class="{cls}" href="#">{ic(it[0])}{it[1]}{badge}</a>')
    return '\n'.join(out)

MNAV = {'student':[('home','Home','home'),('grid','Subjects','subjects'),('game','Games','games'),('chat','Saathy','ask'),('chart','Me','progress')]}

def page(name, title, body, css='', active='home', role='student', who=('A','Aarav','IX-B · Roll 17'), side_sticky=None, top_extra=None, bodycls=''):
    nav = {'student':STUDENT_NAV,'teacher':TEACHER_NAV,'parent':PARENT_NAV}[role]
    tag = {'student':'Class 9 · NCERT','teacher':'Teacher desk','parent':'Parent view'}[role]
    sticky = f'<div class="nb-side__sticky">{side_sticky}</div>' if side_sticky else ''
    if top_extra is None:
        top_extra = (f'<span class="nb-pill nb-pill--streak">{ic("flame")}5 day streak</span>'
                     f'<span class="nb-pill nb-pill--xp">{ic("star")}340 XP</span>'
                     f'<button class="nb-bell" aria-label="Notifications">{ic("bell")}<i></i></button>')
    mnav = ''
    if role=='student':
        mnav = '<nav class="nb-mnav">'+''.join(f'<a class="{"is-active" if k==active else ""}" href="#">{ic(i)}{l}</a>' for i,l,k in MNAV['student'])+'</nav>'
    html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>VidhyaSaathy · {title}</title>
<link rel="stylesheet" href="tokens.css"/><link rel="stylesheet" href="components.css"/>
<style>
{css}
</style></head>
<body class="{bodycls}"><div id="root">
<div class="nb-app">
  <aside class="nb-side">
    <div class="nb-brand"><div class="nb-brand__mark">V</div><div><div class="nb-brand__name">VidhyaSaathy</div><div class="nb-brand__tag">{tag}</div></div></div>
    <nav class="nb-nav">
{nav_html(nav, active)}
    </nav>
    {sticky}
    <div class="nb-side__foot"><div class="nb-profile"><div class="nb-avatar">{who[0]}</div><div><b>{who[1]}</b><span>{who[2]}</span></div></div></div>
  </aside>
  <div class="nb-main">
    <header class="nb-top">
      <div class="nb-brand nb-show-m"><div class="nb-brand__mark">V</div></div>
      <div class="nb-search">{ic("search")}<span>Search lessons, notes, questions, games…</span><kbd>/</kbd></div>
      <div class="nb-top__right">{top_extra}</div>
    </header>
    <main class="nb-sheet">
{body}
    </main>
  </div>
</div>
{mnav}
</div></body></html>'''
    open(os.path.join(OUT, name+'.html'),'w').write(html)
