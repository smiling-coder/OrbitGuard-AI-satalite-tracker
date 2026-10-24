(()=>{
if(typeof THREE==='undefined'){document.body.insertAdjacentHTML('afterbegin','<p style="position:fixed;z-index:99;top:60px;left:240px;color:#ff8a8a">3D library failed to load. Check your internet connection and reload.</p>');throw new Error('THREE missing')}
const OrbitControls=THREE.OrbitControls;
const MU=398600.4418,RE=6371,W=7.2921159e-5,D=Math.PI/180,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let objs=[],simT=0,speed=240,paused=false,sel=null,reduced=false,res=[],charts={};
const mk=(id,type,alt,inc,raan,ma,src='SIMULATION',name=id)=>({id,name,type,alt,inc,raan,ma,src});
function gen(){let s=42;const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;objs=objs.filter(o=>o.src!=='SIMULATION');const base=[];
 for(let i=0;i<40;i++)base.push(mk('SAT-'+String(i+1).padStart(3,'0'),'satellite',500+r()*1300,r()*98,r()*360,r()*360));
 for(let i=0;i<360;i++)base.push(mk('DEB-'+String(i+1).padStart(4,'0'),'debris',500+r()*1500,r()*100,r()*360,r()*360));
 objs=base.concat(objs)}
/* orbital mechanics: circular two-body, inertial (ECI-like) frame; Earth mesh rotates at the sidereal rate */
const posU=(o,u)=>{const a=RE+o.alt,i=o.inc*D,O=o.raan*D,cu=Math.cos(u),su=Math.sin(u),cO=Math.cos(O),sO=Math.sin(O),ci=Math.cos(i);return[a*(cO*cu-sO*ci*su),a*(sO*cu+cO*ci*su),a*Math.sin(i)*su]};
const nOf=o=>Math.sqrt(MU/(RE+o.alt)**3),pos=(o,t)=>posU(o,o.ma*D+nOf(o)*t);
const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
/* three.js scene: 1 unit = 1000 km; ECI (x,y,z north) -> three (x,z,-y) */
const gt=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const cv=$('#c'),renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true}),scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(45,1,.1,500);
cam.position.set(0,9,20);const ctl=new OrbitControls(cam,cv);ctl.enableDamping=true;ctl.minDistance=8;ctl.maxDistance=60;
const blackTex=(()=>{const c=document.createElement('canvas');c.width=c.height=2;return new THREE.CanvasTexture(c)})();
const emat=new THREE.ShaderMaterial({uniforms:{dayT:{value:blobTex(true)},nightT:{value:blackTex},sun:{value:new THREE.Vector3(50,10,30).normalize()}},vertexShader:'varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vW=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D dayT,nightT;uniform vec3 sun;varying vec2 vUv;varying vec3 vW;void main(){float d=dot(normalize(vW),sun);float k=smoothstep(-.12,.22,d);vec3 day=texture2D(dayT,vUv).rgb*(.2+.95*max(d,0.));vec3 nt=texture2D(nightT,vUv).rgb*vec3(1.5,1.15,.7);gl_FragColor=vec4(mix(nt+day*.15,day,k),1.);}'});
const earth=new THREE.Mesh(new THREE.SphereGeometry(RE/1000,96,96),emat);
const atm=new THREE.Mesh(new THREE.SphereGeometry(RE/1000*1.14,64,64),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,vertexShader:'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 n;void main(){float i=pow(max(0.,.42-dot(n,vec3(0.,0.,1.))),3.)*2.2;gl_FragColor=vec4(.25,.62,1.,1.)*i;}'}));
function blobTex(land){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');let s=land?5:9;const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
 if(land){const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#0e3b73');g.addColorStop(.5,'#0b4a8f');g.addColorStop(1,'#0e3b73');x.fillStyle=g;x.fillRect(0,0,512,256)}
 for(let i=0;i<(land?90:120);i++){const px=r()*512,py=land?30+r()*196:r()*256,rad=land?10+r()*30:15+r()*35,gr=x.createRadialGradient(px,py,0,px,py,rad);
  if(land){const col=r()<.7?'47,107,58':'150,125,75';gr.addColorStop(0,`rgba(${col},.95)`);gr.addColorStop(1,`rgba(${col},0)`)}else{gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)')}
  x.fillStyle=gr;for(const dx of[-512,0,512]){x.save();x.translate(dx,0);x.beginPath();x.arc(px,py,rad,0,7);x.fill();x.restore()}}return new THREE.CanvasTexture(c)}

const clouds=new THREE.Mesh(new THREE.SphereGeometry(RE/1000*1.012,48,48),new THREE.MeshStandardMaterial({map:blobTex(false),transparent:true,depthWrite:false,opacity:.7}));
scene.add(earth,clouds,atm);
const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(50,10,30);scene.add(sun,new THREE.AmbientLight(0x223355,.6));
const stp=new Float32Array(1800*3).map(()=>(Math.random()-.5)*300);const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(stp,3));const stars=new THREE.Points(sg,new THREE.PointsMaterial({size:.5,map:gt,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0x9bb4d8}));scene.add(stars);
const marker=new THREE.Mesh(new THREE.SphereGeometry(.12,16,16),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true}));marker.visible=false;scene.add(marker);
let pts,geo,posA,line;
function build(){if(pts){scene.remove(pts);geo.dispose()}posA=new Float32Array(objs.length*3);const col=new Float32Array(objs.length*3);
 objs.forEach((o,i)=>{const c=new THREE.Color(o.src==='SYNTHETIC'?0xff3355:o.src!=='SIMULATION'?0xa78bfa:o.type==='satellite'?0x22d3ee:0xff7a1a);col.set([c.r,c.g,c.b],i*3)});
 geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(posA,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));
 pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.24,map:gt,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(pts);buildExtras()}
const vis=o=>o.type==='satellite'?$('#fs').checked:$('#fd').checked;
const toV=p=>new THREE.Vector3(p[0]/1000,p[2]/1000,-p[1]/1000);
function drawLine(){if(line){scene.remove(line);line=null}if(!sel||!$('#orb').checked)return;const a=[];for(let k=0;k<=180;k++)a.push(toV(posU(sel,k/180*2*Math.PI)));
 line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(a),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.6}));scene.add(line)}
