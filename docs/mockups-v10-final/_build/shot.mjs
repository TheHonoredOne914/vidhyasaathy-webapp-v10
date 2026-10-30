import { createRequire } from 'module';
const require = createRequire('/workspace/repo/node_modules/');
const { chromium } = require('playwright-core');
const OUT='/workspace/mockups-v10-final';
const args = process.argv.slice(2); // name:w:h[:full]
const browser = await chromium.launch({ executablePath:'/usr/bin/google-chrome', args:['--allow-file-access-from-files'] });
for (const a of args){
  const [name,w,h,full='1'] = a.split(':');
  const page = await browser.newPage({ viewport:{width:+w,height:+h}, deviceScaleFactor:1 });
  await page.goto(`file://${OUT}/${name}.html`, { waitUntil:'networkidle' });
  await page.evaluate(()=>document.fonts.ready);
  let fullPage=false;
  if(full==='1'){
    // expand inner scroller so full-page shows everything
    const sh = await page.evaluate(()=>{const s=document.querySelector('.nb-sheet'); return s? s.scrollHeight - s.clientHeight : 0});
    if (sh>4){ await page.setViewportSize({width:+w,height:+h+sh}); }
  }
  // overflow / empty checks
  const info = await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
  await page.screenshot({ path:`${OUT}/png/${name}-${w}.png`, fullPage:true });
  console.log(name,w,h,'hscroll', info.sw>info.cw ? 'YES '+info.sw : 'no');
  await page.close();
}
await browser.close();
