import * as THREE from './vendor/three.module.js';

const host = document.getElementById('space-scene');
const motionButton = document.getElementById('motion-toggle');
const soundButton = document.getElementById('sound-toggle');
let moving = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer, scene, camera, rocket, stars, sparkles, last = 0, boost = 0, homeY = 4;
const positions = [];
function updateMotion() {
  motionButton.textContent = moving ? '✦ การเคลื่อนไหว' : '✦ ภาพนิ่ง';
  motionButton.setAttribute('aria-pressed', String(moving));
}
soundButton.onclick = () => {
  window.soundEnabled = !window.soundEnabled;
  soundButton.textContent = window.soundEnabled ? '🔊 เสียงเปิด' : '🔇 เสียงปิด';
  soundButton.setAttribute('aria-pressed', String(window.soundEnabled));
  if (!window.soundEnabled) {
    window.speechSynthesis?.cancel();
    window.currentUiAudio?.pause();
    document.querySelectorAll('audio').forEach(a => a.pause());
  }
};
motionButton.onclick = () => { moving = !moving; updateMotion(); };
updateMotion();
window.addEventListener('word-earned', event => {
  const {count, total} = event.detail;
  document.getElementById('star-count').textContent = `ดาว ${count}/${total}`;
  boost = count ? 1 : 0;
});

try {
  renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0xeef2ff,1);
  host.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);
  camera.position.z = 15;
  scene.add(new THREE.HemisphereLight(0xffffff,0x64748b,3));
  const light = new THREE.DirectionalLight(0xffffff,4);
  light.position.set(4,6,8);scene.add(light);
  rocket = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,1.2,24),new THREE.MeshStandardMaterial({color:0xf8fafc,roughness:.35}));
  rocket.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.3,.55,24),new THREE.MeshStandardMaterial({color:0xf43f5e}));
  nose.position.y=.87;rocket.add(nose);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(.18,16,12),new THREE.MeshStandardMaterial({color:0x38bdf8,metalness:.4,roughness:.2}));
  glass.position.set(0,.15,.27);glass.scale.z=.35;rocket.add(glass);
  for(const side of [-1,1]) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(.2,.6,3),new THREE.MeshStandardMaterial({color:0x14b8a6}));
    fin.position.set(side*.32,-.4,0);fin.rotation.z=-side*.5;rocket.add(fin);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.18,.65,12),new THREE.MeshBasicMaterial({color:0xfbbf24}));
  flame.rotation.z=Math.PI;flame.position.y=-.85;rocket.add(flame);
  rocket.position.set(-3,-2,0);rocket.rotation.z=-.3;scene.add(rocket);
  const starShape = new THREE.Shape();
  for(let i=0;i<10;i++) { const a=i*Math.PI/5+Math.PI/2,r=i%2?.09:.21; if(!i)starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);else starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r); }
  starShape.closePath();
  const geometry = new THREE.ExtrudeGeometry(starShape,{depth:.07,bevelEnabled:false});
  stars = new THREE.Group();
  for(let i=0;i<32;i++) {
    const mesh = new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:[0xfbbf24,0x38bdf8,0xf472b6][i%3]}));
    mesh.position.set((Math.random()-.5)*18,(Math.random()-.5)*20,-2-Math.random()*4);
    stars.add(mesh);
  }
  scene.add(stars);
  for(let i=0;i<90;i++) positions.push((Math.random()-.5)*12,(Math.random()-.5)*14,Math.random()*2);
  const particles = new THREE.BufferGeometry();particles.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  sparkles = new THREE.Points(particles,new THREE.PointsMaterial({color:0xf59e0b,size:.09,transparent:true,opacity:0}));scene.add(sparkles);
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();homeY=Math.tan(42*Math.PI/360)*15*(1-125/innerHeight);rocket.position.set(0,homeY,0);rocket.scale.setScalar(.65);}
  window.addEventListener('resize',resize);resize();
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.style.display='none';});
  renderer.setAnimationLoop(time=>{
    const dt=Math.min((time-last)/1000,.05);last=time;
    if(document.hidden)return;
    if(moving) {
      rocket.position.y=homeY+Math.sin(time*.001)*.12+Math.sin(boost*Math.PI)*.65;
      rocket.rotation.y=Math.sin(time*.0005)*.3;
      flame.scale.y=.8+Math.sin(time*.014)*.2+boost;
      stars.children.forEach((s,i)=>{s.rotation.z+=dt*(i%2?.15:-.15);});
      boost=Math.max(0,boost-dt*.35);
      sparkles.rotation.z+=dt*.3;
      sparkles.material.opacity=boost;
    } else {boost=0;sparkles.material.opacity=0;}
    renderer.render(scene,camera);
  });
} catch(error) {
  host.remove();
  motionButton.hidden=true;
  console.warn('ใช้พื้นหลังปกติ: ไม่สามารถเปิดฉากสามมิติได้',error.message);
}