function size(){const w=cv.clientWidth,h=cv.clientHeight;if(!w)return;renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(devicePixelRatio,2));cam.aspect=w/h;cam.updateProjectionMatrix()}
new ResizeObserver(size).observe(cv);
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.1);last=now;if(!paused)simT+=dt*speed*(reduced?.25:1);
 
 objs.forEach((o,i)=>{if(vis(o)){const v=toV(pos(o,simT));posA[i*3]=v.x;posA[i*3+1]=v.y;posA[i*3+2]=v.z}else posA[i*3]=posA[i*3+1]=posA[i*3+2]=0});
 geo.attributes.position.needsUpdate=true;earth.rotation.y=W*simT;
 if(sel){marker.visible=true;marker.position.copy(toV(pos(sel,simT)));info()}else marker.visible=false;
 const lb=$('#lab');if(sel&&$('#lb').checked){const s=marker.position.clone().project(cam);lb.style.display='block';const q0=cv.getBoundingClientRect();lb.style.left=q0.left+(s.x+1)/2*q0.width+'px';lb.style.top=q0.top+(1-s.y)/2*q0.height+'px';lb.textContent=sel.name}else lb.style.display='none';
 net.rotation.y=earth.rotation.y;radar(now);const mv=(paused||reduced)?0:1;clouds.rotation.y+=dt*.004*mv;stars.rotation.y+=dt*.002*mv;rings.visible=$('#ao').checked;trail.visible=$('#fs').checked;animTrails();pulse(now);
 if(intro<1){intro=Math.min(1,intro+dt/3.5);const e=1-Math.pow(1-intro,3);cam.position.set(0,9*e+18*(1-e),20*e+55*(1-e))}
 ctl.update();renderer.render(scene,cam)}
function info(){const p=pos(sel,simT),q=pos(sel,simT+1),v=dist(p,q),r=Math.hypot(...p);
 $('#info').innerHTML=`<h3>${sel.name}</h3><span class="chip">${sel.src==='SIMULATION'?'SIMULATED OBJECT':sel.src==='SYNTHETIC'?'SYNTHETIC FRAGMENT':'IMPORTED · UNVERIFIED'}</span><table><tr><td>Category</td><td>${sel.type}</td></tr><tr><td>Altitude (circular model)</td><td>${sel.alt.toFixed(0)} km</td></tr><tr><td>Inclination / RAAN</td><td>${sel.inc.toFixed(1)}° / ${sel.raan.toFixed(1)}°</td></tr><tr><td>Radius now</td><td>${r.toFixed(0)} km</td></tr><tr><td>Speed</td><td>${v.toFixed(2)} km/s</td></tr><tr><td>Period</td><td>${(2*Math.PI/nOf(sel)/60).toFixed(1)} min</td></tr><tr><td>Data quality</td><td>${sel.src==='SIMULATION'?'Synthetic, no uncertainty':'User file, age unknown (GREY)'}</td></tr></table>`}
function select(o){sel=o;drawLine();info()}
let down=null;cv.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
cv.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=cv.getBoundingClientRect();let best=null,bd=16;
 objs.forEach((o,i)=>{if(!vis(o))return;const v=new THREE.Vector3(posA[i*3],posA[i*3+1],posA[i*3+2]);
  if(v.clone().sub(cam.position).dot(v)>0&&v.length()<RE/1000*1.02)return; /* hidden behind Earth */
  const s=v.project(cam),x=(s.x+1)/2*r.width,y=(1-s.y)/2*r.height,d=Math.hypot(x-(e.clientX-r.left),y-(e.clientY-r.top));if(d<bd){bd=d;best=o}});if(best)select(best)});
/* collision screening */
function screen(a,list,hours){const out=[],N=hours*3600/20,pa=[];for(let k=0;k<=N;k++)pa.push(pos(a,simT+k*20));
 for(const b of list){if(b===a)continue;let m=1e12,mk_=0;for(let k=0;k<=N;k++){const d=dist(pa[k],pos(b,simT+k*20));if(d<m){m=d;mk_=k}}
  const t0=simT+mk_*20;for(let s=-20;s<=20;s++){const t=t0+s,d=dist(pos(a,t),pos(b,t));if(d<m){m=d;mk_=(t-simT)/20}}
  const t=simT+mk_*20,pa1=pos(a,t),pa2=pos(a,t+1),pb1=pos(b,t),pb2=pos(b,t+1);const rv=Math.hypot(...[0,1,2].map(i=>(pa2[i]-pa1[i])-(pb2[i]-pb1[i])));
  out.push({a,b,miss:m,tca:t-simT,rv})}return out.sort((x,y)=>x.miss-y.miss)}
const risk=r=>r.b.src!=='SIMULATION'||r.a.src!=='SIMULATION'?'X':r.miss<+$('#tr').value?'R':r.miss<+$('#ty').value?'Y':'G';
const RL={R:'RED · review',Y:'YELLOW · evaluate',G:'GREEN · lower concern',X:'GREY · insufficient data'};
const fmtT=s=>`T+${Math.floor(s/3600)}h ${Math.round(s%3600/60)}m`;
function runRisk(a,h){const t=performance.now();res=screen(a,objs.filter(o=>o.type!=='satellite'||o.src!=='SIMULATION'?true:o!==a),h);res.dur=performance.now()-t;showRes();return res}
function showRes(){const top=res.slice(0,12);
 $('#rt').innerHTML='<tr><th>Object A</th><th>Object B</th><th>TCA (predicted)</th><th>Miss distance</th><th>Rel. speed</th><th>Assessment</th></tr>'+top.map(r=>`<tr><td>${r.a.id}</td><td>${r.b.id}</td><td>${fmtT(r.tca)}</td><td>${r.miss.toFixed(1)} km</td><td>${r.rv.toFixed(1)} km/s</td><td class="${risk(r)}">${RL[risk(r)]}</td></tr>`).join('');
 $('#alerts').innerHTML=top.slice(0,5).map(r=>`<div class="al"><b>${r.a.id} × ${r.b.id}</b> <span class="${risk(r)}">${RL[risk(r)]}</span><br><span class="mu">${r.miss.toFixed(0)} km at ${fmtT(r.tca)} · screening estimate, SIMULATION</span></div>`).join('');
 const flag=res.filter(r=>risk(r)!=='G'&&risk(r)!=='X');$('#m4').textContent=flag.length;$('#m5').textContent=res.filter(r=>risk(r)==='R').length;
 if(top[0]){const a=top[0].a,b=top[0].b,pts=[];for(let k=0;k<=360;k++)pts.push(dist(pos(a,simT+k*240),pos(b,simT+k*240)));
  chart('chD','line',pts.map((_,k)=>(k*4/60).toFixed(1)+'h'),[{label:`${a.id}×${b.id} separation, km (sampled 4 min; refined minimum is in table)`,data:pts,borderColor:'#22d3ee',pointRadius:0}])}}
