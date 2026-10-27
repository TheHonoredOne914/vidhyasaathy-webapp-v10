from playwright.sync_api import sync_playwright
B='file:///workspace/vs-hero/'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=b.new_page(viewport={'width':1280,'height':800})
    pg.goto(B+'landing.html?static'); pg.wait_for_timeout(3500)
    pg.screenshot(path='hero-f1.png'); pg.wait_for_timeout(2000); pg.screenshot(path='hero-f2.png')
    els=pg.query_selector_all('body > section, body > footer')
    for i,e in enumerate(els[:10],1): e.screenshot(path=f'landing-{i:02d}.png')
    pg.screenshot(path='landing-full.png',full_page=True)
    for n in ['signin','register']:
        pg.goto(B+n+'.html?static'); pg.wait_for_timeout(1200); pg.screenshot(path=f'{n}-1280.png',full_page=True)
    pg.goto(B+'landing.html?static'); pg.wait_for_timeout(2600); pg.evaluate('window.__ring()'); pg.wait_for_timeout(350); pg.screenshot(path='bell-ring.png')
