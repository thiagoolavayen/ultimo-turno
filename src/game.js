'use strict';
const $=id=>document.getElementById(id),{Game,W,H,BASE,OBJECTS,DOORS,angle,distance,clamp}=Turno;
const canvas=$('view'),ctx=canvas.getContext('2d'),SAVE_KEY='ultimo-turno-v1';
let game=new Game(),started=false,paused=true,keys={},mouse=0,mouseY=0,lookPitch=0,lastFrame=0,radioUntil=0,toastUntil=0,flickerUntil=0,deathUntil=0,enemyStep=0,tutorial=0,route=[],routeAt=0,saveData=null;
const textures={},sprites={},settings=document.querySelector('.settings'),settingsParent=settings.parentElement,settingsNext=settings.nextElementSibling;
const audio={ac:null,master:null,hum:null};
function toast(text,seconds=4){$('toast').textContent=text;$('toast').classList.remove('hidden');toastUntil=performance.now()+seconds*1000;}
function readSave(){try{const raw=localStorage.getItem(SAVE_KEY);return raw?JSON.parse(raw):null;}catch(e){return null;}}
function writeSave(save){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));saveData=save;}catch(e){toast('El navegador no permitió guardar. Podés seguir jugando y reintentar en esta sesión.');}}
function eraseSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}saveData=null;}
saveData=readSave();if(saveData&&saveData.version===1)$('continue').classList.remove('hidden');
function resize(){const w=Math.min(960,Math.max(640,window.innerWidth));canvas.width=w;canvas.height=Math.round(w*window.innerHeight/window.innerWidth);}
window.addEventListener('resize',resize);resize();
if(matchMedia('(prefers-reduced-motion: reduce)').matches)$('effects').checked=false;
function setupAudio(){
 if(audio.ac){audio.ac.resume();return;}
 try{const AC=window.AudioContext||window.webkitAudioContext;audio.ac=new AC();audio.master=audio.ac.createGain();audio.master.gain.value=$('sound').checked?Number($('volume').value):0;audio.master.connect(audio.ac.destination);
  const hum=audio.ac.createGain();hum.gain.value=.027;hum.connect(audio.master);audio.hum=hum;
  for(const f of [43,67]){const o=audio.ac.createOscillator();o.type='sine';o.frequency.value=f;o.connect(hum);o.start();}
 }catch(e){audio.ac=null;}
}
function sound(name,pos=null){
 if(!audio.ac||!$('sound').checked)return;const ac=audio.ac,t=ac.currentTime,amp=ac.createGain(),pan=ac.createStereoPanner();
 let vol=.14,dur=.15,f=75,noise=false;
 const spec={step:[.065,.08,68,false],enemy:[.17,.13,52,false],door:[.24,.32,85,true],pickup:[.08,.18,520,false],switch:[.04,.035,1200,true],clang:[.33,.9,150,true],glass:[.2,.55,1500,true],power:[.25,1.1,120,true],gate:[.23,1.6,60,true],gate_end:[.28,.5,65,true],death:[.75,.7,100,true]};
 [vol,dur,f,noise]=spec[name]||[vol,dur,f,noise];
 if(pos){const d=distance(game.p,pos);vol*=clamp(1-d/28,.08,1);pan.pan.value=clamp(Math.sin(angle(Math.atan2(pos.y-game.p.y,pos.x-game.p.x),game.p.a)),-1,1);}else pan.pan.value=0;
 amp.gain.setValueAtTime(.001,t);amp.gain.exponentialRampToValueAtTime(vol,t+.012);amp.gain.exponentialRampToValueAtTime(.001,t+dur);amp.connect(pan);pan.connect(audio.master);
 if(noise){const buffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*dur),ac.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=ac.createBufferSource(),filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=f*7;source.buffer=buffer;source.connect(filter);filter.connect(amp);source.start(t);source.stop(t+dur);}else{const o=ac.createOscillator();o.type='triangle';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(22,f*.35),t+dur);o.connect(amp);o.start(t);o.stop(t+dur);}
}
function radio(text){
 $('radioText').textContent=text;$('radio').style.opacity='1';radioUntil=performance.now()+Math.min(7000,2000+text.length*45);
 if($('sound').checked&&$('voice').checked&&'speechSynthesis'in window){speechSynthesis.cancel();const voice=speechSynthesis.getVoices().filter(v=>v.lang.startsWith('es')&&v.localService).sort((a,b)=>(/Natural|Neural|Google|Elena|Sabina/i.test(b.name)?1:0)-(/Natural|Neural|Google|Elena|Sabina/i.test(a.name)?1:0))[0];if(voice){const u=new SpeechSynthesisUtterance(text);u.lang=voice.lang;u.voice=voice;u.rate=1;u.pitch=1;u.volume=Number($('volume').value)*.9;speechSynthesis.speak(u);}}
}
function processEvents(){
 for(const event of game.drain()){
  if(event.type==='sound')sound(event.name,event.pos);
  if(event.type==='hint')toast(event.text,5);
  if(event.type==='radio')radio(event.text);
  if(event.type==='save')writeSave(event.save);
  if(event.type==='chase'&&event.active)toast('Te vio. ¡Corré y cortá su línea de visión!',3);
  if(event.type==='scare')flickerUntil=performance.now()+event.seconds*1000;
  if(event.type==='hide')keys={};
  if(event.type==='death'){sound('death');deathUntil=performance.now()+700;keys={};document.exitPointerLock?.();window.speechSynthesis?.cancel();setTimeout(()=>{$('deathAdvice').textContent=game.p.hideExposed?'Te vio entrar en ese escondite. Primero doblá una esquina o cerrá una puerta; después escondete.':'Cortá su línea de visión entre las estanterías. Podés cerrar puertas o distraerlo con Q.';$('death').classList.remove('hidden');paused=true;},750);}
  if(event.type==='win'){paused=true;keys={};document.exitPointerLock?.();eraseSave();$('win').classList.remove('hidden');$('resultTime').textContent=`TIEMPO ${Math.floor(game.time/60)}:${String(Math.floor(game.time%60)).padStart(2,'0')}`;$('resultRetries').textContent=`REINTENTOS ${game.deaths}`;radio('Ya estás afuera. No vuelvas a entrar.');}
 }
}
function startGame(saved=null){
 try{game=new Game(saved);}catch(e){game=new Game();toast('La partida guardada no pudo abrirse. Comenzó un turno nuevo.');}
 started=true;paused=false;keys={};tutorial=3;lookPitch=0;mouse=mouseY=0;routeAt=0;setupAudio();
 for(const id of ['intro','pause','death','win','mapOverlay'])$(id).classList.add('hidden');$('hud').classList.remove('hidden');
 settingsParent.insertBefore(settings,settingsNext);$('tutorial').classList.add('hidden');
 processEvents();radio(saved?'Seguís desde el último punto de control.':'Estoy acá. Primero necesitamos el fusible del taller.');canvas.focus();
}
function restart(){if(!confirm('¿Empezar un turno nuevo y borrar el punto de control?'))return;eraseSave();startGame();}
$('start').onclick=()=>{if(saveData&&!confirm('¿Comenzar un turno nuevo y borrar la partida guardada?'))return;startGame();};
$('continue').onclick=()=>startGame(saveData);
$('restart').onclick=restart;$('deathRestart').onclick=restart;$('playAgain').onclick=()=>startGame();
$('retry').onclick=()=>{game=game.retry();paused=false;keys={};deathUntil=0;routeAt=0;$('death').classList.add('hidden');processEvents();canvas.focus();};
function pauseGame(){if(!started||game.status!=='playing')return;paused=true;keys={};document.exitPointerLock?.();$('pause').classList.remove('hidden');$('pauseSettings').append(settings);}
function resumeGame(){if(game.status!=='playing')return;paused=false;keys={};$('pause').classList.add('hidden');$('mapOverlay').classList.add('hidden');canvas.focus();}
function showMap(){if(!started||game.status!=='playing')return;paused=true;keys={};document.exitPointerLock?.();$('pause').classList.add('hidden');$('mapObjective').textContent=game.objective().title;drawMap($('fullMap'),true);$('mapOverlay').classList.remove('hidden');}
$('pauseButton').onclick=pauseGame;$('resume').onclick=resumeGame;$('pauseMap').onclick=showMap;$('mapButton').onclick=showMap;$('closeMap').onclick=resumeGame;
$('useButton').onclick=()=>{if(!paused){game.interact();processEvents();}};
$('flashButton').onclick=()=>{if(!paused){game.toggleFlash();processEvents();tutorial=Math.max(1,tutorial);}};
$('bottleButton').onclick=()=>{if(!paused){game.throwBottle();processEvents();}};
$('hintButton').onclick=()=>radio(game.objective().detail+' '+(game.objective().id==='fuse'?'El taller está arriba a la derecha en el plano.':game.objective().id==='panel'?'El cuarto eléctrico está abajo a la derecha.':game.objective().id==='key'?'La oficina está arriba a la izquierda.':'El portón está abajo a la izquierda.'));
$('skipTutorial').onclick=()=>{tutorial++;if(tutorial>2)$('tutorial').classList.add('hidden');};
function refreshVolume(){if(audio.master)audio.master.gain.value=$('sound').checked?Number($('volume').value):0;if(!$('sound').checked)window.speechSynthesis?.cancel();}
$('volume').oninput=refreshVolume;$('sound').onchange=refreshVolume;$('voice').onchange=()=>{if(!$('voice').checked&&'speechSynthesis'in window)speechSynthesis.cancel();};
window.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
 if(k==='escape'&&!e.repeat){if(!$('mapOverlay').classList.contains('hidden'))resumeGame();else if(!$('pause').classList.contains('hidden'))resumeGame();else pauseGame();return;}
 if(!started||game.status!=='playing')return;
 if(k==='m'&&!e.repeat){$('mapOverlay').classList.contains('hidden')?showMap():resumeGame();return;}
 if(paused)return;keys[k]=true;if(e.repeat)return;
 if(k==='e'){game.interact();processEvents();tutorial=Math.max(2,tutorial);}
 if(k==='f'){game.toggleFlash();processEvents();tutorial=Math.max(1,tutorial);}
 if(k==='q'){game.throwBottle();processEvents();}
 if(k==='h')$('hintButton').click();
});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
window.addEventListener('blur',()=>{keys={};if(started&&!paused)pauseGame();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused)pauseGame();});
canvas.onclick=()=>{if(started&&!paused&&game.status==='playing'){canvas.focus();const p=canvas.requestPointerLock?.();if(p&&p.catch)p.catch(()=>toast('Podés mirar con las flechas izquierda y derecha.'));}};
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&!paused){mouse+=e.movementX*.0021;mouseY-=e.movementY*.0018;}});
for(const button of document.querySelectorAll('[data-control]')){
 const control=button.dataset.control,k=control==='forward'?'w':control==='turnLeft'?'arrowleft':'arrowright';
 button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys[k]=true;};button.onpointerup=button.onpointercancel=()=>{keys[k]=false;};
}
function updateHUD(now){
 const objective=game.objective();$('objective').textContent=objective.title;$('objectiveDetail').textContent=objective.detail;$('zone').textContent=game.zone();
 document.querySelectorAll('.progress i').forEach((el,i)=>el.classList.toggle('done',i<([game.items.fuse,game.items.power,game.items.key,game.gate>=1].filter(Boolean).length)));
 $('fuseIcon').classList.toggle('owned',game.items.fuse);$('keyIcon').classList.toggle('owned',game.items.key);$('bottleIcon').textContent=`Q · BOTELLAS ${game.items.bottles}`;$('staminaBar').style.width=game.p.stamina+'%';
 $('flashButton').textContent='F · Linterna '+(game.p.flash?'encendida':'apagada');
 const prompt=game.prompt();$('interaction').classList.toggle('hidden',!prompt||paused);if(prompt)$('interactionText').textContent=prompt.text.replace(/^E · /,'');
 $('hideBanner').classList.toggle('hidden',!game.p.hidden);$('crosshair').classList.toggle('hidden',!!game.p.hidden);
 $('hideBanner').querySelector('b').textContent=game.p.hideExposed?'TE VIO ESCONDERTE':'ESTÁS OCULTO';
 $('dangerText').textContent=game.e.mode==='chase'?'¡TE ESTÁ PERSIGUIENDO!':game.danger>.65?'PASOS MUY CERCA':game.danger>.3?'ESCUCHÁS PASOS':'ESCUCHÁ EL DEPÓSITO';
 $('dangerText').style.color=game.e.mode==='chase'?'#f49b7f':game.danger>.3?'#e6c671':'#abb3ab';$('redEdge').style.opacity=game.e.mode==='chase'?'.25':'0';
 if(now>routeAt){route=objective.target?game.path(game.p,objective.target):[];routeAt=now+600;drawMap($('miniMap'),false);}
 const waypoint=route.find(p=>distance(game.p,p)>.8)||objective.target;
 if(waypoint){const a=angle(Math.atan2(waypoint.y-game.p.y,waypoint.x-game.p.x),game.p.a);$('compassArrow').style.transform=`rotate(${a*180/Math.PI}deg)`;}
 $('compassText').textContent=objective.id==='fuse'?'TALLER':objective.id==='panel'?'TABLERO':objective.id==='key'?'OFICINA':'SALIDA';$('compassDistance').textContent=route.length?Math.round(route.length)+' m':'';
 $('radio').style.opacity=now<radioUntil?'1':'0';$('toast').classList.toggle('hidden',now>toastUntil);
 if(tutorial<3){$('tutorial').classList.remove('hidden');const instructions=[['Movete con W A S D','Las flechas izquierda y derecha giran la vista. También podés hacer clic para mirar con el mouse.'],['F enciende o apaga la linterna','La luz ayuda a ver, pero también puede delatarte. La amenaza se escucha antes de acercarse.'],['E usa lo que tenés delante','Acercate a una puerta u objeto y miralo. M abre el plano con la ruta al objetivo.']];$('tutorialTitle').textContent=instructions[tutorial][0];$('tutorialText').textContent=instructions[tutorial][1];}
}