function chart(id,type,labels,datasets,extra={}){charts[id]?.destroy();charts[id]=new Chart($('#'+id),{type,data:{labels,datasets},options:{maintainAspectRatio:!extra.fill,animation:reduced?false:{},color:'#8ba3c7',scales:{x:{ticks:{color:'#8ba3c7',maxTicksLimit:12},stacked:!!extra.stack},y:{ticks:{color:'#8ba3c7'},stacked:!!extra.stack}},plugins:{legend:{labels:{color:'#8ba3c7'}}}}})}
function stats(){$('#m1').textContent=objs.length;$('#m2').textContent=objs.filter(o=>o.type==='satellite').length;$('#m3').textContent=objs.filter(o=>o.type!=='satellite').length;
 $('#m6').textContent=objs.some(o=>o.src!=='SIMULATION')?'SIMULATION + IMPORTED':'SIMULATION';
 const bins=[...Array(9)].map((_,i)=>400+i*200),cnt=t=>bins.map(b=>objs.filter(o=>(t?o.type==='satellite':o.type!=='satellite')&&o.alt>=b&&o.alt<b+200).length);
 chart('chAlt','bar',bins.map(b=>b+'–'+(b+200)+' km'),[{label:'Satellites',data:cnt(1),backgroundColor:'#22d3ee'},{label:'Debris / rocket bodies',data:cnt(0),backgroundColor:'#ff7a1a'}],{stack:1,fill:1});
 $('#rsat').innerHTML=objs.filter(o=>o.type==='satellite').map(o=>`<option>${o.id}</option>`).join('');tracker();density();fillSel()}
/* tracker */
const dl=(name,rows)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download=name;a.click()};
const csvRow=o=>[o.id,o.type,o.alt.toFixed(1),o.inc.toFixed(2),o.raan.toFixed(2),o.ma.toFixed(2),o.name,o.src].join(',');
const HDR='id,type,alt_km,inc_deg,raan_deg,ma_deg,name,source';
function tracker(){const q=$('#q').value.toLowerCase(),f=$('#tf').value,k=$('#ts').value;
 const l=objs.filter(o=>(!f||o.type===f)&&(o.id+o.name).toLowerCase().includes(q)).sort((a,b)=>a[k]-b[k]);tracker.l=l;
 $('#tbl').innerHTML='<tr><th>ID</th><th>Type</th><th>Alt km</th><th>Inc °</th><th>Source</th></tr>'+l.slice(0,300).map((o,i)=>`<tr class="k" data-i="${i}"><td>${o.id}</td><td>${o.type}</td><td>${o.alt.toFixed(0)}</td><td>${o.inc.toFixed(1)}</td><td>${o.src}</td></tr>`).join('')}
$('#tbl').onclick=e=>{const r=e.target.closest('tr.k');if(!r)return;select(tracker.l[r.dataset.i]);go('mission')};
['#q','#tf','#ts'].forEach(s=>$(s).oninput=tracker);$('#te').onclick=()=>dl('objects.csv',[HDR,...tracker.l.map(csvRow)]);
/* import */
function importCSV(txt){const L=txt.trim().split(/\r?\n/),h=L[0].split(',').map(s=>s.trim().toLowerCase()),need=['id','type','alt_km','inc_deg','raan_deg','ma_deg'],miss=need.filter(c=>!h.includes(c));
 if(miss.length)return $('#rep').textContent='ERROR: unsupported format. Missing columns: '+miss.join(', ')+'\nTLE/OMM files are not supported yet.';
 const ix=c=>h.indexOf(c),err=[],ok=[],seen=new Set(objs.map(o=>o.id));
 L.slice(1).forEach((ln,n)=>{if(!ln.trim())return;const c=ln.split(',').map(s=>s.trim()),row=n+2,num=k=>Number(c[ix(k)]);
  const v=[num('alt_km'),num('inc_deg'),num('raan_deg'),num('ma_deg')];
  if(!c[ix('id')])err.push(`Row ${row}: missing id`);else if(seen.has(c[ix('id')]))err.push(`Row ${row}: duplicate id ${c[ix('id')]}`);
  else if(!['satellite','debris','rocket_body'].includes(c[ix('type')]))err.push(`Row ${row}: unknown type "${c[ix('type')]}"`);
  else if(v.some(isNaN))err.push(`Row ${row}: non-numeric value`);else if(v[0]<150||v[0]>40000||v[1]<0||v[1]>180)err.push(`Row ${row}: altitude must be 150–40000 km and inclination 0–180°`);
  else{seen.add(c[ix('id')]);ok.push(mk(c[ix('id')],c[ix('type')],v[0],v[1],v[2],v[3],'IMPORTED',ix('name')>=0&&c[ix('name')]||c[ix('id')]))}});
 objs.push(...ok);build();stats();$('#rep').textContent=`Imported ${ok.length} valid record(s). Rejected ${err.length}.\nAssumed: km, degrees, circular orbit, no epoch (data age unknown).\n`+err.join('\n')}
$('#file').onchange=async e=>{const f=e.target.files[0];if(f){const t=await f.text();/^1 \d{5}/m.test(t)?importTLE(t):importCSV(t)}};
$('#smp').onclick=()=>dl('sample.csv',['id,type,alt_km,inc_deg,raan_deg,ma_deg,name','USR-001,satellite,550,53,10,0,Demo Sat A','USR-002,debris,552,97.5,120,45,Demo Fragment B','USR-003,rocket_body,780,86,200,300,Demo Stage C']);
$('#ex').onclick=()=>dl('imported.csv',[HDR,...objs.filter(o=>o.src!=='SIMULATION').map(csvRow)]);
$('#clr').onclick=()=>{objs=objs.filter(o=>o.src==='SIMULATION');if(sel&&sel.src!=='SIMULATION')sel=null;build();stats();$('#rep').textContent='Imported records removed.'};
/* controls + nav */
function go(p){$$('.page').forEach(s=>s.classList.toggle('active',s.id===p));$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));$('#side').classList.remove('show');document.body.classList.toggle('sub',p!=='mission')}
$$('nav button').forEach(b=>b.onclick=()=>go(b.dataset.p));$('#burger').onclick=()=>$('#side').classList.toggle('show');
$('#pp').onclick=()=>{paused=!paused;$('#pp').textContent=paused?'Resume':'Pause'};
$('#rs').onclick=()=>{simT=0;sel=null;drawLine();$('#info').innerHTML='<h3>Object information</h3><p class="mu">Select an object in the 3D view.</p>';cam.position.set(0,9,20);ctl.target.set(0,0,0)};
$('#spd').oninput=e=>{speed=+e.target.value;$('#spdv').textContent=speed+'×'};$('#orb').onchange=drawLine;
$('#rm').onchange=e=>{reduced=e.target.checked;ctl.enableDamping=!reduced;ctl.autoRotate=!reduced};
const go2=()=>{const a=objs.find(o=>o.id===$('#rsat').value)||objs[0];runRisk(a,+$('#rh').value)};
$('#rgo').onclick=go2;$('#qa').onclick=()=>{sel&&sel.type==='satellite'?(()=>{$('#rsat').value=sel.id})():0;go2()};
$('#re').onclick=()=>dl('close_approaches.csv',['object_a,object_b,tca_s_from_now,miss_km,rel_speed_kms,assessment,method',...res.slice(0,50).map(r=>[r.a.id,r.b.id,r.tca.toFixed(0),r.miss.toFixed(2),r.rv.toFixed(2),RL[risk(r)].split(' ')[0],'two-body screening estimate'].join(','))]);

