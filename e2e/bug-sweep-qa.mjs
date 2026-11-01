import { chromium } from '@playwright/test';
import Database from 'better-sqlite3';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
const base=process.env.SWEEP_BASE||'http://127.0.0.1:5973', out=process.env.SWEEP_OUT||'bug-sweep-out';mkdirSync(out,{recursive:true});
const db=new Database('apps/api/data/vidhyasaathy.db',{readonly:true});
const browser=await chromium.launch({headless:true});
const results=[];const emoji=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
const forbid=/\b(rank(ed)?|band\s*[A-E1-5]|percentile|topper)\b/i;
async function ctx(){return browser.newContext({viewport:{width:1440,height:900},extraHTTPHeaders:{Origin:base}});}
async function visit(c,role,path,clicks=false){clicks=clicks&&!!process.env.CLICKS&&!/(subjects\/|chapters\/)/.test(path);
  const page=await c.newPage();const errs=[],net=[];
  page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160))});
  page.on('pageerror',e=>errs.push('PAGEERR '+e.message.slice(0,160)));
  page.on('response',r=>{if(r.status()>=400)net.push(r.status()+' '+r.url().replace(base,''))});
  const r={role,path,errs,net};
  try{await page.goto(base+path,{timeout:30000});await page.waitForLoadState('load',{timeout:15000}).catch(()=>{});await page.waitForTimeout(1800);
    const info=await page.evaluate(()=>{const m=document.querySelector('main')||document.body;const t=m.innerText;return{url:location.pathname+location.search,h1:[...document.querySelectorAll('h1,h2')].slice(0,3).map(x=>x.innerText.trim()).join(' | '),text:t,len:t.length,sw:document.documentElement.scrollWidth,bh:document.body.scrollHeight,
      ph:(t.match(/(lorem|TODO|coming soon|placeholder|undefined|NaN|null\b|\[object|No data|Nothing here|Something went wrong)/gi)||[]).slice(0,5),
      links:[...document.querySelectorAll('nav a,[role=tab],aside a')].map(a=>a.innerText.trim()).filter(Boolean).slice(0,30)}});
    r.url=info.url;r.h1=info.h1;r.len=info.len;r.ph=info.ph;r.links=info.links;r.hash=createHash('md5').update(info.text.replace(/\d+/g,'')).digest('hex').slice(0,8);
    r.emoji=(info.text.match(new RegExp(emoji,'gu'))||[]).slice(0,5);r.forbid=role==='student'?(info.text.match(new RegExp(forbid,'gi'))||[]).slice(0,5):[];
    r.overflow1440=info.sw>1440;r.short=info.bh<880;
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
    r.overflow390=await page.evaluate(()=>document.documentElement.scrollWidth)>392;
    const bug=errs.length||net.length||r.emoji.length||r.forbid.length||r.overflow390||r.overflow1440||r.ph.length||info.len<80;
    const name=(role+path).replace(/[^a-z0-9]+/gi,'_').slice(0,80);
    if(bug){await page.screenshot({path:`${out}/${name}-390.png`});await page.setViewportSize({width:1440,height:900});await page.screenshot({path:`${out}/${name}-1440.png`});}
    if(clicks){await page.setViewportSize({width:1440,height:900});r.clicks=[];
      const btns=await page.locator('nav a:visible,[role=tab]:visible,main button:visible').all();
      for(const b of btns.slice(0,10)){const label=(await b.innerText().catch(()=>'')).trim().slice(0,30);const before=page.url();const n0=errs.length+net.length;
        try{await b.click({timeout:1500});await page.waitForTimeout(700);r.clicks.push({label,to:page.url().replace(base,''),newErr:errs.length+net.length-n0});}catch(e){r.clicks.push({label,fail:e.message.slice(0,60)});}
        if(page.url()!==before){await page.goto(before).catch(()=>{});await page.waitForTimeout(500);}}}
  }catch(e){r.fatal=e.message.slice(0,200);}
  results.push(r);await page.close();console.log(role,path,'err',errs.length,'net',net.length,JSON.stringify({errs,net,fatal:r.fatal,clicks:(r.clicks||[]).filter(x=>x.newErr||x.fail)}));writeFileSync(out+'/results.json',JSON.stringify(results,null,1));
}
const save=()=>writeFileSync(out+'/results.json',JSON.stringify(results,null,1));
// student
const sc=await ctx();const sid=db.prepare("select id from profile where role='student' and name='Aarav'").get().id;
console.log('pin',(await sc.request.post(base+'/api/auth/pin-login',{data:{profileId:sid,pin:'2468'}})).status());
const get=async(c,p)=>{const x=await c.request.get(base+'/api'+p);return x.ok()?x.json():null};
const subs=await get(sc,'/student/subjects');const sl=Array.isArray(subs)?subs:subs?.subjects||[];
const sp=['/student','/student?panel=subjects','/student?panel=study','/student?panel=homework','/student?panel=games','/student?panel=ask','/student/welcome','/student/progress','/student/notifications','/student/settings','/student/catchup','/student/warmup','/student/challenge','/student/dushman','/student/games/atom','/student/nonexistent'];
for(const p of sp)await visit(sc,'student',p,p.startsWith('/student?')||p==='/student');
const chIds=[];
for(const s of sl){await visit(sc,'student','/student/subjects/'+s.id,true);const ch=await get(sc,`/subjects/${s.id}/chapters`);const cl=Array.isArray(ch)?ch:ch?.chapters||[];if(cl[0])chIds.push(cl[0].id);}
for(const c of chIds.slice(0,4)){for(const p of ['','/diagnostic','/practice'])await visit(sc,'student',`/student/chapters/${c}${p}`,p!=='/diagnostic');}
save();
const games=db.prepare("select name from sqlite_master where type='table'").all().map(x=>x.name);console.log('tables',games.join(','));
// staff
for(const [role,email] of [['teacher','teacher@demo.invalid'],['parent','parent@demo.invalid']]){
  const c=await ctx();console.log(role,'login',(await c.request.post(base+'/api/auth/login',{data:{email,password:'Saathy@2026!'}})).status());
  const paths=role==='teacher'?['/teacher','/teacher/subjects','/teacher/homework','/teacher/review','/teacher/announcements','/teacher/notifications','/teacher/settings','/teacher/onboarding']:['/parent','/parent/announcements','/parent/notifications','/parent/settings'];
  if(role==='parent'){const k=await get(c,'/parent/children');const kl=Array.isArray(k)?k:k?.children||[];for(const x of kl.slice(0,2))paths.push(`/parent/children/${x.id}`,`/parent/children/${x.id}/progress`,`/parent/children/${x.id}/assignments`);}
  for(const p of paths)await visit(c,role,p,true);save();
}
await browser.close();
