/* A stationary mountain plate; only segmented cloud valleys are advected. */
(() => {
 'use strict';const T=THREE,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let last=-1,seed=Math.random()*5000,drift=new T.Vector2(),wind=new T.Vector2(.065,.014),target=wind.clone(),nextWind=0;
 if(reduced)return;
 const texture=src=>new Promise((r,j)=>new T.TextureLoader().load(src,r,undefined,j));
 async function init(){
  const [plate,mask]=await Promise.all([texture(COVER_PLATE_DATA),texture(V3_PLATES.cloudMask)]);plate.colorSpace=T.SRGBColorSpace;delete window.COVER_PLATE_DATA;
  const renderer=new T.WebGLRenderer({alpha:false,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1));renderer.outputColorSpace=T.SRGBColorSpace;renderer.domElement.className='cover-cloud-layer';renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1),mat=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{plate:{value:plate},mask:{value:mask},t:{value:0},seed:{value:seed},drift:{value:drift},aspect:{value:innerWidth/innerHeight}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
  uniform sampler2D plate,mask;uniform float t,seed,aspect;uniform vec2 drift;varying vec2 v;
  float hash(vec3 p){p=fract(p*.3183099+vec3(.13,.29,.47));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float n=0.,a=.55;for(int i=0;i<4;i++){n+=a*noise(p);p=p*2.04+vec3(7,13,5);a*=.49;}return n;}
  void main(){vec2 uv=v;float ratio=(1672./941.)/aspect;if(ratio>1.)uv.x=(uv.x-.5)/ratio+.5;else uv.y=(uv.y-.5)*ratio+.5;
   vec3 original=texture2D(plate,uv).rgb;float l=dot(original,vec3(.2126,.7152,.0722));
   float m=smoothstep(.15,.75,texture2D(mask,uv).r)*smoothstep(.012,.11,l);
   // Two scales of continuously evolving billows; no whole-plate translation.
   vec3 p=vec3(uv*vec2(7.5,9.)-drift,seed+t*.135);
   float broad=fbm(p*.61+vec3(11.,5.,2.));
   float n=fbm(p+vec3(broad*1.6,-broad*1.2,0.));
   float curl=fbm(p+vec3(n*2.2,-n*1.8,17.));
   vec2 flow=vec2(n-.48,curl-.48)*vec2(.070,.045)*m;
   float safeMask=smoothstep(.30,.85,texture2D(mask,uv+flow).r);flow*=safeMask;
   vec3 displaced=texture2D(plate,uv+flow).rgb;
   float wisps=fbm(vec3(uv*vec2(19.,22.)-drift*1.9+vec2(curl,n),seed+41.+t*.19));
   float volume=smoothstep(.29,.67,n*.76+wisps*.24);
   float rim=smoothstep(.38,.69,curl)*smoothstep(.23,.64,broad);
   vec3 light=mix(vec3(.38,.48,.52),vec3(.98,.82,.59),smoothstep(.28,.98,uv.x));
   vec3 cloud=displaced*(.66+volume*.54);
   cloud=mix(cloud,light,volume*.27+rim*.17);
   gl_FragColor=vec4(mix(original,cloud,m),1.);
   #include <colorspace_fragment>
  }`});scene.add(new T.Mesh(new T.PlaneGeometry(2,2),mat));
  const fit=()=>{renderer.setSize(innerWidth,innerHeight,false);mat.uniforms.aspect.value=innerWidth/innerHeight;};addEventListener('resize',fit);fit();await renderer.compileAsync(scene,camera);
  let frames=0;function tick(){requestAnimationFrame(tick);const s=window.CinemaEngine?.getState();if(!s?.ready)return;
   if(s.sceneIndex!==0){if(renderer.domElement.parentElement&&!renderer.domElement.parentElement.style.backgroundImage.includes('mountains'))renderer.domElement.remove();return;}
   const panel=[...document.querySelectorAll('.backdrop')].sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0)).find(p=>p.style.backgroundImage.includes('mountains'));if(panel&&renderer.domElement.parentElement!==panel)panel.appendChild(renderer.domElement);
   if(s.time===last)return;const dt=last<0?0:Math.min(.1,s.time-last);last=s.time;
   if(last>nextWind){target.set(.045+Math.random()*.055,-.009+Math.random()*.034);nextWind=last+7+Math.random()*12;}
   wind.lerp(target,1-Math.exp(-dt*.12));drift.addScaledVector(wind,dt);mat.uniforms.t.value=last;renderer.render(scene,camera);frames++;
  }tick();window.CloudSea={getState:()=>({ready:true,seed,time:last,frames,drift:drift.toArray(),wind:wind.toArray(),algorithm:'multi-scale rolling cloud volumes with stochastic advection',stationaryTerrain:true})};
 }init().catch(e=>console.warn('Cloud field unavailable',e));
})();