/* ---- v2: manoeuvre simulator ---- */
const G0=9.80665,opt=l=>l.map(o=>`<option>${o.id}</option>`).join('');
function fillSel(){const s=objs.filter(o=>o.type==='satellite');$('#msat').innerHTML=opt(s);$('#mobj').innerHTML=opt(objs);$('#ca').innerHTML=opt(objs);$('#cb').innerHTML=opt(objs);$('#k1').innerHTML=opt(objs);$('#k2').innerHTML=opt(objs);$('#tob').innerHTML=opt(objs);$('#dob').innerHTML=opt(objs);
 if(res[0]&&objs.includes(res[0].b)){$('#msat').value=res[0].a.id;$('#mobj').value=res[0].b.id}if(objs[1])$('#cb').value=objs[1].id}
function posM(o,t,tm,dv){if(t<=tm||!dv)return pos(o,t);const a=RE+o.alt,da=2*a*dv/Math.sqrt(MU/a),o2={...o,alt:o.alt+da};o2.ma=(o.ma*D+nOf(o)*tm-nOf(o2)*tm)/D;return pos(o2,t)}
function manSim(){const a=objs.find(o=>o.id===$('#msat').value),b=objs.find(o=>o.id===$('#mobj').value);if(!a||!b||a===b)return $('#mtbl').innerHTML='<tr><td>Choose two different objects.</td></tr>';
 const h=+$('#mh').value,tm=simT+(+$('#mt').value)*3600,dv=(+$('#mdv').value)/1000,N=h*3600/20,m0=+$('#mm').value,isp=+$('#misp').value;
 const out=[['No manoeuvre',0,'#8ba3c7'],['Prograde burn',dv,'#22d3ee'],['Retrograde burn',-dv,'#f59e0b']].map(([n,d,c])=>{let m=1e12,tk=0;const s=[];
  for(let k=0;k<=N;k++){const t=simT+k*20,x=dist(posM(a,t,tm,d),pos(b,t));if(k%12===0)s.push(x);if(x<m){m=x;tk=k*20}}
  return{n,d,c,m,tk,s,fuel:m0*(1-Math.exp(-Math.abs(d)*1000/(isp*G0)))}});
 $('#mtbl').innerHTML='<tr><th>Scenario</th><th>Δv</th><th>Min separation</th><th>At</th><th>Change vs none</th><th>Propellant</th></tr>'+out.map(o=>`<tr><td>${o.n}</td><td>${(o.d*1000).toFixed(1)} m/s</td><td>${o.m.toFixed(1)} km</td><td>${fmtT(o.tk)}</td><td>${(o.m-out[0].m).toFixed(1)} km</td><td>${o.fuel.toFixed(2)} kg</td></tr>`).join('');
 chart('chM','line',out[0].s.map((_,i)=>(i*4/60).toFixed(1)+'h'),out.map(o=>({label:o.n,data:o.s,borderColor:o.c,pointRadius:0})))}
$('#mgo').onclick=manSim;
/* ---- v2: collision event simulator ---- */
let parked=[];
function resetColl(){if(!objs.some(o=>o.src==='SYNTHETIC')&&!parked.length)return;objs=objs.filter(o=>o.src!=='SYNTHETIC').concat(parked);parked=[];build();stats()}
$('#crs').onclick=()=>{resetColl();$('#cres').textContent='Reset. Parents restored.'};
$('#cgo').onclick=()=>{resetColl();const A=objs.find(o=>o.id===$('#ca').value),B=objs.find(o=>o.id===$('#cb').value);if(!A||!B||A===B)return $('#cres').textContent='Choose two different objects.';
 const n=Math.min(500,Math.max(10,+$('#cn').value||200)),sg=(+$('#cs').value||120)/1000,a=RE+A.alt,v=Math.sqrt(MU/a),uA=A.ma*D+nOf(A)*simT;let s=7;
 const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296,g=()=>Math.sqrt(-2*Math.log(r()+1e-9))*Math.cos(2*Math.PI*r());
 parked=[A,B];objs=objs.filter(o=>o!==A&&o!==B);const fr=[];
 for(let i=0;i<n;i++){const alt=Math.max(200,A.alt+2*a*(g()*sg)/v),inc=Math.min(180,Math.max(0,A.inc+g()*sg/v/D)),f=mk('FRG-'+String(i+1).padStart(3,'0'),'debris',alt,inc,A.raan,0,'SYNTHETIC');
  f.ma=(((uA-nOf(f)*simT)/D)%360+360)%360;fr.push(f)}
 objs.push(...fr);build();stats();const thr=+$('#ty').value,sats=objs.filter(o=>o.type==='satellite'),N=6*3600/20;let pairs=0,cand=0;
 for(const f of fr)for(const sat of sats){if(Math.abs(sat.alt-f.alt)>=thr)continue;cand++;for(let k=0;k<=N;k++){const t=simT+k*20;if(dist(pos(f,t),pos(sat,t))<thr){pairs++;break}}}
 const al=fr.map(f=>f.alt),mean=al.reduce((x,y)=>x+y)/n;
 $('#cres').textContent=`HYPOTHETICAL EVENT · SYNTHETIC FRAGMENTS\nParents ${A.id} and ${B.id} replaced by ${n} fragments at ${A.alt.toFixed(0)} km.\nFragment altitude: mean ${mean.toFixed(0)} km, range ${Math.min(...al).toFixed(0)}–${Math.max(...al).toFixed(0)} km.\nFragment/satellite pairs checked (altitude overlap): ${cand}\nNew simulated close approaches (< ${thr} km within 6 h): ${pairs}\nThis is a teaching model, not a prediction of a real collision. Open Mission Control to see the cloud.`;
 const bins=[...Array(12)].map((_,i)=>Math.floor(Math.min(...al)/50)*50+i*50);chart('chF','bar',bins.map(b=>b+' km'),[{label:'Synthetic fragments by altitude',data:bins.map(b=>al.filter(x=>x>=b&&x<b+50).length),backgroundColor:'#ff3355'}])};
