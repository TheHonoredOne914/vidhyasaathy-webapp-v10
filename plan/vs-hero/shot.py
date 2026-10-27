from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h in [(1280,800),(1440,900)]:
        pg=b.new_page(viewport={'width':w,'height':h}); pg.goto('file:///workspace/vs-hero/index.html'); pg.wait_for_timeout(1500)
        pg.screenshot(path=f'hero-{w}.png')
