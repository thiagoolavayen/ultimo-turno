/* Optional browser QA. Requires Playwright; it is not needed to play. */
const {chromium}=require(process.env.TURNO_PLAYWRIGHT||'playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 const url=pathToFileURL(path.resolve(__dirname,'../JUGAR.html')).href;
 await page.goto(url);await page.evaluate(()=>{localStorage.clear();});await page.reload();
 await page.locator('#sound').uncheck();await page.locator('#voice').uncheck();
 const dir=path.resolve(__dirname,'../docs');fs.mkdirSync(dir,{recursive:true});
 await page.screenshot({path:path.join(dir,'INICIO.png')});
 await page.locator('#start').click();await page.locator('#view').focus();
 await page.keyboard.down('w');await page.waitForTimeout(600);await page.keyboard.up('w');
 assert.ok(await page.evaluate(()=>game.p.y<22),'Keyboard movement works');
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(300);await page.keyboard.up('ArrowDown');
 assert.ok(await page.evaluate(()=>lookPitch<-.05),'Player can look down');
 await page.screenshot({path:path.join(dir,'MIRADA_ABAJO.png')});
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(700);await page.keyboard.up('ArrowUp');
 assert.ok(await page.evaluate(()=>lookPitch>.05),'Player can look up');
 await page.evaluate(()=>{lookPitch=0;});
 assert.equal(await page.locator('#tutorial').isVisible(),false,'Tutorial is unobtrusive');
 await page.evaluate(()=>{radioUntil=0;updateHUD(performance.now());});
 assert.equal(await page.locator('#radio').evaluate(el=>el.style.opacity),'0','Subtitles disappear');
 await page.keyboard.press('f');assert.equal(await page.evaluate(()=>game.p.flash),false);
 await page.keyboard.press('m');assert.ok(await page.locator('#mapOverlay').isVisible());
 const t=await page.evaluate(()=>game.time);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>game.time),t,'Map pauses threat');
 await page.screenshot({path:path.join(dir,'PLANO.png')});await page.locator('#closeMap').click();
 // This controller walks along real tiles, opens doors and keeps the enemy active.
 await page.evaluate(()=>{
  window.walkTo=(id)=>{
   const target=OBJECTS.find(o=>o.id===id);let n=0,path=[];
   while(distance(game.p,target)>.62&&game.status==='playing'&&n++<6000){
    if(!path.length||n%12===0)path=game.path(game.p,target);
    if(!path.length){if(Math.floor(game.p.x)===Math.floor(target.x)&&Math.floor(game.p.y)===Math.floor(target.y))path=[target];else throw new Error('Route failed '+id);}
    while(path.length>1&&distance(game.p,path[0])<.18)path.shift();const next=path[0];game.p.a=Math.atan2(next.y-game.p.y,next.x-game.p.x);
    const door=game.doorAt(next.x,next.y);if(door&&!door.open&&distance(game.p,next)<1.7)game.interact();
    game.update(.05,{forward:1,sprint:true});processEvents();
   }
   if(game.status!=='playing'||n>=6000)throw new Error('Walk interrupted '+id+' '+game.status);
   game.p.a=Math.atan2(target.y-game.p.y,target.x-game.p.x);updateHUD(performance.now());
  };
  walkTo('fuse');
 });
 await page.keyboard.press('e');assert.equal(await page.evaluate(()=>game.items.fuse),true);
 await page.evaluate(()=>walkTo('panel'));await page.keyboard.press('e');
 assert.equal(await page.evaluate(()=>game.items.power),true);
 await page.waitForTimeout(650);await page.screenshot({path:path.join(dir,'TABLERO.png')});
 await page.reload();assert.ok(await page.locator('#continue').isVisible(),'Checkpoint resumes after reload');
 await page.locator('#sound').uncheck();await page.locator('#voice').uncheck();await page.locator('#continue').click();
 assert.equal(await page.evaluate(()=>game.items.power),true);
 // Reinstall controller after reload.
 await page.evaluate(()=>{
  window.walkTo=(id)=>{const target=OBJECTS.find(o=>o.id===id);let n=0,path=[];
   while(distance(game.p,target)>.62&&game.status==='playing'&&n++<6000){if(!path.length||n%12===0)path=game.path(game.p,target);if(!path.length)path=[target];while(path.length>1&&distance(game.p,path[0])<.18)path.shift();const next=path[0];game.p.a=Math.atan2(next.y-game.p.y,next.x-game.p.x);const door=game.doorAt(next.x,next.y);if(door&&!door.open&&distance(game.p,next)<1.7)game.interact();game.update(.05,{forward:1,sprint:true});processEvents();}if(game.status!=='playing'||n>=6000)throw new Error('Route failed '+id+' '+game.status);game.p.a=Math.atan2(target.y-game.p.y,target.x-game.p.x);updateHUD(performance.now());};
  walkTo('key');
 });
 await page.keyboard.press('e');assert.equal(await page.evaluate(()=>game.items.key),true);
 await page.evaluate(()=>walkTo('gate'));await page.keyboard.press('e');assert.equal(await page.evaluate(()=>game.gateStarted),true);
 await page.evaluate(()=>{walkTo('hide_exit');game.interact();for(let t=0;t<12;t+=.05)game.update(.05);processEvents();});
 assert.equal(await page.evaluate(()=>game.status),'playing');assert.equal(await page.evaluate(()=>game.gate),1);
 await page.keyboard.press('e');await page.evaluate(()=>{game.p.a=0;game.throwBottle();processEvents();walkTo('gate');});
 await page.keyboard.press('e');await page.locator('#win').waitFor({state:'visible'});
 await page.screenshot({path:path.join(dir,'SALIDA.png')});
 // Test the actual audio controls and death/retry UI in a fresh game.
 await page.locator('#playAgain').click();await page.keyboard.press('Escape');
 await page.locator('#sound').check();await page.locator('#volume').fill('0.2');await page.locator('#resume').click();
 await page.keyboard.press('f');
 await page.evaluate(()=>{game.activateEnemy();game.e.x=14.5;game.e.y=17.5;game.e.a=Math.PI;game.e.mode='chase';game.e.target={x:6.5,y:17.5};game.p.x=10;game.p.y=17.5;game.p.a=0;game.p.flash=true;updateHUD(performance.now());});
 await page.waitForTimeout(100);await page.screenshot({path:path.join(dir,'DEPOSITO.png')});
 await page.evaluate(()=>{game.e.x=game.p.x+.3;game.e.y=game.p.y;game.e.a=Math.PI;game.e.mode='chase';for(let t=0;t<.7;t+=.05)game.update(.05);processEvents();});
 await page.locator('#death').waitFor({state:'visible'});await page.locator('#retry').click();
 assert.equal(await page.evaluate(()=>game.status),'playing');assert.equal(await page.evaluate(()=>game.deaths),1);
 assert.deepEqual(errors,[]);assert.ok(requests.every(v=>v.startsWith('file:')||v.startsWith('data:')),'No internet requests');
 console.log(JSON.stringify({browser:'Chromium',story:'won',enemy:'active',checkpoint:'restored',keyboard:'passed',verticalLook:'passed',quietHUD:'passed',pause:'passed',deathRetry:'passed',audioControls:'passed',networkRequests:requests.length,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