/* ---- v2: orbital density ---- */
function density(){const f=$('#df').value,l=objs.filter(o=>!f||(f==='satellite'?o.type==='satellite':o.type!=='satellite'));
 const ab=[...Array(14)].map((_,i)=>200+i*100),ib=[...Array(18)].map((_,i)=>i*10);
 chart('chDens','bar',ab.map(b=>b+'–'+(b+100)),[{label:'Objects per 100 km altitude band',data:ab.map(b=>l.filter(o=>o.alt>=b&&o.alt<b+100).length),backgroundColor:'#8b5cf6'}]);
 chart('chInc','bar',ib.map(b=>b+'–'+(b+10)+'°'),[{label:'Objects per 10° inclination',data:ib.map(b=>l.filter(o=>o.inc>=b&&o.inc<b+10).length),backgroundColor:'#22d3ee'}])}
$('#df').onchange=density;

/* ---- v3 ---- */
let sd=11;const sr=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296,gauss=()=>Math.sqrt(-2*Math.log(sr()+1e-9))*Math.cos(2*Math.PI*sr());
function pfit(x,y,d){const n=d+1,A=[...Array(n)].map(()=>Array(n+1).fill(0));for(let k=0;k<x.length;k++)for(let i=0;i<n;i++){for(let j=0;j<n;j++)A[i][j]+=x[k]**(i+j);A[i][n]+=y[k]*x[k]**i}
 for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;[A[i],A[p]]=[A[p],A[i]];for(let r=0;r<n;r++)if(r!==i){const f=A[r][i]/A[i][i];for(let c=i;c<=n;c++)A[r][c]-=f*A[i][c]}}return A.map((r,i)=>r[n]/r[i])}
const pev=(c,x)=>c.reduce((s,k,i)=>s+k*x**i,0),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),COL=['#8ba3c7','#22d3ee','#f59e0b'];
/* trajectory predictor */
$('#tgo').onclick=()=>{sd=11;const o=objs.find(i=>i.id===$('#tob').value);if(!o)return;const H=+$('#th').value,a=RE+o.alt,n=nOf(o),u0=o.ma*D+n*simT,nd=1.5*n/a*(+$('#tdr').value)/86400,ut=t=>u0+n*t+.5*nd*t*t,sg=(+$('#tno').value)/a,xs=[],ys=[];
 for(let k=-360;k<=0;k++){xs.push(k/60);ys.push(ut(k*60)+gauss()*sg)}
 const c2=pfit(xs,ys,2),c1=pfit(xs,ys,1),M=[['A physics (no drag in model)',t=>u0+n*t],['B experimental quadratic fit',t=>pev(c2,t/3600)],['C baseline linear fit',t=>pev(c1,t/3600)]],T=[];
 for(let t=0;t<=H*3600;t+=600)T.push(t);const E=M.map(([,f])=>T.map(t=>dist(posU(o,f(t)),posU(o,ut(t)))));
 $('#ttb').innerHTML='<tr><th>Method</th><th>Error at 1 h</th><th>Error at horizon</th><th>Best?</th></tr>'+M.map((m,i)=>{const e1=E[i][6]??E[i][E[i].length-1],e2=E[i][E[i].length-1];return`<tr><td>${m[0]}</td><td>${e1.toFixed(1)} km</td><td>${e2.toFixed(1)} km</td><td>${e2===Math.min(...E.map(x=>x[x.length-1]))?'lowest error':''}</td></tr>`}).join('');
 chart('chT','line',T.map(t=>(t/3600).toFixed(1)+'h'),M.map((m,i)=>({label:m[0]+' · position error km (SIMULATION)',data:E[i],borderColor:COL[i],pointRadius:0})))};
/* debris detection lab */
$('#dgo').onclick=()=>{sd=11;const o=objs.find(i=>i.id===$('#dob').value);if(!o)return;const sz=+$('#dsz').value||10,R_=+$('#drg').value||2500,f=+$('#dfq').value||60,sg=+$('#dno').value,ms=(+$('#dms').value||0)/100,a=RE+o.alt,n=nOf(o),nt=n*1.003,u0=o.ma*D+n*simT;
 const e1=posU(o,0).map(x=>x/a),e2=posU(o,Math.PI/2).map(x=>x/a),la=15*D,lo=75*D,T=[],U=[];let vis=0,miss=0,pds=0;
 for(let t=0;t<=86400;t+=f){const P=posU(o,u0+nt*t),tt=simT+t,S=[RE*Math.cos(la)*Math.cos(lo+W*tt),RE*Math.cos(la)*Math.sin(lo+W*tt),RE*Math.sin(la)],r=[0,1,2].map(i=>P[i]-S[i]),d=Math.hypot(...r),el=(r[0]*S[0]+r[1]*S[1]+r[2]*S[2])/(d*RE);
  if(d>R_||el<.17)continue;vis++;const pd=1/(1+Math.exp(-(40*Math.log10(R_/d)+20*Math.log10(sz/10))/3));pds+=pd;if(sr()>pd||sr()<ms){miss++;continue}
  const q=P.map(x=>x+gauss()*sg),u=Math.atan2(q[0]*e2[0]+q[1]*e2[1]+q[2]*e2[2],q[0]*e1[0]+q[1]*e1[1]+q[2]*e1[2]),pr=u0+n*t;T.push(t/3600);U.push(u+2*Math.PI*Math.round((pr-u)/(2*Math.PI)))}
 if(T.length<3){$('#dres').textContent=`UNCERTAIN: only ${T.length} detection(s) from ${vis} chances. Not enough to estimate a path. Try a larger object, longer range or fewer misses.`;return}
 const c=pfit(T,U,1),G=[],L=[];for(let t=0;t<=86400;t+=1800){G.push(dist(posU(o,pev(c,t/3600)),posU(o,u0+nt*t)));L.push((t/3600).toFixed(1)+'h')}
 $('#dres').textContent=`SIMULATED SENSOR · ${o.id} · size ${sz} cm\nSensor: fixed ground site, range ${R_} km, min elevation 10°, noise ${sg} km, ${(ms*100).toFixed(0)}% extra missing\nObservation chances: ${vis} · detected: ${T.length} · missed: ${miss}\nMean modelled detection chance: ${(pds/Math.max(vis,1)*100).toFixed(0)}% (uncalibrated)\nEstimated vs true path error: mean ${(G.reduce((x,y)=>x+y)/G.length).toFixed(1)} km, at 24 h ${G[G.length-1].toFixed(1)} km\n(the true orbit has a hidden 0.3% mean-motion difference from the catalogue prior)`;
 chart('chDet','line',L,[{label:'Estimated vs true path error, km (SIMULATION)',data:G,borderColor:'#ff7a1a',pointRadius:0}])};