function texture(type){
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
 g.fillStyle=type===1?'#6e7770':type===2?'#3e493c':type===3?'#596d69':'#708172';g.fillRect(0,0,64,64);
 for(let i=0;i<700;i++){const x=(i*37)%64,y=(i*19+Math.floor(i/64)*11)%64;g.fillStyle=i%3?'#00000014':'#ffffff10';g.fillRect(x,y,1,2);}
 if(type===1){g.fillStyle='#222e2c';g.fillRect(0,0,2,64);g.fillRect(0,49,64,2);g.fillStyle='#818a78';g.fillRect(2,12,60,1);}
 if(type===2){for(let y=8;y<64;y+=17){g.fillStyle='#202921';g.fillRect(0,y+13,64,4);for(let x=3;x<64;x+=19){g.fillStyle=x%2?'#9a8059':'#7b704b';g.fillRect(x,y,16,13);g.fillStyle='#beae77';g.fillRect(x+7,y,2,13);g.fillStyle='#2d362f';g.fillRect(x+4,y+5,5,3);}}g.fillStyle='#89977d';g.fillRect(0,0,3,64);g.fillRect(61,0,3,64);}
 if(type===3){g.fillStyle='#21332c';g.fillRect(5,3,54,59);g.strokeStyle='#95a593';g.lineWidth=1;g.strokeRect(7,5,50,54);g.fillStyle='#b7c4a8';g.fillRect(43,30,7,2);g.fillStyle='#8f9e91';g.fillRect(15,12,34,6);}
 if(type===4){for(let y=0;y<64;y+=5){g.fillStyle='#33463b';g.fillRect(0,y,64,1);g.fillStyle='#a0ad93';g.fillRect(0,y+1,64,1);}g.fillStyle='#cbb662';g.fillRect(0,0,64,5);}
 return c;
}
for(let type=1;type<=4;type++)textures[type]=texture(type);
function sprite(type){
 const c=document.createElement('canvas');c.width=240;c.height=360;const g=c.getContext('2d');
 const poly=(p,color)=>{g.fillStyle=color;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 if(type==='enemy'){
  poly([[57,350],[107,350],[116,254],[135,350],[185,350],[155,209],[91,208]],'#171e20');poly([[84,112],[48,245],[86,258],[105,175],[146,247],[187,237],[155,112]],'#354039');poly([[115,111],[152,115],[164,267],[111,276]],'#202c29');
  g.fillStyle='#211f1a';g.beginPath();g.ellipse(120,73,35,47,0,0,Math.PI*2);g.fill();poly([[83,50],[99,22],[136,22],[158,54],[150,107],[92,110]],'#828778');g.fillStyle='#121f1d';g.fillRect(92,56,56,19);g.fillStyle='#c9cc9f';g.fillRect(103,65,7,2);g.fillStyle='#38423a';g.fillRect(108,87,27,4);g.fillRect(108,96,27,3);
  g.fillStyle='#8c9580';g.fillRect(65,240,16,29);g.fillRect(169,234,15,31);g.fillStyle='#1a2726';g.fillRect(179,246,7,77);g.fillStyle='#a9aea0';g.fillRect(175,301,17,37);
 }else if(type==='hide'){
  g.fillStyle='#243c35';g.fillRect(37,22,171,330);g.fillStyle='#426158';g.fillRect(46,27,153,314);g.strokeStyle='#819481';g.strokeRect(47,29,74,308);g.strokeRect(123,29,73,308);g.fillStyle='#a6b89b';g.fillRect(106,157,5,24);g.fillRect(136,157,5,24);for(let y=48;y<93;y+=7){g.fillStyle='#243b32';g.fillRect(57,y,50,2);g.fillRect(137,y,50,2);}g.fillStyle='#bbc4a5';g.font='12px monospace';g.fillText('MANT.',58,130);
 }else if(type==='fuse'||type==='key'){
  poly([[38,342],[56,342],[62,233],[185,233],[191,342],[206,342],[199,217],[45,217]],'#4c5a45');g.fillStyle='#8e8d6d';g.fillRect(35,197,174,24);g.fillStyle='#acae8a';g.fillRect(35,197,174,5);
  if(type==='fuse'){g.fillStyle='#cbbc76';g.fillRect(87,154,67,40);g.fillStyle='#c45733';g.fillRect(94,159,52,30);g.fillStyle='#ece6b0';g.fillRect(104,165,31,15);g.fillStyle='#3f5043';g.fillRect(86,151,69,6);}
  else {g.strokeStyle='#edc665';g.lineWidth=7;g.beginPath();g.arc(105,175,12,0,Math.PI*2);g.stroke();g.fillStyle='#edc665';g.fillRect(114,174,47,6);g.fillRect(147,174,6,15);g.fillRect(158,174,6,11);}
 }else if(type==='panel'){
  g.fillStyle='#354b43';g.fillRect(39,52,164,259);g.fillStyle='#607466';g.fillRect(46,58,149,245);g.strokeStyle='#9ca785';g.strokeRect(53,72,134,199);g.fillStyle='#d1bc65';g.fillRect(60,89,120,31);g.fillStyle='#3c4230';g.font='15px monospace';g.fillText('PELIGRO',70,111);g.fillStyle='#213a31';g.fillRect(79,150,71,60);g.fillStyle=game.items.power?'#b1d388':'#ad6740';g.fillRect(101,163,30,29);g.fillStyle='#c2c49d';g.fillRect(163,160,8,37);g.font='12px monospace';g.fillStyle='#d2d1ac';g.fillText('TABLERO',75,251);
 }else if(type==='bottle'){
  g.fillStyle='#7b9d6c';g.fillRect(103,247,33,92);g.fillRect(110,227,19,34);g.fillStyle='#284331';g.fillRect(108,232,5,95);g.fillStyle='#c1bd83';g.fillRect(106,278,27,31);g.fillStyle='#a9c294';g.fillRect(110,226,19,5);
 }else if(type==='sign'){
  g.fillStyle='#1f3b31';g.fillRect(15,130,210,110);g.strokeStyle='#d8c978';g.lineWidth=3;g.strokeRect(20,135,200,100);g.fillStyle='#d8c978';g.font='bold 23px monospace';g.textAlign='center';g.fillText('SALIDA',120,185);g.font='29px monospace';g.fillText('↓',120,220);
 }
 return c;
}
for(const type of ['enemy','hide','fuse','key','bottle','sign'])sprites[type]=sprite(type);
function worldSprites(){
 const objects=game.available().filter(o=>o.type!=='gate').map(o=>({...o,height:o.type==='fuse'||o.type==='key'?1.2:o.type==='bottle'?.85:o.height}));
 if(game.e.active)objects.push({type:'enemy',id:'enemy',x:game.e.x,y:game.e.y,height:2.15});
 objects.push({type:'sign',id:'exit_sign',x:4.5,y:23.5,height:2.1});return objects;
}
function render(now){
 const w=canvas.width,h=canvas.height,horizon=h*(.5+lookPitch),proj=w/(2*Math.tan(Math.PI/6)),p=game.p;
 const ceiling=ctx.createLinearGradient(0,0,0,horizon);ceiling.addColorStop(0,game.items.power?'#141c19':'#080d10');ceiling.addColorStop(1,game.items.power?'#354035':'#202a27');ctx.fillStyle=ceiling;ctx.fillRect(0,0,w,horizon);
 const floor=ctx.createLinearGradient(0,horizon,0,h);floor.addColorStop(0,game.items.power?'#44503d':'#2b3630');floor.addColorStop(1,'#0b1515');ctx.fillStyle=floor;ctx.fillRect(0,horizon,w,h);
 ctx.strokeStyle='#afc2a019';for(let i=1;i<15;i++){const y=horizon+(i*i/225)*(h-horizon);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}for(let i=-5;i<=5;i++){ctx.beginPath();ctx.moveTo(w/2+i*3,horizon);ctx.lineTo(w/2+i*w*.23,h);ctx.stroke();}
 const fx=Math.cos(p.a),fy=Math.sin(p.a),planeX=-fy*Math.tan(Math.PI/6),planeY=fx*Math.tan(Math.PI/6),depth=new Float32Array(w);
 const flicker=now<flickerUntil&&$('effects').checked?(Math.sin(now*.032)>0?.55:1):1;
 for(let x=0;x<w;x+=2){
  const cam=2*x/w-1,rx=fx+planeX*cam,ry=fy+planeY*cam;
  let mx=Math.floor(p.x),my=Math.floor(p.y),deltaX=Math.abs(1/rx),deltaY=Math.abs(1/ry),sx=rx<0?-1:1,sy=ry<0?-1:1,sdx=(rx<0?p.x-mx:mx+1-p.x)*deltaX,sdy=(ry<0?p.y-my:my+1-p.y)*deltaY,side=0,type=0,steps=0;
  while(!type&&steps++<100){if(sdx<sdy){sdx+=deltaX;mx+=sx;side=0;}else{sdy+=deltaY;my+=sy;side=1;}type=game.material(mx,my);}
  let dist=side?sdy-deltaY:sdx-deltaX;dist=Math.max(.04,dist);depth[x]=depth[x+1]=dist;
  const height=proj*2.8/dist,bottom=horizon+proj*1.4/dist,top=bottom-height;
  let u=side?p.x+dist*rx:p.y+dist*ry;u-=Math.floor(u);let tx=Math.floor(u*64);if((!side&&rx>0)||(side&&ry<0))tx=63-tx;
  ctx.drawImage(textures[type]||textures[1],tx,0,1,64,x,top,2,height);
  const beam=p.flash?Math.pow(Math.max(0,1-Math.abs(cam)*.82),2.6)*.88*Math.exp(-dist*.085):0;
  const shade=clamp((game.items.power?.44:.20)+beam-(side?.045:0)-dist*.01,.08,.98)*flicker;
  ctx.fillStyle=`rgba(2,9,10,${1-shade})`;ctx.fillRect(x,top,2,height);
  if(type===3){const d=game.doorAt(mx,my);if(d.locked){ctx.fillStyle='#dd865c';ctx.fillRect(x,top+height*.55,2,height*.01);}}
 }
 const projected=worldSprites().map(o=>{const dx=o.x-p.x,dy=o.y-p.y,z=dx*fx+dy*fy,lateral=dx*(-fy)+dy*fx;return {...o,z,sx:w/2+lateral*proj/z};}).filter(o=>o.z>.1).sort((a,b)=>b.z-a.z);
 for(const o of projected){
  const sh=o.height*proj/o.z,sw=sh*2/3,left=o.sx-sw/2,bottom=horizon+proj*1.4/o.z,top=bottom-sh;
  if(o.type==='panel'&&!sprites['panel_'+game.items.power])sprites['panel_'+game.items.power]=sprite('panel');
  const image=o.type==='panel'?sprites['panel_'+game.items.power]:sprites[o.type];if(!image||left>w||left+sw<0)continue;
  const centerAngle=Math.abs((o.sx-w/2)/(w/2)),beam=p.flash?Math.max(0,1-centerAngle)*.75:0;
  ctx.globalAlpha=clamp((game.items.power?.7:.42)+beam-o.z*.02,.15,1)*flicker;
  for(let col=Math.max(0,Math.floor(left));col<Math.min(w,left+sw);col+=2){if(o.z<depth[col]+.05){const src=(col-left)/sw*240;ctx.drawImage(image,src,0,Math.min(240-src,2/sw*240),360,col,top,2,sh);}}
  ctx.globalAlpha=1;
  if(game.objective().target?.id===o.id&&o.z<12&&game.los(p,o)){
   ctx.font='10px Consolas,monospace';ctx.textAlign='center';ctx.fillStyle='#e5c673';ctx.shadowBlur=5;ctx.shadowColor='#000';ctx.fillText(o.label.toUpperCase(),o.sx,top-12);ctx.shadowBlur=0;
  }
 }
 // Practical beam and a hand-held torch drawn over the world.
 if(p.flash&&!p.hidden){const glow=ctx.createRadialGradient(w*.52,h*.55,2,w*.52,h*.55,w*.5);glow.addColorStop(0,'#dbe8a012');glow.addColorStop(1,'#00000000');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w*.88,h*.89);ctx.rotate(-.58);ctx.fillStyle='#152023';ctx.fillRect(-42,0,95,120);ctx.fillStyle='#324546';ctx.fillRect(-48,-20,107,40);ctx.fillStyle='#768774';ctx.fillRect(-43,-18,96,9);ctx.fillStyle='#405450';ctx.fillRect(-36,34,82,10);ctx.restore();}
 const vignette=ctx.createRadialGradient(w/2,h/2,h*.12,w/2,h/2,w*.7);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#000000c5');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
 if(p.hidden){ctx.fillStyle='#020a07b5';ctx.fillRect(0,0,w,h);ctx.fillStyle='#0b1710';for(let i=0;i<10;i++)ctx.fillRect(0,h*(i/10),w,h*.04);}
 if(now<deathUntil){const shake=$('effects').checked?Math.sin(now*.11)*15:0,face=sprites.enemy;ctx.fillStyle='#080e0bee';ctx.fillRect(0,0,w,h);ctx.drawImage(face,65,10,107,114,w*.5-h*.55+shake,h*.1,h*1.1,h*.85);}
}
function drawMap(target,full){
 const g=target.getContext('2d'),w=target.width,h=target.height,pad=full?20:3,scale=Math.min((w-pad*2)/W,(h-pad*2)/H),ox=(w-W*scale)/2,oy=(h-H*scale)/2;
 g.fillStyle='#0e1816';g.fillRect(0,0,w,h);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=BASE[y][x];g.fillStyle=t===1?'#597066':t===2?'#354f43':t===3?(game.doorAt(x,y).locked?'#88594b':'#b2a779'):t===4?'#baa764':'#152a21';g.fillRect(ox+x*scale,oy+y*scale,scale-.25,scale-.25);}
 const objective=game.objective(),path=objective.target?game.path(game.p,objective.target):[];
 if(full&&path.length){g.strokeStyle='#e6c67180';g.lineWidth=2;g.setLineDash([3,4]);g.beginPath();g.moveTo(ox+game.p.x*scale,oy+game.p.y*scale);path.forEach(v=>g.lineTo(ox+v.x*scale,oy+v.y*scale));g.stroke();g.setLineDash([]);}
 if(full){g.font='bold 10px Segoe UI';g.textAlign='center';g.fillStyle='#c9d7c4';for(const [text,x,y] of [['OFICINA',5,7.6],['TALLER',23.5,7.6],['DEPÓSITO',14.5,16.9],['TABLERO',23.5,23.5],['PORTÓN',6.4,23.5]])g.fillText(text,ox+x*scale,oy+y*scale);
  for(const o of OBJECTS.filter(o=>o.type==='hide')){g.fillStyle='#79b59a';g.fillRect(ox+o.x*scale-3,oy+o.y*scale-3,6,6);}
 }
 if(objective.target){const o=objective.target,x=ox+o.x*scale,y=oy+o.y*scale;g.save();g.translate(x,y);g.rotate(Math.PI/4);g.fillStyle='#edcc73';g.fillRect(-4,-4,8,8);g.restore();}
 g.save();g.translate(ox+game.p.x*scale,oy+game.p.y*scale);g.rotate(game.p.a+Math.PI/2);g.fillStyle='#edf3e9';g.beginPath();g.moveTo(0,-5);g.lineTo(4,4);g.lineTo(0,2);g.lineTo(-4,4);g.closePath();g.fill();g.restore();
}
function frame(now){
 const dt=Math.min(.04,(now-lastFrame)/1000||0);lastFrame=now;
 if(started&&!paused&&game.status==='playing'){
  const input={forward:(keys.w?1:0)-(keys.s?1:0),strafe:(keys.d?1:0)-(keys.a?1:0),turn:(keys.arrowright?1:0)-(keys.arrowleft?1:0),sprint:!!keys.shift,mouse};lookPitch=clamp(lookPitch+mouseY+((keys.arrowup?1:0)-(keys.arrowdown?1:0))*dt*.5,-.42,.42);mouse=mouseY=0;const previousEnemy={x:game.e.x,y:game.e.y};game.update(dt,input);processEvents();
  enemyStep+=distance(previousEnemy,game.e);if(game.e.active&&enemyStep>.85){if(distance(game.e,game.p)<17)sound('enemy',game.e);enemyStep=0;}
  if(tutorial===0&&distance(game.p,{x:6.5,y:22.5})>2)tutorial=1;
  if(game.items.fuse){tutorial=3;$('tutorial').classList.add('hidden');}
 }
 render(now);if(started)updateHUD(now);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
