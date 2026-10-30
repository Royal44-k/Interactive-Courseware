/* Independent, local-only poetry space. Real 3D vertices are projected onto Canvas2D. */
(function () {
  'use strict';

  var active = null;
  var TAU = Math.PI * 2;
  var MODES = {
    mountain: { name: '高山', title: '连峰去天不盈尺', lines: ['连峰去天不盈尺，', '枯松倒挂倚绝壁。'], observation: '转动山体，观察峰峦与断崖的高低关系。诗人将山峰推近天际，以夸张写出蜀道的高与险。', cue: '仰观连峰 · 感受高险', yaw: -0.42, pitch: 0.24 },
    walkway: { name: '栈道', title: '天梯石栈相钩连', lines: ['地崩山摧壮士死，', '然后天梯石栈相钩连。'], observation: '沿着木栈道转动视角，观察横梁如何伸出崖壁、斜撑如何托起路面。想象行人在绝壁间通行的艰难。', cue: '循栈入山 · 体会道险', yaw: -0.26, pitch: 0.27 },
    pass: { name: '剑阁', title: '一夫当关，万夫莫开', lines: ['剑阁峥嵘而崔嵬，', '一夫当关，万夫莫开。'], observation: '从正面与侧面观察关隘：两侧峭壁夹出狭窄通道。地势的险要，与“一夫”“万夫”的悬殊形成呼应。', cue: '环视雄关 · 理解地险', yaw: -0.36, pitch: 0.2 }
  };

  var CSS = `
    .ps-space{--ps-gold:#d7bd87;--ps-text:#deddd0;--ps-muted:#94aaa9;position:relative;width:100%;height:100%;min-height:0;isolation:isolate;background:#071b23;color:var(--ps-text);font-family:"Microsoft YaHei","PingFang SC",sans-serif;overflow:hidden;box-sizing:border-box}
    .ps-space *{box-sizing:border-box}.ps-space button,.ps-space input{font:inherit}.ps-space button{cursor:pointer}.ps-space button:focus-visible,.ps-space input:focus-visible,.ps-canvas:focus-visible{outline:2px solid #ead39f;outline-offset:4px}
    .ps-layout{height:100%;display:grid;grid-template-columns:minmax(230px,30%) 1fr}.ps-info{z-index:2;position:relative;min-height:0;display:flex;flex-direction:column;padding:clamp(20px,3.2vw,48px) clamp(20px,2.9vw,44px);border-right:1px solid rgba(198,185,143,.13);background:linear-gradient(100deg,rgba(6,23,30,.98),rgba(7,27,35,.7))}
    .ps-eyebrow{color:var(--ps-gold);font-size:11px;letter-spacing:3px;margin:0 0 17px;white-space:nowrap}.ps-heading{font-family:"STKaiti","KaiTi","Songti SC","SimSun",serif;font-size:clamp(24px,2.7vw,39px);font-weight:normal;letter-spacing:5px;margin:0 0 7px;line-height:1.25}.ps-subtitle{font-size:10px;letter-spacing:2px;color:var(--ps-muted);margin:0 0 28px}
    .ps-tabs{display:flex;border-bottom:1px solid rgba(215,189,135,.19);gap:18px;margin-bottom:25px}.ps-tab{border:0;background:none;color:#94a7a5;padding:10px 0 12px;position:relative;font-size:13px;white-space:nowrap;letter-spacing:2px}.ps-tab[aria-pressed=true]{color:#e5cfa2}.ps-tab[aria-pressed=true]:after{content:"";height:2px;background:var(--ps-gold);position:absolute;left:0;right:2px;bottom:-1px}.ps-tab:hover{color:#f2dec0}
    .ps-verse{margin:0 0 17px;font-family:"STKaiti","KaiTi","Songti SC","SimSun",serif;font-size:clamp(19px,1.8vw,26px);line-height:1.8;letter-spacing:1px;color:#f0e3c5;white-space:nowrap}.ps-observation{margin:0;font-size:clamp(11px,1vw,13px);line-height:1.95;color:#a8b9b6;text-align:justify;max-width:320px}.ps-rule{height:1px;width:32px;background:rgba(215,189,135,.5);margin:20px 0}
    .ps-controls{margin-top:auto;padding-top:22px}.ps-control{margin:0 0 17px}.ps-control-label{display:flex;align-items:center;justify-content:space-between;font-size:11px;letter-spacing:1px;color:#b4c2be;margin-bottom:10px}.ps-control output{font-family:Georgia,serif;color:#d6bc8a;letter-spacing:0}.ps-control input{width:100%;height:14px;margin:0;accent-color:#d7bd87;cursor:pointer;display:block}.ps-control input[type=range]{-webkit-appearance:none;appearance:none;background:transparent}.ps-control input[type=range]::-webkit-slider-runnable-track{height:2px;background:rgba(215,189,135,.3)}.ps-control input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:10px;border:1px solid #f6e5c2;border-radius:50%;background:#d7bd87;margin-top:-4px;box-shadow:0 0 9px #d7bd8730}.ps-control input[type=range]::-moz-range-track{height:2px;background:rgba(215,189,135,.3)}.ps-control input[type=range]::-moz-range-thumb{width:9px;height:9px;border:1px solid #f6e5c2;border-radius:50%;background:#d7bd87}
    .ps-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ps-button{border:1px solid rgba(215,189,135,.27);background:rgba(215,189,135,.035);color:#cfc8b1;min-height:33px;padding:7px 10px;border-radius:2px;font-size:11px;letter-spacing:1px}.ps-button:hover{background:rgba(215,189,135,.13);border-color:rgba(215,189,135,.6)}.ps-reset{width:100%;margin-top:8px;background:none;border-color:transparent;color:#8fa7a5}.ps-note{margin:13px 0 0;font-size:9px;line-height:1.5;letter-spacing:1px;color:#708c8e}
    .ps-stage{min-width:0;min-height:0;position:relative;overflow:hidden;background:radial-gradient(ellipse at 55% 42%,#133c43 0,#0c2931 35%,#071b23 74%)}.ps-canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}.ps-canvas.ps-dragging{cursor:grabbing}.ps-scene-heading{position:absolute;top:clamp(20px,3.2vw,48px);left:30px;pointer-events:none}.ps-scene-heading p{margin:0;font-size:10px;letter-spacing:3px;color:#8da6a6}.ps-scene-heading h3{margin:12px 0 0;font-family:"STKaiti","KaiTi","Songti SC","SimSun",serif;font-weight:normal;font-size:clamp(20px,2.1vw,30px);letter-spacing:5px;color:#ddcfad}.ps-mode-tag{position:absolute;top:clamp(20px,3.2vw,48px);right:28px;display:flex;align-items:center;gap:7px;border:1px solid #d7bd8725;padding:7px 10px;color:#b6b69e;font-size:9px;letter-spacing:2px;pointer-events:none}.ps-mode-tag:before{content:"";display:block;width:4px;height:4px;background:#d7bd87;border-radius:50%;box-shadow:0 0 8px #d7bd8780}
    .ps-stage-footer{position:absolute;bottom:25px;left:30px;right:30px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px;pointer-events:none;color:#96aaa6;font-size:10px;letter-spacing:1.2px}.ps-gesture{display:flex;gap:9px;align-items:center}.ps-gesture svg{width:17px;height:17px;opacity:.8}.ps-compass{position:absolute;bottom:64px;right:33px;width:43px;height:43px;border:1px solid #d7bd872b;border-radius:50%;pointer-events:none;display:grid;place-items:center}.ps-compass:before,.ps-compass:after{content:"";position:absolute;background:#d7bd8738}.ps-compass:before{width:1px;height:51px}.ps-compass:after{height:1px;width:51px}.ps-compass-arrow{display:block;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:18px solid #d7bd87;transform-origin:50% 70%;filter:drop-shadow(0 0 4px #d7bd8740)}
    .ps-status{position:absolute;left:50%;bottom:62px;transform:translateX(-50%);color:#d7bd87;background:#071b23ba;border:1px solid #d7bd8729;padding:6px 12px;font-size:10px;letter-spacing:1px;border-radius:20px;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap}.ps-status.ps-visible{opacity:1}
    @media(max-width:820px){.ps-layout{grid-template-columns:230px 1fr}.ps-info{padding:24px 20px}.ps-subtitle{margin-bottom:16px}.ps-tabs{margin-bottom:18px;gap:18px}.ps-verse{font-size:19px}.ps-observation{font-size:11px;line-height:1.8}.ps-scene-heading{left:20px;top:25px}.ps-scene-heading h3{font-size:21px;letter-spacing:2px}.ps-mode-tag{display:none}.ps-stage-footer{left:20px;right:20px;font-size:9px;letter-spacing:.2px}.ps-stage-footer>span:last-child{display:none}}
    @media(max-height:610px){.ps-info{padding-top:20px;padding-bottom:17px}.ps-eyebrow{margin-bottom:9px}.ps-heading{font-size:28px}.ps-subtitle{margin-bottom:12px}.ps-tabs{margin-bottom:12px}.ps-tab{padding:7px 0 9px}.ps-verse{font-size:20px;line-height:1.65;margin-bottom:10px}.ps-observation{font-size:11px;line-height:1.7}.ps-rule{margin:12px 0}.ps-controls{padding-top:12px}.ps-control{margin-bottom:11px}.ps-control-label{margin-bottom:7px}.ps-button{min-height:29px;padding:5px}.ps-note{margin-top:7px}.ps-stage-footer{bottom:17px}.ps-scene-heading{top:23px}}
    @media(max-width:590px){.ps-layout{grid-template-columns:minmax(150px,36%) 1fr}.ps-info{padding:18px 13px}.ps-eyebrow{font-size:8px;letter-spacing:1px}.ps-heading{font-size:24px;letter-spacing:2px}.ps-subtitle{font-size:8px;letter-spacing:.5px}.ps-tabs{gap:12px}.ps-tab{font-size:11px;letter-spacing:0}.ps-verse{font-size:15px;letter-spacing:0}.ps-observation{font-size:10px;line-height:1.65}.ps-rule{margin:12px 0}.ps-scene-heading{left:15px}.ps-scene-heading h3{font-size:18px;letter-spacing:1px;max-width:150px;line-height:1.6}.ps-scene-heading p{font-size:8px;letter-spacing:1px}.ps-stage-footer{left:15px;right:12px}.ps-gesture{font-size:8px;gap:5px}.ps-compass{right:20px}.ps-control-label{font-size:10px}.ps-button{font-size:10px;padding-left:3px;padding-right:3px}.ps-note{font-size:8px;letter-spacing:0}}
    @media(prefers-reduced-motion:reduce){.ps-status{transition:none}}
  `;

  function random(seed) {
    var value = seed >>> 0;
    return function () { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
  }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function hexColor(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
  function blend(a, b, amount) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * amount); }); }
  function color(rgb) { return 'rgb(' + rgb.join(',') + ')'; }
  function addFace(scene, points, hex, edge) { scene.faces.push({ points: points, rgb: hexColor(hex), edge: edge || null }); }
  function box(scene, x, y, z, w, h, d, hex, edge) {
    var p = [[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+h,z-d/2],[x-w/2,y+h,z-d/2],[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];
    [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]].forEach(function (indices) { addFace(scene, indices.map(function (i) { return p[i]; }), hex, edge); });
  }
  function beam(scene, start, end, width, hex) {
    var dir=end.map(function (v,i) { return v-start[i]; });
    var len=Math.hypot(dir[0],dir[1],dir[2]); if (len<.001) return;
    dir=dir.map(function(v){return v/len;});
    var u=Math.abs(dir[1])<.9?[-dir[2],0,dir[0]]:[1,0,0];
    var ul=Math.hypot(u[0],u[1],u[2]);u=u.map(function(v){return v/ul*width/2;});
    var v=[dir[1]*u[2]-dir[2]*u[1],dir[2]*u[0]-dir[0]*u[2],dir[0]*u[1]-dir[1]*u[0]];
    var p=[];[start,end].forEach(function(s){[[1,1],[1,-1],[-1,-1],[-1,1]].forEach(function(k){p.push(s.map(function(n,i){return n+u[i]*k[0]+v[i]*k[1];}));});});
    [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]].forEach(function(indices){addFace(scene,indices.map(function(i){return p[i];}),hex);});
  }
  function mountain(scene, x, z, height, radius, seed, tint) {
    var rand=random(seed), sides=8, levels=[[-.6,1.12],[height*.2,.85],[height*.47,.58],[height*.72,.3]], rings=[];
    var dx=(rand()-.5)*radius*.55, dz=(rand()-.5)*radius*.35;
    levels.forEach(function(level,j){var ring=[];for(var i=0;i<sides;i++){var angle=i/sides*TAU+.17;var rr=radius*level[1]*(.82+rand()*.3);ring.push([x+Math.cos(angle)*rr+dx*j/4,level[0]+(j? (rand()-.5)*height*.12:0),z+Math.sin(angle)*rr+dz*j/4]);}rings.push(ring);});
    var palette=tint||['#28504f','#30605b','#396b61','#24464a','#417365','#355b55'];
    for(var j=0;j<rings.length-1;j++)for(var i=0;i<sides;i++){var next=(i+1)%sides;addFace(scene,[rings[j][i],rings[j][next],rings[j+1][i]],palette[Math.floor(rand()*palette.length)]);addFace(scene,[rings[j][next],rings[j+1][next],rings[j+1][i]],palette[Math.floor(rand()*palette.length)]);}
    var peak=[x+dx,height,z+dz];for(var i=0;i<sides;i++)addFace(scene,[rings[3][i],rings[3][(i+1)%sides],peak],palette[Math.floor(rand()*palette.length)]);
    return peak;
  }
  function pine(scene, x, y, z, size, lean) {
    beam(scene,[x,y,z],[x+(lean||0)*size,y+size,z],.065*size,'#6c6450');
    for(var level=0;level<3;level++){var yy=y+size*(.38+level*.22),radius=size*(.39-level*.08),cx=x+(lean||0)*size*(.4+level*.2);var top=[cx,yy+size*.44,z];for(var i=0;i<5;i++){var a=i/5*TAU,b=(i+1)/5*TAU;addFace(scene,[[cx+Math.cos(a)*radius,yy,z+Math.sin(a)*radius],[cx+Math.cos(b)*radius,yy,z+Math.sin(b)*radius],top],i%2?'#244b43':'#356052');}}
  }
  function path(scene, points, width, rail) {
    var steps=[];
    for(var s=0;s<points.length-1;s++){var a=points[s],b=points[s+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.24);for(var i=0;i<n;i++){var t=i/n;steps.push(a.map(function(v,k){return v+(b[k]-v)*t;}));}}steps.push(points[points.length-1]);
    for(var i=0;i<steps.length-1;i++){var a=steps[i],b=steps[i+1],vx=b[0]-a[0],vz=b[2]-a[2],len=Math.hypot(vx,vz)||1,nx=-vz/len*width/2,nz=vx/len*width/2;
      beam(scene,[a[0]+nx,a[1],a[2]+nz],[a[0]-nx,a[1],a[2]-nz],.14,i%3?'#a88858':'#bc9c65');
      if(rail&&i%5===0){[-1,1].forEach(function(sign){beam(scene,[a[0]+nx*sign,a[1],a[2]+nz*sign],[a[0]+nx*sign,a[1]+.6,a[2]+nz*sign],.065,'#9e8050');});
        beam(scene,[a[0]+nx*1.2,a[1]-.1,a[2]+nz*1.2],[a[0]-nx*1.2,a[1]-.1,a[2]-nz*1.2],.14,'#71583d');
        beam(scene,[a[0]+nx,a[1]-.1,a[2]+nz],[a[0]-nx*.6,a[1]-1.3,a[2]-nz*.6],.11,'#806644');
      }
      if(rail){[-1,1].forEach(function(sign){beam(scene,[a[0]+nx*sign,a[1]+.58,a[2]+nz*sign],[b[0]+nx*sign,b[1]+.58,b[2]+nz*sign],.045,'#ab8e5f');});}
    }
  }
  function gate(scene) {
    box(scene,0,-.5,-1.8,6.3,.8,4.4,'#4b6259');
    [-1,1].forEach(function(sign){box(scene,sign*1.72,.3,-1.8,1.45,2.75,1.5,'#7d8270','#0a222433');box(scene,sign*1.72,2.9,-1.8,1.8,.27,1.9,'#6b7568');for(var ix=-1;ix<=1;ix++){box(scene,sign*1.72+ix*.55,3.17,-2.54,.28,.4,.3,'#8b8b73');box(scene,sign*1.72+ix*.55,3.17,-1.07,.28,.4,.3,'#8b8b73');}
      for(var y=.6;y<2.9;y+=.46){scene.lines.push({a:[sign*1.72-.7,y,-2.555],b:[sign*1.72+.7,y,-2.555],rgb:[52,70,61],width:.65});}
    });
    box(scene,0,2.15,-1.8,2.1,.75,1.45,'#777d6c');
    box(scene,0,2.85,-1.8,2.4,.18,1.8,'#b39a66');
    box(scene,0,3.03,-1.8,1.75,.8,1.15,'#746b50');
    [-.62,0,.62].forEach(function(x){box(scene,x,3.09,-2.391,.34,.53,.03,'#233b38');});
    var roof=[[-1.75,3.84,-2.8],[1.75,3.84,-2.8],[1.5,4.28,-1.8],[-1.5,4.28,-1.8],[-1.75,3.84,-.8],[1.75,3.84,-.8]];
    addFace(scene,[roof[0],roof[1],roof[2],roof[3]],'#648178');addFace(scene,[roof[3],roof[2],roof[5],roof[4]],'#3a5d58');addFace(scene,[roof[0],roof[3],roof[4]],'#a58d5b');addFace(scene,[roof[1],roof[5],roof[2]],'#a58d5b');
    beam(scene,[-1.55,4.3,-1.8],[1.55,4.3,-1.8],.1,'#c1a36f');beam(scene,[-1.8,3.84,-2.8],[1.8,3.84,-2.8],.1,'#b7a171');
    for(var z=-5.8;z<-2.5;z+=.4)box(scene,0,-.35+(z+5.8)*.12,z,1.8,.17,.39,'#66736a');
    path(scene,[[-.1,.35,-2.7],[-.1,.22,-4.2],[-1.3,.03,-5.8],[-2.9,-.1,-7]],1.05,false);
  }
  function createScene(mode) {
    var scene={faces:[],lines:[],labels:[]};
    var rand=random(819);var ring=[];for(var i=0;i<20;i++){var a=i/20*TAU;ring.push([Math.cos(a)*10.5,-.68,Math.sin(a)*6.5]);}for(var i=0;i<20;i++)addFace(scene,[[0,-.7,0],ring[i],ring[(i+1)%20]],i%2?'#1b383b':'#1d3e40');
    if(mode==='mountain'){
      mountain(scene,-6,3,6.2,3.5,10);mountain(scene,5,4,7.5,3.9,21);mountain(scene,0,3.4,9.7,3.5,33);mountain(scene,-3,-.6,6.5,2.5,54);mountain(scene,4,-.2,5.4,2.5,72);mountain(scene,-7,-2.4,3.4,2.6,64);mountain(scene,7,-2.6,3.6,2.4,17);mountain(scene,.5,-2.2,4.8,1.9,94);
      path(scene,[[-7,.5,-4],[-4,1.2,-3.2],[-1,1.9,-3.5],[1.8,2.3,-2.5],[3.6,2.8,-1.9]],.38,false);
      pine(scene,-3.6,4,-.8,.8,-.6);pine(scene,3.8,3.5,-.9,.8,.45);pine(scene,-6.5,1.9,-3,.65,-.3);
      scene.labels.push({point:[.2,9.8,3.5],text:'连峰近天',dx:32,dy:-16},{point:[-3.5,4.5,-.9],text:'枯松绝壁',dx:-92,dy:-8});
    } else if(mode==='walkway'){
      mountain(scene,-6,3.5,7.6,3.7,41);mountain(scene,-1,4.4,9.3,3.8,52);mountain(scene,4.6,3,8.2,3.9,67);mountain(scene,7.5,.2,5,2.6,19);mountain(scene,-8,-.2,4,2.2,31);
      path(scene,[[-7,2.1,-1.2],[-4.5,2.8,-1.7],[-1.3,3.25,-2.2],[1.4,3.5,-1.9],[3.3,4.15,-.9],[5.8,4.4,.2]],.95,true);
      pine(scene,4.7,6.1,2.4,1,-.3);pine(scene,-5.8,5,2.7,.9,.35);
      scene.labels.push({point:[-1,3.8,-2.2],text:'木板路面',dx:48,dy:-30},{point:[-3.8,1.8,-1.7],text:'斜撑承托',dx:-95,dy:36},{point:[4.3,6.1,2.3],text:'绝壁相连',dx:40,dy:-30});
    } else {
      mountain(scene,-5.7,2.1,8.8,4.1,86);mountain(scene,5.8,2.2,9.4,4.3,42);mountain(scene,-8,5,6,3.8,33);mountain(scene,8,5,7.1,3.8,16);mountain(scene,0,7.2,6.6,3.4,68,['#1d3c40','#244648','#294e4d','#1f4245']);
      gate(scene);pine(scene,-4.2,4.9,1,.8,-.2);pine(scene,5.1,5.8,.5,.9,.25);
      scene.labels.push({point:[0,3.9,-1.8],text:'一夫当关',dx:42,dy:-25},{point:[-5.4,7.6,2.1],text:'两壁夹峙',dx:-70,dy:-24});
    }
    for(var i=0;i<11;i++){var x=(rand()-.5)*19,z=(rand()-.5)*9;if(Math.abs(x)>5)pine(scene,x,0,z,.35+rand()*.45,0);}
    return scene;
  }

  function mount(container) {
    destroy();
    if(!container||container.nodeType!==1)throw new TypeError('PoetrySpace.mount requires an element.');
    var root=document.createElement('section');root.className='ps-space';root.setAttribute('aria-label','蜀道难诗意空间');
    root.innerHTML=`<style>${CSS}</style><div class="ps-layout"><aside class="ps-info"><p class="ps-eyebrow">蜀道难 · 意象探游</p><h2 class="ps-heading">诗意空间</h2><p class="ps-subtitle">移步换景，读见诗中山河</p><div class="ps-tabs" role="group" aria-label="选择诗歌意象"><button class="ps-tab" data-mode="mountain" aria-pressed="true">高山</button><button class="ps-tab" data-mode="walkway" aria-pressed="false">栈道</button><button class="ps-tab" data-mode="pass" aria-pressed="false">剑阁</button></div><div class="ps-reading" aria-live="polite"><p class="ps-verse"></p><p class="ps-observation"></p></div><div class="ps-controls"><div class="ps-control"><label class="ps-control-label"><span>观察距离</span><output class="ps-zoom-value">100%</output></label><input class="ps-zoom" type="range" min="65" max="145" value="100" step="1" aria-label="缩放意象空间"></div><div class="ps-control"><label class="ps-control-label"><span>山间雾气</span><output class="ps-fog-value">35%</output></label><input class="ps-fog" type="range" min="0" max="100" value="35" step="1" aria-label="调节山间雾气"></div><div class="ps-actions"><button class="ps-button ps-left" aria-label="向左旋转意象空间">↶ 向左转</button><button class="ps-button ps-right" aria-label="向右旋转意象空间">向右转 ↷</button></div><button class="ps-button ps-reset" aria-label="重置意象空间视角">⌾ 重置视角</button><p class="ps-note">诗意空间 · 结构示意<br>依据诗句营造意境，非实景地形。</p></div></aside><div class="ps-stage"><canvas class="ps-canvas" tabindex="0" aria-label="可拖动旋转的三维蜀山模型；方向键旋转， 加减键缩放"></canvas><div class="ps-scene-heading"><p>SHU ROAD · POETIC LANDSCAPE</p><h3></h3></div><div class="ps-mode-tag">可交互三维</div><div class="ps-compass" aria-hidden="true"><span class="ps-compass-arrow"></span></div><div class="ps-status" aria-live="polite"></div><div class="ps-stage-footer"><span class="ps-gesture"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M7 13V5a2 2 0 014 0v7-9a2 2 0 014 0v9-6a2 2 0 014 0v8c0 5-2 7-6 7h-1c-2 0-3-1-4-3l-4-6a2 2 0 013-2l2 2"/></svg>拖动环视 · 滚轮缩放</span><span class="ps-cue"></span></div></div></div>`;
    container.appendChild(root);
    var canvas=root.querySelector('.ps-canvas'),ctx=canvas.getContext('2d'),stage=root.querySelector('.ps-stage');
    var state={root:root,container:container,canvas:canvas,ctx:ctx,scene:createScene('mountain'),mode:'mountain',yaw:MODES.mountain.yaw,pitch:MODES.mountain.pitch,zoom:1,fog:.35,width:1,height:1,dpr:1,paused:false,destroyed:false,raf:0,dirty:true,time:0,lastTime:0,lastDraw:0,drag:null,pointers:new Map(),pinch:null,cleanups:[],statusTimer:null,reduce:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches};
    active=state;
    function on(el,event,handler,options){el.addEventListener(event,handler,options);state.cleanups.push(function(){el.removeEventListener(event,handler,options);});}
    function status(text){var el=root.querySelector('.ps-status');el.textContent=text;el.classList.add('ps-visible');clearTimeout(state.statusTimer);state.statusTimer=setTimeout(function(){el.classList.remove('ps-visible');},1200);}
    function updateControls(){root.querySelector('.ps-zoom').value=String(Math.round(state.zoom*100));root.querySelector('.ps-zoom-value').textContent=Math.round(state.zoom*100)+'%';root.querySelector('.ps-fog').value=String(Math.round(state.fog*100));root.querySelector('.ps-fog-value').textContent=Math.round(state.fog*100)+'%';}
    function selectMode(mode){var data=MODES[mode];state.mode=mode;state.scene=createScene(mode);state.yaw=data.yaw;state.pitch=data.pitch;state.zoom=1;root.querySelectorAll('.ps-tab').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.mode===mode));});root.querySelector('.ps-verse').innerHTML=data.lines.join('<br>');root.querySelector('.ps-observation').textContent=data.observation;root.querySelector('.ps-scene-heading h3').textContent=data.title;root.querySelector('.ps-cue').textContent=data.cue;canvas.setAttribute('aria-label',data.name+'三维结构示意，可拖动旋转；方向键旋转，加减键缩放');updateControls();state.dirty=true;}
    root.querySelectorAll('.ps-tab').forEach(function(button){on(button,'click',function(){selectMode(button.dataset.mode);});});
    on(root.querySelector('.ps-zoom'),'input',function(event){state.zoom=Number(event.target.value)/100;updateControls();state.dirty=true;});
    on(root.querySelector('.ps-fog'),'input',function(event){state.fog=Number(event.target.value)/100;updateControls();state.dirty=true;});
    on(root.querySelector('.ps-left'),'click',function(){state.yaw-=.26;state.dirty=true;});on(root.querySelector('.ps-right'),'click',function(){state.yaw+=.26;state.dirty=true;});
    on(root.querySelector('.ps-reset'),'click',function(){state.yaw=MODES[state.mode].yaw;state.pitch=MODES[state.mode].pitch;state.zoom=1;state.fog=.35;updateControls();state.dirty=true;status('已回到初始视角');});
    on(canvas,'pointerdown',function(event){state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas.setPointerCapture(event.pointerId);canvas.classList.add('ps-dragging');state.drag={x:event.clientX,y:event.clientY};if(state.pointers.size===2){var points=Array.from(state.pointers.values());state.pinch={distance:Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),zoom:state.zoom};}event.preventDefault();});
    on(canvas,'pointermove',function(event){if(!state.pointers.has(event.pointerId))return;state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(state.pointers.size===2&&state.pinch){var points=Array.from(state.pointers.values()),distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);state.zoom=clamp(state.pinch.zoom*distance/Math.max(state.pinch.distance,1),.65,1.45);updateControls();}else if(state.drag){state.yaw+=(event.clientX-state.drag.x)*.007;state.pitch=clamp(state.pitch+(event.clientY-state.drag.y)*.004,-.05,.67);}state.drag={x:event.clientX,y:event.clientY};state.dirty=true;});
    function release(event){state.pointers.delete(event.pointerId);state.pinch=null;state.drag=state.pointers.size?Array.from(state.pointers.values())[0]:null;if(!state.pointers.size)canvas.classList.remove('ps-dragging');}
    on(canvas,'pointerup',release);on(canvas,'pointercancel',release);on(canvas,'lostpointercapture',release);
    on(canvas,'wheel',function(event){event.preventDefault();state.zoom=clamp(state.zoom-event.deltaY*.0008,.65,1.45);updateControls();state.dirty=true;},{passive:false});
    on(canvas,'keydown',function(event){var handled=true;if(event.key==='ArrowLeft')state.yaw-=.15;else if(event.key==='ArrowRight')state.yaw+=.15;else if(event.key==='ArrowUp')state.pitch=clamp(state.pitch-.08,-.05,.67);else if(event.key==='ArrowDown')state.pitch=clamp(state.pitch+.08,-.05,.67);else if(event.key==='+'||event.key==='=')state.zoom=clamp(state.zoom+.08,.65,1.45);else if(event.key==='-')state.zoom=clamp(state.zoom-.08,.65,1.45);else if(event.key==='Home'){state.yaw=MODES[state.mode].yaw;state.pitch=MODES[state.mode].pitch;state.zoom=1;}else handled=false;if(handled){event.preventDefault();updateControls();state.dirty=true;}});
    function resize(){var bounds=stage.getBoundingClientRect();state.width=Math.max(1,bounds.width);state.height=Math.max(1,bounds.height);state.dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(state.width*state.dpr);canvas.height=Math.round(state.height*state.dpr);state.dirty=true;}
    if(typeof ResizeObserver!=='undefined'){state.observer=new ResizeObserver(resize);state.observer.observe(stage);}else on(window,'resize',resize);
    selectMode('mountain');resize();
    function tick(now){if(state.destroyed)return;state.raf=requestAnimationFrame(tick);var dt=state.lastTime?Math.min(now-state.lastTime,50):0;state.lastTime=now;if(!state.paused&&!state.reduce)state.time+=dt/1000;if(state.dirty||(!state.paused&&!state.reduce&&now-state.lastDraw>45)){draw(state);state.dirty=false;state.lastDraw=now;}}
    if(ctx)state.raf=requestAnimationFrame(tick);else{var fallback=document.createElement('p');fallback.textContent='当前浏览器无法显示画布，请使用支持 Canvas 的浏览器。';fallback.style.cssText='position:absolute;top:45%;left:12%;right:12%;line-height:2;color:#d7bd87';stage.appendChild(fallback);}
    return root;
  }

  function draw(state) {
    var ctx=state.ctx,w=state.width,h=state.height;ctx.setTransform(state.dpr,0,0,state.dpr,0,0);ctx.clearRect(0,0,w,h);
    var sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#0a2029');sky.addColorStop(.52,'#12363d');sky.addColorStop(1,'#071c25');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    var glow=ctx.createRadialGradient(w*.53,h*.36,0,w*.53,h*.36,w*.62);glow.addColorStop(0,'rgba(87,130,118,.09)');glow.addColorStop(1,'rgba(8,28,36,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    var rand=random(125);ctx.fillStyle='rgba(218,210,174,.2)';for(var i=0;i<33;i++){var sx=rand()*w,sy=rand()*h*.64;ctx.beginPath();ctx.arc(sx,sy,rand()*.65+.2,0,TAU);ctx.fill();}
    for(var layer=0;layer<3;layer++){var ridge=random(20+layer);ctx.beginPath();ctx.moveTo(-20,h);var step=w/19;for(var i=-1;i<22;i++){var xx=i*step,yy=h*(.46+layer*.09)-ridge()*h*(.12-layer*.02);ctx.lineTo(xx,yy);}ctx.lineTo(w+20,h);ctx.closePath();ctx.fillStyle=['#17373d','#193b40','#1b4043'][layer];ctx.globalAlpha=[.32,.35,.26][layer];ctx.fill();ctx.globalAlpha=1;}
    var cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch),focal=Math.min(w*1.21,h*1.75)*state.zoom;
    function project(p){var x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy,y=p[1]-3.3;var yy=y*cp-z*sp,zz=y*sp+z*cp+25;return {x:w*.5+x*focal/zz,y:h*.53-yy*focal/zz,z:zz};}
    var projected=state.scene.faces.map(function(face){var points=face.points.map(project),depth=points.reduce(function(sum,p){return sum+p.z;},0)/points.length;return {face:face,points:points,depth:depth};}).sort(function(a,b){return b.depth-a.depth;});
    var shadow=ctx.createRadialGradient(w*.5,h*.76,0,w*.5,h*.76,w*.48);shadow.addColorStop(0,'rgba(0,10,16,.42)');shadow.addColorStop(1,'rgba(0,10,16,0)');ctx.save();ctx.translate(0,h*.42);ctx.scale(1,.46);ctx.fillStyle=shadow;ctx.fillRect(0,-h,w,h*2);ctx.restore();
    projected.forEach(function(item){var face=item.face,points=item.points;if(points.some(function(p){return p.z<1;}))return;var a=face.points[0],b=face.points[1],c=face.points[2],u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],nl=Math.hypot(n[0],n[1],n[2])||1;var diffuse=Math.abs((n[0]*-.4+n[1]*.8+n[2]*-.4)/nl),shade=.7+diffuse*.36;var rgb=face.rgb.map(function(value){return clamp(Math.round(value*shade),0,255);});var fog=clamp((item.depth-18)/23,0,.65)*state.fog*.65;rgb=blend(rgb,[45,79,79],fog);ctx.fillStyle=color(rgb);ctx.beginPath();points.forEach(function(p,i){if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.closePath();ctx.fill();ctx.strokeStyle=face.edge||'rgba(16,43,44,.16)';ctx.lineWidth=.5;ctx.stroke();});
    state.scene.lines.forEach(function(line){var a=project(line.a),b=project(line.b);ctx.strokeStyle=color(line.rgb);ctx.lineWidth=line.width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();});
    if(state.fog>0){for(var layer=0;layer<4;layer++){var drift=Math.sin(state.time*.07+layer*1.8)*w*.08,fx=w*(.18+layer*.23)+drift,fy=h*(.7+layer*.047);ctx.save();ctx.translate(fx,fy);ctx.scale(1,.22+layer*.025);var mist=ctx.createRadialGradient(0,0,w*.02,0,0,w*.48);mist.addColorStop(0,'rgba(106,148,142,'+(state.fog*.12)+')');mist.addColorStop(.5,'rgba(66,119,120,'+(state.fog*.13)+')');mist.addColorStop(1,'rgba(30,75,84,0)');ctx.fillStyle=mist;ctx.fillRect(-w*.5,-w*.5,w,w);ctx.restore();}}
    var vignette=ctx.createRadialGradient(w*.5,h*.46,Math.min(w,h)*.21,w*.5,h*.46,Math.max(w,h)*.65);vignette.addColorStop(0,'rgba(7,27,35,0)');vignette.addColorStop(1,'rgba(4,20,29,.75)');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
    if(w>350&&state.zoom<1.22){state.scene.labels.forEach(function(label){var p=project(label.point);if(p.x<35||p.x>w-45||p.y<105||p.y>h-95)return;var tx=clamp(p.x+label.dx,40,w-90),ty=clamp(p.y+label.dy,116,h-85);ctx.strokeStyle='rgba(215,189,135,.42)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(tx,ty);ctx.lineTo(tx+51,ty);ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,2,0,TAU);ctx.fillStyle='#d7bd87';ctx.fill();ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillStyle='rgba(222,209,174,.84)';ctx.fillText(label.text,tx+3,ty-8);});}
    var compass=state.root.querySelector('.ps-compass-arrow');compass.style.transform='rotate('+(-state.yaw*180/Math.PI)+'deg)';
  }

  function destroy() {
    if(!active)return;var state=active;state.destroyed=true;cancelAnimationFrame(state.raf);clearTimeout(state.statusTimer);if(state.observer)state.observer.disconnect();state.cleanups.forEach(function(cleanup){cleanup();});state.pointers.clear();if(state.root.parentNode)state.root.parentNode.removeChild(state.root);active=null;
  }
  function setPaused(value) { if(active){active.paused=Boolean(value);active.lastTime=0;active.dirty=true;} }
  window.PoetrySpace={mount:mount,destroy:destroy,setPaused:setPaused};
})();