/* alert intelligence */
let ev=[],st={};try{st=JSON.parse(localStorage.og_alerts||'{}')}catch{}
const sv=()=>{try{localStorage.og_alerts=JSON.stringify(st)}catch{}},key=r=>r.a.id+'×'+r.b.id;
$('#asc').onclick=async()=>{const sats=objs.filter(o=>o.type==='satellite'&&o.src==='SIMULATION').slice(0,10),deb=objs.filter(o=>o.type!=='satellite');ev=[];
 for(const s of sats){$('#asc').textContent='Scanning '+s.id+'…';await new Promise(r=>setTimeout(r,10));ev.push(...screen(s,deb,12).slice(0,3))}
 $('#asc').textContent='Scan 10 satellites (12 h)';$('#afs').innerHTML='<option value="">All</option>'+sats.map(s=>`<option>${s.id}</option>`).join('');alerts()};
function alerts(){const fs=$('#afs').value,fst=$('#afst').value,fh=+$('#afh').value;
 const l=ev.filter(r=>(!fs||r.a.id===fs)&&r.tca/3600<=fh&&(!fst||(st[key(r)]?.s||'New')===fst)).sort((x,y)=>x.miss-y.miss);alerts.l=l;
 $('#atb').innerHTML=l.length?'<tr><th>#</th><th>Event</th><th>Miss</th><th>Predicted TCA</th><th>Rel. speed</th><th>Assessment</th><th>Why</th><th>Related</th><th>Status</th><th>Notes</th></tr>'+l.map((r,i)=>{const k=key(r),s=st[k]||{};return`<tr><td>${i+1}</td><td>${esc(k)}</td><td>${r.miss.toFixed(1)} km</td><td>${fmtT(r.tca)}</td><td>${r.rv.toFixed(1)} km/s</td><td class="${risk(r)}">${RL[risk(r)]}</td><td>${r.miss.toFixed(0)} km vs red &lt;${$('#tr').value} km; simulated, no covariance</td><td>${ev.filter(x=>x.b===r.b).length} with ${esc(r.b.id)}</td><td><select data-k="${esc(k)}" class="s">${['New','Investigating','Reviewed'].map(v=>`<option${(s.s||'New')===v?' selected':''}>${v}</option>`).join('')}</select></td><td><input data-k="${esc(k)}" class="n" value="${esc(s.n||'')}" placeholder="note"></td></tr>`}).join(''):'<tr><td>No events. Run a scan.</td></tr>'}
$('#atb').onchange=e=>{const k=e.target.dataset.k;if(!k)return;st[k]=st[k]||{};st[k][e.target.classList.contains('s')?'s':'n']=e.target.value;sv();if(e.target.classList.contains('s'))alerts()};
['#afs','#afst','#afh'].forEach(s=>$(s).onchange=alerts);
$('#aex').onclick=()=>dl('alerts.csv',['event,miss_km,predicted_tca,rel_speed_kms,assessment,status,note',...(alerts.l||[]).map(r=>[key(r),r.miss.toFixed(2),fmtT(r.tca),r.rv.toFixed(2),RL[risk(r)].split(' ')[0],st[key(r)]?.s||'New',(st[key(r)]?.n||'').replace(/[,\n]/g,' ')].join(','))]);
alerts();
/* atmospheric drag */
$('#ggo').onclick=()=>{const h0=+$('#gh').value,days=+$('#gd').value,B=+$('#gb').value,rho=(h,k)=>k*3e-12*Math.exp(-(h-400)/(60+.08*Math.max(h-400,-200)));
 const out=[['Constant density (incomplete)',1,1],['Exponential, low solar activity',.3,0],['Exponential, high solar activity',3,0]].map(([n,k,c])=>{let a=(RE+h0)*1000,re=null;const s=[],rc=rho(h0,k);
  for(let d=0;d<=days;d++){s.push(a/1000-RE);for(let i=0;i<96;i++){if(a/1000-RE<120){re=re??d;a=(RE+120)*1000;break}a-=(c?rc:rho(a/1000-RE,k))*B*Math.sqrt(3.986004418e14*a)*900}}return{n,s,re}});
 $('#gtb').innerHTML='<tr><th>Assumption</th><th>Final altitude</th><th>Decay</th><th>Re-entry (below 120 km)</th></tr>'+out.map(o=>{const f=o.s[o.s.length-1];return`<tr><td>${o.n}</td><td>${f.toFixed(1)} km</td><td>${(h0-f).toFixed(1)} km</td><td>${o.re!==null?'about day '+o.re:'not within '+days+' days'}</td></tr>`}).join('')+`<tr><td colspan="4" class="mu">Divergence between high and low solar activity at the end: ${Math.abs(out[2].s.slice(-1)[0]-out[1].s.slice(-1)[0]).toFixed(1)} km</td></tr>`;
 chart('chG','line',out[0].s.map((_,d)=>'d'+d),out.map((o,i)=>({label:o.n,data:o.s,borderColor:COL[i],pointRadius:0})))};
/* reports */
let rhtml='';
function report(){if(!res.length)return $('#rprev').textContent='No analysis yet. Run the Collision Risk Analyzer first.';const c=k=>res.filter(r=>risk(r)===k).length,top=res.slice(0,10),img=charts.chD?`<img style="max-width:100%" src="${charts.chD.toBase64Image()}">`:'',
 srcs=[...new Set(objs.map(o=>o.src))].join(', '),ns=Object.keys(st).length;
 rhtml=`<h1>ORBITGUARD AI report</h1><p>Generated ${new Date().toISOString()}</p><h2>Dataset</h2><p>${objs.length} objects. Sources: ${esc(srcs)}. Simulation time T+${fmtT(simT)}. Real operational data: none unless you imported it (unverified).</p><h2>Configuration</h2><p>Primary: ${esc(res[0].a.id)} · horizon ${$('#rh').value} h · red below ${$('#tr').value} km · yellow below ${$('#ty').value} km · sampled every 20 s, refined to 1 s</p><h2>Close-approach results (screening estimates)</h2><table border="1" cellpadding="4" style="border-collapse:collapse"><tr><th>A</th><th>B</th><th>TCA</th><th>Miss km</th><th>Rel km/s</th><th>Assessment</th></tr>${top.map(r=>`<tr><td>${esc(r.a.id)}</td><td>${esc(r.b.id)}</td><td>${fmtT(r.tca)}</td><td>${r.miss.toFixed(1)}</td><td>${r.rv.toFixed(1)}</td><td>${RL[risk(r)]}</td></tr>`).join('')}</table><h2>Risk classification</h2><p>${res.length} pairs screened: red ${c('R')}, yellow ${c('Y')}, green ${c('G')}, grey ${c('X')}. Alert reviews saved: ${ns}.</p>${img}<h2>Methods</h2><p>Circular two-body propagation in an inertial frame. Prediction methods and simulations are described on their pages.</p><h2>Limitations</h2><p>All objects are simulated unless imported. No covariance, no drag or perturbations in screening, so no collision probability is given. Distance alone does not show that a collision will occur.</p><h2>Conclusions</h2><p>${c('R')?`${c('R')} simulated pair(s) fall under the red threshold and would need further analysis with real data.`:'No pair is under the red threshold in this simulated run.'} This does not describe real satellites.</p>`;
 $('#rprev').innerHTML=rhtml;try{const l=JSON.parse(localStorage.og_reports||'[]');l.push({t:new Date().toISOString(),n:objs.length,top:top[0].miss});localStorage.og_reports=JSON.stringify(l.slice(-20))}catch{}}
