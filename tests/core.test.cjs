const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game,OBJECTS,distance}=require('../src/core.js');
const object=id=>OBJECTS.find(o=>o.id===id);
function at(g,id,dx=0,dy=1){const o=object(id);g.p.x=o.x+dx;g.p.y=o.y+dy;g.p.a=Math.atan2(o.y-g.p.y,o.x-g.p.x);return o;}
function power(g){g.items.fuse=true;at(g,'panel');assert.equal(g.interact(),true);}
function frames(g,seconds,input={}){for(let t=0;t<seconds;t+=.05)g.update(.05,input);}
function walk(g,target,max=6000){
 let count=0,route=[];
 while(distance(g.p,target)>.62&&g.status==='playing'&&count++<max){
  if(!route.length||count%12===0)route=g.path(g.p,target);
  if(!route.length){if(Math.floor(g.p.x)===Math.floor(target.x)&&Math.floor(g.p.y)===Math.floor(target.y))route=[target];else throw new Error('No route to '+JSON.stringify(target));}
  while(route.length>1&&distance(g.p,route[0])<.18)route.shift();
  const next=route[0];g.p.a=Math.atan2(next.y-g.p.y,next.x-g.p.x);
  const door=g.doorAt(next.x,next.y);
  if(door&&!door.open&&distance(g.p,next)<1.7)g.interact();
  g.update(.05,{forward:1,sprint:true});
 }
 assert.ok(count<max,'Route finishes without getting stuck');
 assert.equal(g.status,'playing','Player survives route to '+target.id+' (player '+JSON.stringify(g.p)+', enemy '+JSON.stringify(g.e)+')');
 g.p.a=Math.atan2(target.y-g.p.y,target.x-g.p.x);
}
test('All objectives have a navigable route in their intended order',()=>{
 const g=new Game();assert.ok(g.path(g.p,object('fuse')).length);assert.equal(g.path(g.p,object('key')).length,0);
 g.items.fuse=true;assert.ok(g.path(object('fuse'),object('panel')).length);power(g);assert.ok(g.path(object('panel'),object('key')).length);assert.ok(g.path(object('key'),object('gate')).length);
});
test('Closed doors can be interacted with, and do not transmit sight',()=>{
 const g=new Game();g.p={...g.p,x:23.5,y:10.5,a:-Math.PI/2};assert.equal(g.interactable().id,'workshop_s');assert.equal(g.los(g.p,{x:23.5,y:8.5}),false);assert.equal(g.interact(),true);assert.equal(g.los(g.p,{x:23.5,y:8.5}),true);
});
test('Walls block movement and diagonal speed is bounded',()=>{
 const g=new Game();g.p={...g.p,x:1.3,y:12.5,a:Math.PI};frames(g,2,{forward:1});assert.ok(g.p.x>=1.19);const a=new Game(),b=new Game();a.update(.05,{forward:1});b.update(.05,{forward:1,strafe:1});assert.ok(Math.abs(distance(a.p,{x:6.5,y:22.5})-distance(b.p,{x:6.5,y:22.5}))<.001);
});
test('Inventory and electrical lock enforce the objective sequence',()=>{
 const g=new Game();at(g,'gate',0,-1);assert.equal(g.interact(),false);at(g,'panel');assert.equal(g.interact(),false);at(g,'fuse');assert.ok(g.interact());assert.equal(g.items.fuse,true);power(g);assert.equal(g.doors.filter(d=>d.locked).length,0);at(g,'key');assert.ok(g.interact());assert.equal(g.items.key,true);at(g,'gate',0,-1);assert.ok(g.interact());assert.equal(g.gateStarted,true);
});
test('Bottle makes an investigate target and uses inventory',()=>{
 const g=new Game();g.activateEnemy();g.p={...g.p,x:14.5,y:10.5,a:Math.PI};g.e.x=14.5;g.e.y=6.5;assert.equal(g.throwBottle(),true);assert.equal(g.items.bottles,1);assert.equal(g.e.mode,'investigate');assert.notEqual(g.e.target.x,g.p.x);
});
test('An unseen hiding player is protected, but seen hiding is remembered',()=>{
 const safe=new Game();at(safe,'hide_west');safe.activateEnemy();safe.e.x=2.5;safe.e.y=12.5;safe.e.a=-Math.PI/2;safe.interact();assert.equal(safe.p.hideExposed,false);frames(safe,2);assert.equal(safe.status,'playing');
 const seen=new Game();at(seen,'hide_west');seen.activateEnemy();seen.e.x=2.5;seen.e.y=16.5;seen.e.a=Math.PI/2;seen.e.mode='chase';seen.interact();assert.equal(seen.p.hideExposed,true);assert.ok(seen.e.knownHides.includes('hide_west'));
});
test('Enemy pursues a visible player and captures at contact',()=>{
 const g=new Game();g.activateEnemy();g.p={...g.p,x:14.5,y:9.5,a:0};g.e={...g.e,x:14.5,y:9,a:Math.PI/2};frames(g,1);assert.equal(g.status,'dead');
});
test('Electrical checkpoint survives reload and retry',()=>{
 const g=new Game();power(g);g.items.key=true;const saved=g.checkpoint,loaded=new Game(saved),retry=g.retry();assert.equal(loaded.items.power,true);assert.equal(loaded.items.key,false);assert.equal(retry.items.power,true);assert.equal(retry.items.key,false);assert.equal(retry.deaths,1);
});
test('A returning enemy checks known hiding spots without omniscient tracking',()=>{
 const g=new Game();at(g,'hide_west');g.activateEnemy();g.e.knownHides.push('hide_west');g.e.x=26.5;g.e.y=17.5;g.interact();assert.equal(g.p.hideExposed,false);g.update(.05);assert.notEqual(g.e.target?.x,g.p.x);
});
test('Gate opens over time, then the exit interaction wins',()=>{
 const g=new Game();power(g);g.items.key=true;at(g,'gate',0,-1);g.interact();g.e.active=false;frames(g,10.2);assert.equal(g.gate,1);assert.equal(g.status,'playing');g.interact();assert.equal(g.status,'won');
});
test('Enemy follows a route around shelves, opens doors and cannot cross walls',()=>{
 const g=new Game();power(g);g.p.hidden='hide_exit';g.activateEnemy();
 for(const target of [{x:26.5,y:21.5},{x:3.5,y:3.5},{x:14.5,y:19.5}]){
  g.e.mode='investigate';g.e.target=target;g.e.repath=0;g.e.search=8;let n=0;
  while(distance(g.e,target)>1&&n++<1300){g.update(.05);assert.ok(g.nav(Math.floor(g.e.x),Math.floor(g.e.y)),'Enemy stays on navigable tiles');}
  assert.ok(n<1300,'Enemy reaches '+JSON.stringify(target));
 }
});
test('A closing door cannot trap the enemy inside its collision cell',()=>{
 const g=new Game();g.p={...g.p,x:23.5,y:10.5,a:-Math.PI/2};g.doors.find(d=>d.id==='workshop_s').open=true;g.activateEnemy();g.e.x=23.5;g.e.y=9.5;assert.equal(g.interact(),false);assert.ok(g.doors.find(d=>d.id==='workshop_s').open);
});
test('Full physical walkthrough survives with normal enemy logic',()=>{
 const g=new Game();walk(g,object('fuse'));assert.ok(g.interact());walk(g,object('panel'));assert.ok(g.interact());walk(g,object('key'));assert.ok(g.interact());walk(g,object('gate'));assert.ok(g.interact());
 // Motor attracts him: wait in cover, then use a bottle if the gate is watched.
 const hide=object('hide_exit');walk(g,hide);g.interact();frames(g,12);if(g.status==='dead')throw new Error('Unsafe gate hiding');g.interact();g.p.a=0;g.throwBottle();walk(g,object('gate'));g.interact();assert.equal(g.status,'won');
});
