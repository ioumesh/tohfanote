import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.TEST_ORIGIN||'http://localhost:3000';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const results=[];const errors=[];const cleanups=[];
const check=(name)=>{results.push(name);console.log('PASS '+name);};
await mkdir('tests/results',{recursive:true});
try{
 const creator=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'});
 const page=await creator.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__audioStarts=0;const Original=window.AudioContext;window.AudioContext=class extends Original{constructor(...args){super(...args);window.__audioStarts++;}};});
 await page.goto(origin);await page.getByRole('heading',{name:/Some people/}).waitFor();
 await page.screenshot({path:'tests/results/home-desktop.png',fullPage:true});
 assert.equal(await page.locator('.occasions a').count(),14);assert.equal(await page.getByRole('link',{name:'Handmade Gifts Delhi'}).getAttribute('href'),'https://www.instagram.com/handmadegiftsdelhi/');
 await page.locator('summary').filter({hasText:'Is it really free?'}).click();assert.equal(await page.locator('details[open]').count(),1);check('Homepage categories and FAQ');
 await page.getByLabel('Who are we making smile?').fill('Alex');await page.getByRole('button',{name:'Create a Surprise'}).click();
 await page.getByRole('heading',{name:'First, the people.'}).waitFor();assert.equal(await page.getByLabel('Their name',{exact:true}).inputValue(),'Alex');
 await page.getByRole('button',{name:'Continue',exact:true}).click();assert.ok(await page.locator('input:invalid,textarea:invalid').count());
 await page.getByLabel('Your name',{exact:true}).fill('Sam');await page.getByLabel('Your letter',{exact:false}).fill('Happy birthday, Alex. Thank you for making ordinary days so wonderfully special. Here is to all our adventures still to come.');
 await page.locator('summary').filter({hasText:'Personalise the balloon wishes'}).click();
 await page.getByLabel('First wish',{exact:true}).fill('May we watch the sunrise together again.');
 await page.waitForTimeout(700);await page.reload();await page.getByRole('heading',{name:'First, the people.'}).waitFor();assert.equal(await page.getByLabel('Your name',{exact:true}).inputValue(),'Sam');check('Validation and draft restoration');
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('heading',{name:'Gather your little memories.'}).waitFor();
 const fixture=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=700;const x=c.getContext('2d');x.fillStyle='#e4c3c6';x.fillRect(0,0,600,700);x.fillStyle='#f9efdf';x.beginPath();x.arc(300,300,160,0,7);x.fill();x.fillStyle='#a16d84';x.font='70px Georgia';x.textAlign='center';x.fillText('our little',300,290);x.fillText('memories ♡',300,375);return c.toDataURL('image/png').split(',')[1];});
 const png=Buffer.from(fixture,'base64');const input=page.locator('input[type=file]');await input.setInputFiles([{name:'memory.png',mimeType:'image/png',buffer:png},{name:'memory2.png',mimeType:'image/png',buffer:png}]);
 await page.getByRole('img',{name:'Selected photo 2',exact:true}).waitFor();await page.getByRole('button',{name:'Move photo 2 earlier',exact:true}).click();await page.getByRole('button',{name:'Remove photo 2',exact:true}).click();assert.equal(await page.locator('.photo-tile').count(),1);
 await input.setInputFiles({name:'not-a-photo.txt',mimeType:'text/plain',buffer:Buffer.from('hello')});await page.getByRole('alert').filter({hasText:'Choose JPEG'}).waitFor();
 const noise=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1200;c.height=1000;const x=c.getContext('2d'),data=x.createImageData(c.width,c.height);let seed=123;for(let i=0;i<data.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;data.data[i]=seed&255;data.data[i+1]=(seed>>>8)&255;data.data[i+2]=(seed>>>16)&255;data.data[i+3]=255;}x.putImageData(data,0,0);return c.toDataURL('image/png').split(',')[1];});await input.setInputFiles({name:'detailed-photo.png',mimeType:'image/png',buffer:Buffer.from(noise,'base64')});await page.getByRole('img',{name:'Selected photo 2',exact:true}).waitFor();assert.ok((await page.getByRole('img',{name:'Selected photo 2',exact:true}).getAttribute('src')).length<=350000);check('Photo upload, resize, reorder, remove and invalid file handling');
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('heading',{name:'A few finishing touches.'}).waitFor();
 assert.equal(await page.locator('.builder-option[open]').count(),0);
 await page.locator('summary').filter({hasText:'Appearance and music'}).click();
 await page.getByRole('button',{name:'Lavender daydream'}).click();await page.getByLabel('A little background music').selectOption('starlight');
 await page.locator('summary').filter({hasText:'Opening time'}).click();await page.getByLabel('Schedule when they can open it').check();await page.getByLabel('Timezone',{exact:true}).selectOption('UTC');await page.getByLabel('Opening date',{exact:true}).fill(new Date(Date.now()+86400000).toISOString().slice(0,10));await page.getByLabel('Opening time',{exact:true}).fill('12:30');await page.waitForTimeout(700);await page.reload();await page.getByRole('heading',{name:'First, the people.'}).waitFor();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('summary').filter({hasText:'Opening time'}).click();assert.equal(await page.getByLabel('Schedule when they can open it').isChecked(),true);assert.equal(await page.getByLabel('Timezone',{exact:true}).inputValue(),'UTC');assert.ok(await page.getByLabel('Opening date',{exact:true}).inputValue());await page.getByLabel('Schedule when they can open it').uncheck();check('Schedule toggle, date and timezone survive draft reload');
 await page.getByRole('button',{name:'Preview gift'}).click();await page.getByRole('button',{name:'Open your surprise'}).waitFor();assert.equal(await page.evaluate(()=>window.__audioStarts),0);
 await page.getByRole('button',{name:'Open your surprise'}).click();await page.getByRole('heading',{name:/Happy birthday,/}).waitFor();
 await page.getByRole('button',{name:'Make a wish & blow out the candles'}).click();await page.getByRole('button',{name:'Light the candles again'}).waitFor();
 await page.getByRole('button',{name:'Play music',exact:true}).click();await page.getByRole('button',{name:'Pause music',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__audioStarts),1);await page.getByRole('button',{name:'Pause music'}).click();
 await page.locator('.gallery').focus();await page.keyboard.press('ArrowRight');assert.match(await page.locator('.gallery-controls').innerText(),/2 \/ 2/);
 await page.screenshot({path:'tests/results/birthday-desktop.png',fullPage:true});check('Preview, candle interaction, keyboard gallery, user-started music and reduced motion');
 for(const balloon of await page.locator('.gift-interaction-items button').all())await balloon.click();
 await page.getByRole('status').filter({hasText:'All three wishes are yours.'}).waitFor();await page.getByText('May we watch the sunrise together again.',{exact:true}).waitFor();check('Birthday balloon wishes persist from the draft into preview');

 await page.getByRole('button',{name:'Back to editing'}).click();await page.getByRole('button',{name:'Publish free'}).click();await page.getByRole('heading',{name:'Your surprise is ready.'}).waitFor();
 const giftLink=await page.getByLabel('Their gift link').inputValue();const management=await page.getByLabel('Management link — keep private').inputValue();const secretParams=new URLSearchParams(new URL(management).hash.slice(1));cleanups.push({id:secretParams.get('id'),key:secretParams.get('key')});
 assert.equal(await page.getByLabel('Management link — keep private').getAttribute('type'),'password');await page.getByRole('button',{name:'Show secret link',exact:true}).click();assert.equal(await page.getByLabel('Management link — keep private').getAttribute('type'),'text');await page.getByRole('button',{name:'Hide secret link',exact:true}).click();assert.equal(await page.getByRole('link',{name:'Edit or delete gift'}).getAttribute('href'),management);
 await page.getByRole('button',{name:'Copy Link',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),giftLink);
 assert.ok((await page.getByRole('link',{name:'Share by email'}).getAttribute('href')).includes(encodeURIComponent(giftLink)));assert.ok((await page.getByRole('link',{name:'Share on WhatsApp'}).getAttribute('href')).includes(encodeURIComponent(giftLink)));check('Publish, Copy Link, WhatsApp and email URLs');
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const recipient=await mobile.newPage();recipient.on('pageerror',e=>errors.push(e.message));
 await recipient.goto(giftLink);await recipient.getByRole('button',{name:'Open your surprise'}).waitFor();assert.equal(await recipient.evaluate(()=>localStorage.length),0);await recipient.screenshot({path:'tests/results/gift-mobile-opening.png',fullPage:true});
 await recipient.getByRole('button',{name:'Open your surprise'}).click();await recipient.getByRole('heading',{name:/Happy birthday,/}).waitFor();assert.ok(await recipient.locator('.personal-letter').innerText());await recipient.waitForFunction(()=>{const img=document.querySelector('.polaroid img');return img?.complete&&img.naturalWidth>0;},{},{timeout:20000});
 await recipient.screenshot({path:'tests/results/gift-mobile.png',fullPage:true});assert.equal(await recipient.evaluate(()=>document.documentElement.scrollWidth>390),false);
 const id=new URL(giftLink).searchParams.get('id');assert.equal((await recipient.request.get(`${origin}/api/gifts/${id}/manage`)).status(),404);check('Published gift opens in independent mobile browser without creator storage; management is protected');
 const editor=await creator.newPage();await editor.goto(management);await editor.getByRole('heading',{name:'First, the people.'}).waitFor();
 await editor.screenshot({path:'tests/results/management-desktop.png',fullPage:true});
 await editor.getByLabel('Your letter',{exact:false}).fill('An updated letter, saved safely. Alex, you make the world a better and brighter place. Happy birthday!');await editor.getByRole('button',{name:'Continue',exact:true}).click();await editor.getByRole('button',{name:'Continue',exact:true}).click();await editor.getByRole('button',{name:'Save changes'}).click();await editor.getByRole('heading',{name:'Your gift is updated.'}).waitFor();
 await recipient.reload();await recipient.getByRole('button',{name:'Open your surprise'}).click();await recipient.getByText(/An updated letter, saved safely/).waitFor();check('Protected edits persist and recipient link stays the same');
 await editor.getByRole('button',{name:'Delete this gift',exact:true}).click();await editor.getByRole('button',{name:'Keep my gift',exact:true}).click();assert.equal(await editor.getByRole('group',{name:'Confirm permanent deletion'}).count(),0);await editor.getByRole('button',{name:'Delete this gift',exact:true}).click();await editor.getByRole('button',{name:'Yes, permanently delete',exact:true}).click();await editor.getByRole('heading',{name:'Your gift has been deleted.'}).waitFor();await recipient.reload();await recipient.getByRole('alert').filter({hasText:'unavailable'}).waitFor();check('Protected deletion removes published gift');
 await recipient.goto(origin);await recipient.getByRole('heading',{name:/Some people/}).waitFor();await recipient.screenshot({path:'tests/results/home-mobile.png',fullPage:true});assert.equal(await recipient.evaluate(()=>document.documentElement.scrollWidth>390),false);
 await recipient.goto(origin+'/create/?occasion=birthday');await recipient.getByRole('heading',{name:'First, the people.'}).waitFor();await recipient.screenshot({path:'tests/results/builder-mobile.png',fullPage:true});assert.equal(await recipient.evaluate(()=>document.documentElement.scrollWidth>390),false);check('Desktop and 390px mobile layouts without horizontal overflow');
 const basic={occasion:'birthday',recipient:'Scheduled Alex',sender:'Sam',message:'A secret scheduled birthday letter.',photos:[],music:'none',theme:'blush',timezone:'UTC',opensAt:new Date(Date.now()+3500).toISOString()};
 const scheduleResponse=await creator.request.post(origin+'/api/gifts',{data:basic});assert.equal(scheduleResponse.status(),201);const timed=await scheduleResponse.json();cleanups.push(timed);await recipient.goto(origin+'/gift/?id='+timed.shareId);await recipient.getByRole('heading',{name:/A little early/}).waitFor();assert.ok(!(await recipient.locator('body').innerText()).includes('secret scheduled'));
 await recipient.getByRole('button',{name:'Open your surprise'}).waitFor({timeout:10000});check('Server-held schedule automatically unlocks');await creator.request.delete(`${origin}/api/gifts/${timed.id}/manage`,{headers:{Authorization:'Bearer '+timed.key}});
 await page.goto(origin+'/create/?occasion=bhai-dooj');
 await page.getByRole('heading',{name:'A card for your sibling'}).waitFor();
 await page.getByRole('button',{name:'My sister'}).click();
 await page.getByLabel('Their name',{exact:true}).fill('Didi');
 await page.getByLabel('Your name',{exact:true}).fill('Pawan');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:/Playful/}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByLabel('An important question',{exact:true}).fill('Save me a sweet, Didi!');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByRole('button',{name:/Preview without photos/}).click();
 await page.getByRole('heading',{name:'Happy Bhai Dooj, Didi.'}).waitFor();
 await page.getByRole('button',{name:/Back to editing/}).click();
 await page.locator('input[type=file]').setInputFiles({name:'memory.png',mimeType:'image/png',buffer:png});
 await page.getByRole('img',{name:'Selected photo 1'}).waitFor();
 await page.getByRole('button',{name:/Preview gift/}).click();
 await page.getByRole('button',{name:'Publish free',exact:true}).click();
 const bhaiLink=await page.getByLabel('Their gift link').inputValue();
 const bhaiKey=new URLSearchParams(new URL(await page.getByLabel('Management link — keep private').inputValue()).hash.slice(1));
 cleanups.push({id:bhaiKey.get('id'),key:bhaiKey.get('key')});
 await recipient.goto(bhaiLink);
 for(const action of ['Open your surprise','Light the diya','Place the tilak','Offer the sweets','Open the first note']){
  await recipient.getByRole('button',{name:action,exact:true}).click();
 }
 await recipient.getByText('Save me a sweet, Didi!',{exact:true}).waitFor();
 for(let index=0;index<2;index++)await recipient.getByRole('button',{name:'Open the next note'}).click();
 await recipient.getByRole('button',{name:'See the memories'}).click();
 await recipient.getByRole('img',{name:'Shared memory 1'}).waitFor();
 await recipient.getByRole('button',{name:'Replay gift'}).click();
 await recipient.getByRole('heading',{name:'Happy Bhai Dooj, Didi.'}).waitFor();
 check('Bhai Dooj sibling, bond, edited note, optional photos, preview publishing, thali and replay');
 for(const occasion of ['love','friendship','anniversary','proposal','apology','puzzle','diwali','favourite-light','dhanteras','garba','navratri']){
 const data={...basic,occasion,opensAt:null,revealNotes:occasion==='love'?['Your kindness makes every day better.']:occasion==='proposal'?['Will you build a life with me?']:occasion==='favourite-light'?['The first time we watched the stars.']:[],photos:occasion==='puzzle'?['data:image/png;base64,'+fixture]:[],milestones:occasion==='anniversary'?[{date:'2020',title:'Our first hello'},{date:'2026',title:'Still choosing you'}]:[]};const response=await creator.request.post(origin+'/api/gifts',{data});assert.equal(response.status(),201);const saved=await response.json();cleanups.push(saved);await recipient.goto(origin+'/gift/?id='+saved.shareId);await recipient.getByRole('button',{name:'Open your surprise'}).click();await recipient.locator('.personal-letter').waitFor();
 if(['diwali','favourite-light','dhanteras','garba','navratri'].includes(occasion)){
  const controls=recipient.locator('.gift-interaction-items button');
  for(let index=0;index<3;index++)await controls.nth(index).click();
  await recipient.getByRole('status').filter({hasText:{diwali:'filled with light','favourite-light':'lantern is glowing',dhanteras:'good things grow',garba:'invitation is open',navratri:'joyful Navratri'}[occasion]}).waitFor();
  await recipient.getByRole('button',{name:'Replay gift'}).click();
  await recipient.getByRole('button',{name:'Open your surprise'}).click();
  await recipient.getByRole('status').filter({hasText:'0 of 3 complete'}).waitFor();
 }
 if(occasion==='love'){await recipient.getByRole('button',{name:'Open note 1'}).click();await recipient.getByText('Your kindness makes every day better.',{exact:true}).waitFor();}
 if(occasion==='anniversary')await recipient.getByRole('heading',{name:'Our first hello'}).waitFor();
 if(occasion==='proposal'){await recipient.getByRole('button',{name:'There’s something I want to ask…'}).click();await recipient.getByRole('heading',{name:'Will you build a life with me?'}).waitFor();await recipient.getByRole('button',{name:'I need a little time'}).click();await recipient.getByText('Take all the time you need.',{exact:false}).waitFor();}
 if(occasion==='puzzle'){const tiles=[4,1,7,0,8,3,6,2,5];for(let i=0;i<9;i++){if(tiles[i]===i)continue;const j=tiles.indexOf(i);await recipient.locator('.puzzle button').nth(i).click();await recipient.locator('.puzzle button').nth(j).click();[tiles[i],tiles[j]]=[tiles[j],tiles[i]];}await recipient.getByRole('status').filter({hasText:'You found our little picture'}).waitFor();}
 await creator.request.delete(`${origin}/api/gifts/${saved.id}/manage`,{headers:{Authorization:'Bearer '+saved.key}});check('Reusable '+occasion+' gift flow');
 }
 assert.deepEqual(errors,[]);check('No browser JavaScript errors');
 await writeFile('tests/results/browser-results.json',JSON.stringify({origin,checks:results,errors,verifiedAt:new Date().toISOString()},null,2));
}finally{for(const item of cleanups){try{await fetch(`${origin}/api/gifts/${item.id}/manage`,{method:'DELETE',headers:{Authorization:'Bearer '+item.key}});}catch{}}await browser.close();}