const rdoc=()=>new Blob([`<!doctype html><meta charset="utf-8"><title>ORBITGUARD AI report</title><body style="font-family:sans-serif;max-width:800px;margin:auto">${rhtml}`],{type:'text/html'});
$('#rg').onclick=report;$('#rhd').onclick=()=>{if(!rhtml)report();if(!rhtml)return;const a=document.createElement('a');a.href=URL.createObjectURL(rdoc());a.download='orbitguard-report.html';a.click()};
$('#rcs').onclick=()=>$('#re').click();$('#rpr').onclick=()=>{if(!rhtml)report();if(!rhtml)return;const w=open(URL.createObjectURL(rdoc()));if(w)w.onload=()=>w.print()};
/* settings */
function applySet(){let s={};try{s=JSON.parse(localStorage.og_set||'{}')}catch{}document.documentElement.dataset.theme=s.th||'dark';$('#sth').value=s.th||'dark';
 if(s.sp){speed=s.sp;$('#spd').value=s.sp;$('#spdv').textContent=s.sp+'×';$('#sdsp').value=s.sp}if(s.hz){['#rh','#mh','#th'].forEach(i=>$(i).value=s.hz);$('#sdh').value=s.hz}}
$('#ssv').onclick=()=>{try{localStorage.og_set=JSON.stringify({th:$('#sth').value,sp:+$('#sdsp').value||60,hz:$('#sdh').value})}catch{}applySet()};
$('#scl').onclick=()=>{try{localStorage.clear()}catch{}st={};ev=[];alerts();document.documentElement.dataset.theme='dark'};
$('#sbk').onclick=async()=>{try{const r=await fetch(API+'/api/health');$('#sbs').textContent=r.ok?'Backend online':'Backend error'}catch{$('#sbs').textContent='Backend offline. The frontend works without it.'}};

/* ---- final additions: TLE import, compare, backend check ---- */
const API=window.OG_API||'http://127.0.0.1:8000';
function importTLE(txt){const L=txt.split(/\r?\n/).map(s=>s.trimEnd()).filter(Boolean),ok=[],err=[],seen=new Set(objs.map(o=>o.id));
 const cs=l=>{let s=0;for(const ch of l.slice(0,68))s+=/\d/.test(ch)?+ch:ch==='-'?1:0;return s%10===+l[68]};
 for(let i=0;i<L.length;i++){if(!/^1 \d{5}/.test(L[i]))continue;const l1=L[i],l2=L[i+1]||'',name=i>0&&!/^[12] /.test(L[i-1])?L[i-1].replace(/^0 /,'').trim():'',id='NORAD-'+l1.slice(2,7).trim();i++;
  if(l1.length<69||l2.length<69||!/^2 /.test(l2)||!cs(l1)||!cs(l2)){err.push(id+': invalid line length or checksum');continue}
  if(seen.has(id)){err.push(id+': duplicate');continue}
  const inc=+l2.slice(8,16),raan=+l2.slice(17,25),e=+('0.'+l2.slice(26,33).trim()),ma=+l2.slice(43,51),mm=+l2.slice(52,63);
  if([inc,raan,e,ma,mm].some(isNaN)||mm<=0){err.push(id+': non-numeric field');continue}
  const alt=Math.cbrt(MU/(mm*2*Math.PI/86400)**2)-RE;
  if(e>0.1||alt<150||alt>40000){err.push(`${id}: eccentricity ${e} or altitude ${alt.toFixed(0)} km is outside the circular model`);continue}
  seen.add(id);const nm=name.toUpperCase();ok.push(mk(id,/ DEB|DEB$/.test(nm)?'debris':/R\/B/.test(nm)?'rocket_body':'satellite',alt,inc,raan,ma,'IMPORTED TLE',name||id))}
 objs.push(...ok);build();stats();$('#rep').textContent=`TLE import: ${ok.length} accepted, ${err.length} rejected.\nEpoch is ignored: the mean anomaly is applied at the current simulation time and the orbit is treated as circular, so these are NOT real positions.\n`+err.join('\n')}
$('#kg').onclick=()=>{const a=objs.find(o=>o.id===$('#k1').value),b=objs.find(o=>o.id===$('#k2').value);if(!a||!b||a===b)return $('#kr').textContent='Choose two different objects.';const r=screen(a,[b],24)[0],P=o=>(2*Math.PI/nOf(o)/60).toFixed(1);
 $('#kr').textContent=`${a.id} vs ${b.id}\nAltitude: ${a.alt.toFixed(0)} vs ${b.alt.toFixed(0)} km\nInclination: ${a.inc.toFixed(1)}° vs ${b.inc.toFixed(1)}°\nPeriod: ${P(a)} vs ${P(b)} min\nSources: ${a.src} / ${b.src}\nClosest approach in 24 h (screening estimate): ${r.miss.toFixed(1)} km at ${fmtT(r.tca)}`};
$('#rbk').onclick=async()=>{const a=objs.find(o=>o.id===$('#rsat').value),cvt=o=>({id:o.id,alt_km:o.alt,inc_deg:o.inc,raan_deg:((o.raan%360)+360)%360,ma_deg:((o.ma%360)+360)%360}),l=objs.filter(o=>o!==a&&o.type!=='satellite'&&o.src==='SIMULATION'),h=+$('#rh').value;
 try{const r=await fetch(API+'/api/screen',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({primary:cvt(a),others:l.map(cvt),hours:h})});if(!r.ok)throw 0;const t=(await r.json()).results[0],js=screen(a,l,h)[0];
  $('#rbs').textContent=`Backend (NumPy, 20 s grid): ${t.id} at ${t.miss_km.toFixed(1)} km. Browser (refined to 1 s): ${js.b.id} at ${js.miss.toFixed(1)} km. Small differences come from the grid step.`}catch{$('#rbs').textContent='Backend offline. Start it with uvicorn (see README).'}};
