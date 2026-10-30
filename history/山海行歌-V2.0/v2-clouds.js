/* Advected volumetric noise. No sprite loop or repeating keyframe path. */
(() => {
 'use strict';
 const T=THREE,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced)return;
 let renderer,texture,mesh,lastTime=-1;
 const seed=Math.random()*1000;
 async function init(){
  texture=await new Promise((r,j)=>new T.TextureLoader().load(window.COVER_PLATE_DATA,r,undefined,j));texture.colorSpace=T.SRGBColorSpace;delete window.COVER_PLATE_DATA;
  renderer=new T.WebGLRenderer({alpha:false,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.domElement.className='cover-cloud-layer';renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  mesh=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,
   uniforms:{plate:{value:texture},t:{value:0},seed:{value:seed},aspect:{value:innerWidth/innerHeight}},
   vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`uniform sampler2D plate;uniform float t,seed,aspect;varying vec2 v;
    float hash(vec3 p){p=fract(p*.3183099+vec3(.13,.29,.47));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){float a=.5,n=0.;for(int i=0;i<4;i++){n+=a*noise(p);p=p*2.03+vec3(11.1,7.2,2.9);a*=.5;}return n;}
    float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
    void main(){vec2 uv=v;float ratio=(1672./941.)/aspect;if(ratio>1.)uv.x=(uv.x-.5)/ratio+.5;else uv.y=(uv.y-.5)*ratio+.5;
     vec3 original=texture2D(plate,uv).rgb;float l=lum(original);
     float edge=abs(l-lum(texture2D(plate,uv+vec2(.004,0)).rgb))+abs(l-lum(texture2D(plate,uv+vec2(0,.006)).rgb));
     float mask=smoothstep(.055,.22,l)*(1.-smoothstep(.018,.10,edge))*(1.-smoothstep(.73,.84,uv.y));
     mask*=1.-smoothstep(.90,.99,uv.x); // preserve the near cliff and wooden path
     vec3 p=vec3(uv*vec2(7.,10.)+vec2(-t*.060,t*.010),seed+t*.018);
     float n=fbm(p),curl=fbm(p+vec3(n*2.,2.7,8.1));
     vec2 flow=vec2(n-.48,curl-.48)*vec2(.034,.025)*mask;
     vec3 cloud=texture2D(plate,uv+flow).rgb;
     float veil=smoothstep(.38,.69,fbm(p*.8+vec3(curl,0,13.)))*mask;
     vec3 light=mix(vec3(.30,.39,.42),vec3(.91,.73,.46),uv.x);
     vec3 color=mix(original,cloud,mask*.9);color=mix(color,light,veil*.22);
     gl_FragColor=vec4(color,1.);
     #include <colorspace_fragment>
    }`
  }));scene.add(mesh);
  function fit(){renderer.setSize(innerWidth,innerHeight,false);mesh.material.uniforms.aspect.value=innerWidth/innerHeight;lastTime=-1;}
  addEventListener('resize',fit);fit();await renderer.compileAsync(scene,camera);renderer.render(scene,camera);
  function tick(){requestAnimationFrame(tick);const s=window.CinemaEngine?.getState();if(renderer.domElement.parentElement&&!renderer.domElement.parentElement.style.backgroundImage.includes('mountains'))renderer.domElement.remove();if(!s?.ready||s.sceneIndex!==0)return;
   const panel=[...document.querySelectorAll('.backdrop')].sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0)).find(p=>p.style.backgroundImage.includes('mountains'));
   if(panel&&renderer.domElement.parentElement!==panel)panel.appendChild(renderer.domElement);
   if(s.time===lastTime)return;lastTime=s.time;mesh.material.uniforms.t.value=s.time;renderer.render(scene,camera);
  }tick();
  window.CloudSea={getState:()=>({seed,time:lastTime,algorithm:'advected 3D fBM',ready:true})};
 }
 init().catch(error=>console.warn('Cloud motion unavailable',error));
})();
