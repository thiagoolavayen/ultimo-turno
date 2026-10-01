/* Último Turno — deterministic game simulation; usable in a browser or Node. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Turno=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=29,H=25,TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angle=(a,b)=>{let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;};
const copy=v=>JSON.parse(JSON.stringify(v));
const BASE=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x===0||y===0||x===W-1||y===H-1?1:0));
function line(x1,y1,x2,y2,t=1){for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)BASE[y][x]=t;}
line(10,1,10,9);line(1,9,10,9);line(19,1,19,9);line(19,9,27,9);
for(const x of [4,10,16,22]){line(x,11,x+2,15,2);line(x,18,x+2,20,2);}
line(19,19,19,23);line(19,19,27,19);
const DOORS=[
 {id:'office_s',x:5,y:9,label:'OFICINA',locked:true},
 {id:'office_e',x:10,y:5,label:'OFICINA',locked:true},
 {id:'workshop_s',x:23,y:9,label:'TALLER',locked:false},
 {id:'workshop_e',x:19,y:5,label:'TALLER',locked:false},
 {id:'utility_w',x:19,y:22,label:'TABLERO',locked:false},
 {id:'utility_n',x:25,y:19,label:'TABLERO',locked:false}
];
DOORS.forEach(d=>BASE[d.y][d.x]=3);
for(let x=3;x<=6;x++)BASE[24][x]=4;
const OBJECTS=[
 {id:'fuse',type:'fuse',x:25.5,y:3.5,label:'Fusible de repuesto',height:.8},
 {id:'panel',type:'panel',x:26.5,y:21.5,label:'Tablero eléctrico',height:1.7},
 {id:'key',type:'key',x:3.5,y:3.5,label:'Llave del portón',height:.85},
 {id:'gate',type:'gate',x:4.5,y:23.55,label:'Portón de salida',height:2.6},
 {id:'hide_office',type:'hide',x:8.5,y:3.5,label:'Armario de oficina',height:2.1},
 {id:'hide_workshop',type:'hide',x:21.5,y:3.5,label:'Armario del taller',height:2.1},
 {id:'hide_west',type:'hide',x:2.5,y:17.5,label:'Armario de limpieza',height:2.1},
 {id:'hide_center',type:'hide',x:14.5,y:19.5,label:'Armario de mantenimiento',height:2.1},
 {id:'hide_exit',type:'hide',x:2.5,y:22.5,label:'Armario del muelle',height:2.1},
 {id:'bottle_start',type:'bottle',x:7.5,y:22.5,label:'Botella vacía',height:.65},
 {id:'bottle_center',type:'bottle',x:14.5,y:17.5,label:'Botella vacía',height:.65},
 {id:'bottle_north',type:'bottle',x:17.5,y:4.5,label:'Botella vacía',height:.65}
];
const PATROL=[{x:14.5,y:6.5},{x:14.5,y:10.5},{x:20.5,y:17.5},{x:8.5,y:17.5},{x:2.5,y:11.5}];
class Game {
 constructor(save=null){
  this.p={x:6.5,y:22.5,a:-Math.PI/2,flash:true,stamina:100,hidden:null,hideExposed:false};
  this.e={x:14.5,y:6.5,a:Math.PI/2,mode:'dormant',active:false,grace:0,path:[],target:null,repath:0,seenAgo:99,search:0,patrol:0,doorWait:0,knownHides:[],capture:0,inspectHide:null,nextHideCheck:0};
  this.doors=DOORS.map(d=>({...d,open:false}));this.items={fuse:false,power:false,key:false,bottles:2};
  this.collected=[];this.gate=0;this.gateStarted=false;this.time=0;this.status='playing';this.events=[];this.foot=0;this.noise=0;this.danger=0;this.invulnerable=0;
  this.scareFlags={glimpse:false,power:false,key:false};this.checkpoint=null;this.deaths=0;
  if(save)this.load(save);else this.setCheckpoint();
 }
 load(save){
  if(!save||save.version!==1||!save.items||!save.doors)throw new Error('Partida incompatible.');
  this.items={...this.items,...copy(save.items)};this.doors=this.doors.map(d=>({...d,...(save.doors.find(v=>v.id===d.id)||{})}));
  this.collected=Array.isArray(save.collected)?copy(save.collected):[];this.scareFlags={...this.scareFlags,...save.scareFlags};
  const p=save.p||{};if(Number.isFinite(p.x)&&Number.isFinite(p.y)&&!this.solid(p.x,p.y)){this.p.x=p.x;this.p.y=p.y;this.p.a=Number.isFinite(p.a)?p.a:-Math.PI/2;}
  this.time=Number.isFinite(save.time)?save.time:0;this.deaths=save.deaths||0;this.e.knownHides=Array.isArray(save.knownHides)?copy(save.knownHides):[];
  if(this.items.fuse)this.activateEnemy(14);this.setCheckpoint();
 }
 export(){return {version:1,items:copy(this.items),doors:copy(this.doors),collected:copy(this.collected),scareFlags:copy(this.scareFlags),p:{x:this.p.x,y:this.p.y,a:this.p.a},time:this.time,knownHides:copy(this.e.knownHides),deaths:this.deaths};}
 setCheckpoint(){this.checkpoint=this.export();this.emit('save',{save:this.checkpoint});}
 retry(){const next=new Game(this.checkpoint);next.deaths=this.deaths+1;next.invulnerable=3;next.events=next.events.filter(e=>e.type!=='save');next.setCheckpoint();next.emit('radio',{text:'Seguís desde el último objetivo completado. Tenés unos segundos para orientarte.'});return next;}
 emit(type,payload={}){this.events.push({type,...payload});}
 drain(){return this.events.splice(0);}
 doorAt(x,y){return this.doors.find(d=>d.x===Math.floor(x)&&d.y===Math.floor(y));}
 material(x,y){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=W||y>=H)return 1;const t=BASE[y][x];if(t===3)return this.doorAt(x,y).open?0:3;if(t===4)return this.gate>=1?0:4;return t;}
 solid(x,y){return this.material(x,y)!==0;}
 nav(x,y){if(x<1||y<1||x>=W-1||y>=H-1)return false;const t=BASE[y][x];return t===0||(t===3&&!this.doorAt(x,y).locked);}
 clear(x,y,r=.2){return !this.solid(x-r,y-r)&&!this.solid(x+r,y-r)&&!this.solid(x-r,y+r)&&!this.solid(x+r,y+r);}
 los(a,b,ignoreEnd=false){const d=distance(a,b),steps=Math.ceil(d/.08);for(let i=1;i<steps;i++){const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(ignoreEnd&&Math.floor(x)===Math.floor(b.x)&&Math.floor(y)===Math.floor(b.y))continue;if(this.solid(x,y))return false;}return true;}
 path(from,to){
  const start={x:Math.floor(from.x),y:Math.floor(from.y)},goal={x:Math.floor(to.x),y:Math.floor(to.y)};
  if(!this.nav(goal.x,goal.y))return [];
  const key=(x,y)=>y*W+x,parents=new Map([[key(start.x,start.y),null]]),queue=[start];let found=false;
  for(let head=0;head<queue.length;head++){
   const p=queue[head];if(p.x===goal.x&&p.y===goal.y){found=true;break;}
   for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(this.nav(x,y)&&!parents.has(k)){parents.set(k,p);queue.push({x,y});}}
  }
  if(!found)return [];const result=[];let cur=goal;
  while(cur&&!(cur.x===start.x&&cur.y===start.y)){result.push({x:cur.x+.5,y:cur.y+.5});cur=parents.get(key(cur.x,cur.y));}
  return result.reverse();
 }
 objective(){
  if(this.status==='won')return {id:'won',title:'Saliste del depósito',detail:'El turno terminó.',target:null};
  if(!this.items.fuse)return {id:'fuse',title:'1 · Buscá el fusible en el taller',detail:'Seguí la flecha amarilla. Abrí las puertas con E.',target:OBJECTS[0]};
  if(!this.items.power)return {id:'panel',title:'2 · Colocá el fusible en el tablero',detail:'El tablero está en el cuarto eléctrico, junto al muelle.',target:OBJECTS[1]};
  if(!this.items.key)return {id:'key',title:'3 · Buscá la llave en la oficina',detail:'La corriente liberó las puertas de la oficina.',target:OBJECTS[2]};
  if(!this.gateStarted)return {id:'gate',title:'4 · Activá el portón de salida',detail:'Volvé al muelle. El motor va a hacer ruido.',target:OBJECTS[3]};
  if(this.gate<1)return {id:'wait',title:'El portón está subiendo · buscá cobertura',detail:'Podés alejarte o esconderte mientras termina de abrir.',target:OBJECTS[3]};
  return {id:'exit',title:'¡Salí por el portón!',detail:'Acercate al portón y presioná E, o cruzalo.',target:OBJECTS[3]};
 }
 zone(){const p=this.p;if(p.y<9&&p.x<10)return 'OFICINA';if(p.y<9&&p.x>19)return 'TALLER';if(p.x>19&&p.y>19)return 'CUARTO ELÉCTRICO';if(p.y>20)return 'MUELLE DE CARGA';return 'DEPÓSITO';}
 available(){return OBJECTS.filter(o=>!(o.type==='fuse'&&this.items.fuse)&&!(o.type==='key'&&this.items.key)&&!(o.type==='bottle'&&this.collected.includes(o.id)));}
 interactable(){
  if(this.p.hidden)return {id:this.p.hidden,type:'leave_hide',label:'Salir del escondite'};
  const candidates=this.available().concat(this.doors.map(d=>({id:d.id,type:'door',x:d.x+.5,y:d.y+.5,label:d.label,door:d})));
  return candidates.map(o=>({...o,d:distance(this.p,o)})).filter(o=>o.d<1.75&&Math.abs(angle(Math.atan2(o.y-this.p.y,o.x-this.p.x),this.p.a))<1.25&&this.los(this.p,o,o.type==='door')).sort((a,b)=>a.d-b.d)[0]||null;
 }
 prompt(){const o=this.interactable();if(!o)return null;
  if(o.type==='door')return {object:o,text:o.door.locked?'Oficina sin corriente · primero repará el tablero':`E · ${o.door.open?'Cerrar':'Abrir'} puerta · ${o.label}`};
  if(o.type==='hide')return {object:o,text:'E · Esconderte · '+o.label};
  if(o.type==='leave_hide')return {object:o,text:'E · Salir del escondite'};
  if(o.type==='panel')return {object:o,text:this.items.power?'Corriente restablecida':this.items.fuse?'E · Colocar fusible y dar corriente':'Falta el fusible del taller'};
  if(o.type==='gate')return {object:o,text:this.gate>=1?'E · Escapar':this.gateStarted?'El portón está subiendo…':!this.items.power?'El portón necesita corriente':!this.items.key?'Falta la llave de la oficina':'E · Abrir el portón'};
  return {object:o,text:'E · Recoger '+(o.type==='fuse'?'fusible':o.type==='key'?'llave':'botella')};
 }
 interact(){
  if(this.status!=='playing')return false;const o=this.interactable();if(!o){this.emit('hint',{text:'Acercate y mirá el objeto. La pantalla te indica cuándo podés usar E.'});return false;}
  if(o.type==='leave_hide'){this.p.hidden=null;this.p.hideExposed=false;this.invulnerable=.6;this.emit('hide',{active:false});return true;}
  if(o.type==='door'){
   if(o.door.locked){this.emit('hint',{text:'La cerradura eléctrica está bloqueada. Primero repará el tablero.'});return false;}
   if(o.door.open&&Math.floor(this.p.x)===o.door.x&&Math.floor(this.p.y)===o.door.y){this.emit('hint',{text:'Apartate del marco para cerrar la puerta.'});return false;}
   if(o.door.open&&this.e.active&&Math.floor(this.e.x)===o.door.x&&Math.floor(this.e.y)===o.door.y){this.emit('hint',{text:'Hay alguien en el marco. ¡Alejate de esa puerta!'});return false;}
   o.door.open=!o.door.open;this.makeNoise(o,7);this.emit('sound',{name:'door',pos:o});return true;
  }
  if(o.type==='hide'){
   const seen=this.e.active&&this.e.grace<=0&&distance(this.p,this.e)<13&&this.los(this.e,this.p)&&(this.e.mode==='chase'||this.canSeePlayer());
   this.p.hidden=o.id;this.p.flash=false;this.p.hideExposed=seen;
   if(seen&&!this.e.knownHides.includes(o.id))this.e.knownHides.push(o.id);
   if(this.p.hideExposed){this.e.target={x:this.p.x,y:this.p.y};this.e.mode='investigate';this.e.repath=0;}
   this.emit('hide',{active:true});this.emit('hint',{text:seen?'Te vio entrar en este escondite. ¡Salí y buscá otro!':this.e.knownHides.includes(o.id)?'Ya conoce este escondite: puede volver a revisarlo. Escuchá los pasos.':'Estás oculto. Escuchá sus pasos y esperá a que se aleje.'});return true;
  }
  if(o.type==='bottle'){
   if(this.items.bottles>=3){this.emit('hint',{text:'Ya tenés tres botellas. Usá Q para distraerlo.'});return false;}
   this.items.bottles++;this.collected.push(o.id);this.emit('sound',{name:'pickup'});this.emit('hint',{text:'Botella recogida. Q la arroja hacia donde mirás.'});return true;
  }
  if(o.type==='fuse'){
   this.items.fuse=true;this.activateEnemy(12);this.emit('sound',{name:'clang',pos:{x:17.5,y:8.5}});this.emit('scare',{kind:'fuse',seconds:.35});
   this.emit('radio',{text:'Bien. Llevá el fusible al tablero del muelle.'});this.setCheckpoint();return true;
  }
  if(o.type==='panel'){
   if(this.items.power){this.emit('hint',{text:'El tablero ya funciona. Seguí el objetivo de arriba.'});return false;}
   if(!this.items.fuse){this.emit('hint',{text:'Necesitás el fusible de repuesto del taller.'});return false;}
   this.items.power=true;this.doors.filter(d=>d.id.startsWith('office')).forEach(d=>d.locked=false);this.scareFlags.power=true;
   this.makeNoise(o,45);this.emit('sound',{name:'power',pos:o});this.emit('scare',{kind:'power',seconds:1.1});
   this.emit('radio',{text:'Volvió la luz. La llave está en la oficina.'});this.setCheckpoint();return true;
  }
  if(o.type==='key'){
   if(!this.items.power){this.emit('hint',{text:'Primero restablecé la corriente.'});return false;}
   this.items.key=true;this.emit('sound',{name:'pickup'});this.emit('radio',{text:'Ahora sí. Volvé al portón.'});this.setCheckpoint();return true;
  }
  if(o.type==='gate'){
   if(this.gate>=1){this.win();return true;}
   if(!this.items.power||!this.items.key){this.emit('hint',{text:!this.items.power?'Restablecé la corriente para mover el portón.':'Buscá la llave en la oficina.'});return false;}
   if(this.gateStarted)return false;
   this.gateStarted=true;this.makeNoise(o,60);this.e.grace=Math.max(this.e.grace,1.5);this.emit('sound',{name:'gate',pos:o});
   this.emit('radio',{text:'Está subiendo. Buscá dónde cubrirte.'});return true;
  }
  return false;
 }
 activateEnemy(grace=0){this.e.active=true;this.e.mode='patrol';this.e.grace=grace;this.e.target=copy(PATROL[0]);}
 toggleFlash(){if(this.p.hidden){this.emit('hint',{text:'La linterna queda apagada mientras estás escondido.'});return;}this.p.flash=!this.p.flash;this.emit('sound',{name:'switch'});}
 throwBottle(){
  if(this.status!=='playing'||this.p.hidden)return false;
  if(!this.items.bottles){this.emit('hint',{text:'No quedan botellas. Podés recoger las que encuentres.'});return false;}
  let target={x:this.p.x,y:this.p.y};for(let d=.5;d<=6;d+=.15){const n={x:this.p.x+Math.cos(this.p.a)*d,y:this.p.y+Math.sin(this.p.a)*d};if(this.solid(n.x,n.y))break;target=n;}
  this.items.bottles--;this.makeNoise(target,22);this.emit('bottle',{pos:target});this.emit('sound',{name:'glass',pos:target});this.emit('hint',{text:'La botella se rompió. Alejate del ruido.'});return true;
 }
 makeNoise(pos,radius){
  this.noise=1;
  if(!this.e.active)return;const path=this.path(this.e,pos);
  if((path.length||distance(this.e,pos)<1)&&path.length<=radius&&!(this.e.mode==='chase'&&this.e.seenAgo<1)){
   this.e.target={x:pos.x,y:pos.y};this.e.mode='investigate';this.e.repath=0;this.e.search=7;
  }
 }
 canSeePlayer(){
  if(this.p.hidden)return false;const d=distance(this.e,this.p),max=this.items.power?10:this.p.flash?12:4.3;
  return d<max&&(d<2.3||Math.abs(angle(Math.atan2(this.p.y-this.e.y,this.p.x-this.e.x),this.e.a))<1.22)&&this.los(this.e,this.p);
 }
 movePlayer(dt,input){
  this.p.a+=clamp(input.turn||0,-1,1)*dt*1.9+(input.mouse||0);
  if(this.p.hidden)return;
  let f=clamp(input.forward||0,-1,1),s=clamp(input.strafe||0,-1,1);const len=Math.hypot(f,s);if(len>1){f/=len;s/=len;}
  const sprint=input.sprint&&this.p.stamina>3&&len>.1,speed=sprint?3.95:2.35;
  this.p.stamina=clamp(this.p.stamina+(sprint?-17:16)*dt,0,100);
  const dx=(Math.cos(this.p.a)*f-Math.sin(this.p.a)*s)*speed*dt,dy=(Math.sin(this.p.a)*f+Math.cos(this.p.a)*s)*speed*dt;
  const old={x:this.p.x,y:this.p.y};if(this.clear(this.p.x+dx,this.p.y))this.p.x+=dx;if(this.clear(this.p.x,this.p.y+dy))this.p.y+=dy;
  const moved=distance(old,this.p);this.foot+=moved;
  if(this.foot>(sprint?.85:1.3)){this.foot=0;this.emit('sound',{name:'step',pos:this.p});this.makeNoise(this.p,sprint?13:2);}
 }
 updateEnemy(dt){
  const e=this.e;if(!e.active)return;e.grace=Math.max(0,e.grace-dt);e.seenAgo+=dt;
  if(e.grace<=0&&this.canSeePlayer()){
   const fresh=e.mode!=='chase';e.mode='chase';e.target={x:this.p.x,y:this.p.y};e.seenAgo=0;e.repath=Math.min(e.repath,.2);if(fresh)this.emit('chase',{active:true});
  }
  if(e.mode==='chase'&&e.seenAgo>2.6){e.mode='investigate';e.search=8;this.emit('chase',{active:false});}
  if(e.mode==='patrol'&&this.time>e.nextHideCheck){
   const spot=OBJECTS.find(o=>e.knownHides.includes(o.id)&&distance(e,o)<6);
   e.nextHideCheck=this.time+16;
   if(spot){e.inspectHide=spot.id;e.target={x:spot.x,y:spot.y};e.mode='investigate';e.search=5;e.repath=0;}
  }
  if(e.inspectHide){const spot=OBJECTS.find(o=>o.id===e.inspectHide);if(spot&&distance(e,spot)<1.1){
   if(this.p.hidden===spot.id){this.p.hideExposed=true;e.target={x:this.p.x,y:this.p.y};e.repath=0;this.emit('hint',{text:'Está revisando el escondite que ya conoce. ¡Salí!'});}
   e.inspectHide=null;
  }}
  if(this.p.hidden&&this.p.hideExposed){e.target={x:this.p.x,y:this.p.y};e.mode='investigate';}
  if(!e.target)e.target=copy(PATROL[e.patrol%PATROL.length]);
  e.repath-=dt;
  if(e.repath<=0){e.path=this.path(e,e.target);e.repath=e.mode==='chase'?.35:1.1;}
  if(e.path.length){
   const next=e.path[0],d=distance(e,next),door=this.doorAt(next.x,next.y);
   if(door&&!door.open){e.doorWait+=dt;if(e.doorWait>1.4){door.open=true;e.doorWait=0;this.emit('sound',{name:'door',pos:next});}}
   else {e.doorWait=0;const speed=e.grace>0?.85:e.mode==='chase'?2.2:e.mode==='investigate'?(this.gateStarted?2.15:1.4):1.0,step=Math.min(d,speed*dt);
    if(d>.001){e.a=Math.atan2(next.y-e.y,next.x-e.x);const nx=e.x+(next.x-e.x)/d*step,ny=e.y+(next.y-e.y)/d*step;if(this.clear(nx,e.y,.16))e.x=nx;if(this.clear(e.x,ny,.16))e.y=ny;}
    if(d<.13)e.path.shift();
   }
  }else if(distance(e,e.target)<1.25){
   if(e.mode==='investigate'){e.search-=dt;e.a+=dt*.7;if(e.search<=0){e.mode='patrol';e.patrol=(e.patrol+1)%PATROL.length;e.target=copy(PATROL[e.patrol]);e.repath=0;}}
   else if(e.mode==='patrol'){e.patrol=(e.patrol+1)%PATROL.length;e.target=copy(PATROL[e.patrol]);e.repath=0;}
  }
  const d=distance(e,this.p),visible=this.los(e,this.p);
  this.danger=clamp(1-d/10,0,1)*(visible?1:.55);
  if(e.grace<=0&&this.invulnerable<=0&&d<.8&&visible&&(!this.p.hidden||this.p.hideExposed)){e.capture+=dt;if(e.capture>.4)this.die();}else e.capture=0;
 }
 update(dt,input={}){
  if(this.status!=='playing')return;dt=clamp(dt,0,.06);this.time+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.noise=Math.max(0,this.noise-dt*.65);
  this.movePlayer(dt,input);this.updateEnemy(dt);
  if(this.gateStarted&&this.gate<1){this.gate=Math.min(1,this.gate+dt/10);if(this.gate>=1){this.emit('sound',{name:'gate_end'});this.emit('radio',{text:'¡Está abierto! Volvé al muelle y salí por el portón.'});}}
  if(this.gate>=1&&this.p.y>23.7&&this.p.x>3&&this.p.x<7)this.win();
  if(!this.scareFlags.glimpse&&this.time>16&&!this.items.fuse){this.scareFlags.glimpse=true;this.emit('sound',{name:'clang',pos:{x:14.5,y:6.5}});this.emit('radio',{text:'¿Escuchaste eso? Pensé que estábamos solos.'});}
 }
 die(){if(this.status!=='playing')return;this.status='dead';this.emit('death');}
 win(){if(this.status!=='playing')return;this.status='won';this.emit('win');}
}
return {Game,W,H,BASE,DOORS,OBJECTS,PATROL,angle,distance,clamp};
});