applySet();

/* ---- motion: glowing orbits, trails, collision pulse, intro ---- */
const TL=20;let rings,trail,tsats=[],intro=0;ctl.autoRotate=true;ctl.autoRotateSpeed=.5;
function buildExtras(){if(rings)scene.remove(rings);if(trail)scene.remove(trail);rings=new THREE.Group();tsats=objs.filter(o=>o.type==='satellite').slice(0,60);
 tsats.forEach((o,i)=>{const p=[];for(let k=0;k<128;k++)p.push(toV(posU(o,k/128*2*Math.PI)));rings.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(p),new THREE.LineBasicMaterial({color:[0x22d3ee,0x3b82f6,0x8b5cf6][i%3],transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false})))});
 const n=tsats.length*(TL-1)*2,g=new THREE.BufferGeometry(),c=new Float32Array(n*3);g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
 for(let j=0;j<tsats.length;j++)for(let k=0;k<TL-1;k++)for(let e=0;e<2;e++){const f=1-(k+e)/TL;c.set([.2*f,.8*f,f],((j*(TL-1)+k)*2+e)*3)}
 g.setAttribute('color',new THREE.BufferAttribute(c,3));trail=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));trail.frustumCulled=false;scene.add(rings,trail)}
function animTrails(){const a=trail.geometry.attributes.position.array;let i=0;tsats.forEach(o=>{let pv=toV(pos(o,simT));for(let k=1;k<TL;k++){const v=toV(pos(o,simT-k*60));a[i++]=pv.x;a[i++]=pv.y;a[i++]=pv.z;a[i++]=v.x;a[i++]=v.y;a[i++]=v.z;pv=v}});trail.geometry.attributes.position.needsUpdate=true}
const pl=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(1,0,0)]),new THREE.LineBasicMaterial({color:0xff3344,transparent:true,opacity:.8})),pr=new THREE.Mesh(new THREE.RingGeometry(.16,.2,32),new THREE.MeshBasicMaterial({color:0xff3344,transparent:true,side:THREE.DoubleSide,depthWrite:false}));pl.visible=pr.visible=false;pl.frustumCulled=false;scene.add(pl,pr);
function pulse(now){const e=res[0];if(!e||!objs.includes(e.a)||!objs.includes(e.b)){pl.visible=pr.visible=false;evl.style.display='none';return}const A=toV(pos(e.a,simT)),B=toV(pos(e.b,simT));pl.geometry.setFromPoints([A,B]);pl.visible=pr.visible=true;pr.position.copy(A);pr.lookAt(cam.position);const s=Math.sin(now/250);pr.scale.setScalar(1+.6*s);{const q=A.clone().project(cam);evl.style.display='block';const r0=cv.getBoundingClientRect();evl.style.left=r0.left+(q.x+1)/2*r0.width+'px';evl.style.top=r0.top+(1-q.y)/2*r0.height+'px';evl.innerHTML=`${e.a.id} × ${e.b.id}<small>screening ${e.miss.toFixed(0)} km · ${fmtT(e.tca)} · SIMULATION</small>`}pr.material.opacity=.7-.3*s}

/* ---- immersive dashboard: network mesh, radar, controls ---- */
const evl=$('#evl'),rd=$('#rad'),rx=rd.getContext('2d'),net=new THREE.Group(),ig=new THREE.IcosahedronGeometry(RE/1000*1.07,3);
net.add(new THREE.LineSegments(new THREE.WireframeGeometry(ig),new THREE.LineBasicMaterial({color:0x7dd3fc,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false})),new THREE.Points(ig,new THREE.PointsMaterial({size:.07,map:gt,color:0xbfe8ff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));scene.add(net);
function radar(now){const w=rd.width,c=w/2,k=c*.9/(RE+2000);rx.clearRect(0,0,w,w);rx.strokeStyle='rgba(120,220,255,.35)';[.3,.6,.95].forEach(f=>{rx.beginPath();rx.arc(c,c,c*f,0,7);rx.stroke()});
 const a=now/900%(2*Math.PI);rx.strokeStyle='rgba(34,211,238,.9)';rx.beginPath();rx.moveTo(c,c);rx.lineTo(c+Math.cos(a)*c*.95,c+Math.sin(a)*c*.95);rx.stroke();
 objs.forEach((o,i)=>{if(i%3)return;const p=pos(o,simT);rx.fillStyle=o.type==='satellite'?'#22d3ee':'#ff7a1a';rx.fillRect(c+p[0]*k-1,c+p[1]*k-1,2.5,2.5)})}
$('#zi').onclick=()=>cam.position.multiplyScalar(.85);$('#zo').onclick=()=>cam.position.multiplyScalar(1.18);
$('#expl').onclick=()=>{const s=objs.filter(o=>o.type==='satellite'),o=s[Math.floor(Math.random()*s.length)];if(!o)return;select(o);cam.position.copy(toV(pos(o,simT)).normalize().multiplyScalar(13));intro=1};
$$('[data-g]').forEach(b=>b.onclick=()=>go(b.dataset.g));

/* ---- real Earth imagery (NASA-based textures), clock ---- */
function loadTex(list,ok,fail){let i=0;const t=()=>{if(i>=list.length)return fail&&fail();new THREE.TextureLoader().setCrossOrigin('anonymous').load(list[i++],ok,undefined,t)};t()}
const TB=['assets/','https://cdn.jsdelivr.net/gh/mrdoob/three.js@r147/examples/textures/planets/','https://threejs.org/examples/textures/planets/'],U=f=>TB.map(b=>b+f),tx=$('#tex');
loadTex(U('earth_atmos_2048.jpg'),t=>{emat.uniforms.dayT.value=t;tx.textContent='Earth: real imagery loaded';tx.className='chip ok'},()=>{tx.textContent='Earth: image not loaded, drawn globe shown'});
loadTex(U('earth_lights_2048.png'),t=>{emat.uniforms.nightT.value=t});
loadTex(U('earth_clouds_1024.png'),t=>{clouds.material.map=t;clouds.material.opacity=.9;clouds.material.needsUpdate=true});
setInterval(()=>$('#clk').textContent='UTC '+new Date().toISOString().slice(11,19),1000);
gen();build();stats();size();go2();fillSel();requestAnimationFrame(loop);

})();