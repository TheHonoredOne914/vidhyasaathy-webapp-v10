import { createRequire } from 'module';
const require = createRequire('/workspace/repo/node_modules/');
const { chromium } = require('playwright-core');
const b = await chromium.launch({ executablePath:'/usr/bin/google-chrome' });
const p = await b.newPage({viewport:{width:+process.argv[3],height:800}});
await p.goto('file:///workspace/mockups-v10-final/'+process.argv[2]+'.html');
console.log(await p.evaluate(new Function(process.argv[4])));
await b.close();
