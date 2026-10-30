/* Local cinematic props. Requires window.THREE; no downloads or module imports. */
(function (global) {
  'use strict';
  var T = global.THREE;
  if (!T) throw new Error('CinemaProps requires window.THREE.');
  var TAU = Math.PI * 2;
  var shared;

  function random(seed) {
    var state = seed >>> 0;
    return function () { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
  }
  function canvasTexture(width, height, draw, linear) {
    var c = document.createElement('canvas'); c.width = width; c.height = height;
    draw(c.getContext('2d'), width, height);
    var tex = new T.CanvasTexture(c);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.colorSpace = linear ? T.NoColorSpace : T.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }
  function woodTexture(bark) {
    return canvasTexture(512, 1024, function (c, w, h) {
      var r = random(bark ? 1032 : 2461);
      c.fillStyle = bark ? '#3c3a31' : '#63503a'; c.fillRect(0, 0, w, h);
      for (var i = 0; i < 1900; i++) {
        var x = r() * w, start = r() * h, len = 25 + r() * 550;
        c.strokeStyle = r() > .48 ? 'rgba(13,18,16,' + (.05 + r() * .35) + ')' : 'rgba(174,142,97,' + (.03 + r() * .2) + ')';
        c.lineWidth = bark ? .4 + r() * 4 : .3 + r() * 1.4;
        c.beginPath(); c.moveTo(x, start);
        c.bezierCurveTo(x + Math.sin(i) * 8, start + len * .3, x + Math.cos(i) * 6, start + len * .7, x + r() * 4, start + len); c.stroke();
      }
      for (var k = 0; k < (bark ? 38 : 13); k++) {
        var xx = r() * w, yy = r() * h;
        for (var q = 1; q < 9; q++) {
          c.beginPath(); c.strokeStyle = 'rgba(21,23,17,' + (.23 - q * .016) + ')'; c.lineWidth = .7;
          c.ellipse(xx, yy, 1 + q * 1.6, 7 + q * (bark ? 8 : 14), -.09, 0, TAU); c.stroke();
        }
        c.fillStyle = 'rgba(16,20,16,.48)'; c.beginPath(); c.ellipse(xx, yy, 2, 11, -.1, 0, TAU); c.fill();
      }
      for (var s = 0; s < 26; s++) {
        var sx = r() * w, sy = r() * h;
        c.lineWidth = .5 + r() * 1.8; c.strokeStyle = 'rgba(8,16,14,.45)'; c.beginPath(); c.moveTo(sx, sy);
        for (var n = 0; n < 8; n++) c.lineTo(sx + Math.sin(n * 2 + s) * 2, sy + n * (7 + r() * 8));
        c.stroke();
      }
    });
  }
  function stoneTexture() {
    return canvasTexture(512, 512, function (c, w, h) {
      var r = random(812), img = c.createImageData(w, h);
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var p = (y * w + x) * 4, grain = r() * 31 - 15;
        var layer = Math.sin(x * .013 + Math.sin(y * .018) * 2) * 9 + Math.sin(y * .034 + x * .011) * 7;
        img.data[p] = 92 + grain + layer; img.data[p + 1] = 105 + grain + layer; img.data[p + 2] = 101 + grain + layer; img.data[p + 3] = 255;
      }
      c.putImageData(img, 0, 0);
      for (var i = 0; i < 36; i++) {
        var sx = r() * w, sy = r() * h;
        c.strokeStyle = 'rgba(19,37,36,' + (.06 + r() * .16) + ')'; c.lineWidth = .4 + r() * 1.5; c.beginPath(); c.moveTo(sx, sy);
        for (var j = 0; j < 7; j++) { sx += r() * 21 - 6; sy += 9 + r() * 24; c.lineTo(sx, sy); } c.stroke();
      }
      for (var d = 0; d < 2000; d++) { c.fillStyle = d % 3 ? 'rgba(181,189,169,.1)' : 'rgba(10,31,28,.15)'; c.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); }
    });
  }
  function textures() {
    if (shared) return shared;
    var wood = woodTexture(false), bark = woodTexture(true), stone = stoneTexture();
    var mist = canvasTexture(64, 64, function (c) {
      var g = c.createRadialGradient(32, 32, 0, 32, 32, 31); g.addColorStop(0, 'rgba(231,252,249,.9)'); g.addColorStop(.24, 'rgba(208,237,231,.55)'); g.addColorStop(1, 'rgba(180,224,219,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    });
    var noise = canvasTexture(256, 256, function (c, w, h) {
      var r = random(567), img = c.createImageData(w, h);
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var p = (y * w + x) * 4, v = 100 + r() * 80 + 35 * Math.sin(x * .14) * Math.sin(y * .07);
        img.data[p] = v; img.data[p + 1] = v; img.data[p + 2] = v; img.data[p + 3] = 255;
      } c.putImageData(img, 0, 0);
    }, true);
    shared = {
      wood: new T.MeshStandardMaterial({ color: 0x8b795d, map: wood, bumpMap: wood, bumpScale: .055, roughness: .88 }),
      darkWood: new T.MeshStandardMaterial({ color: 0x594b3d, map: wood, bumpMap: wood, bumpScale: .06, roughness: .9 }),
      bark: new T.MeshStandardMaterial({ color: 0x646b5c, map: bark, bumpMap: bark, bumpScale: .11, roughness: .97 }),
      stone: new T.MeshStandardMaterial({ color: 0x798984, map: stone, bumpMap: stone, bumpScale: .1, roughness: .96 }),
      darkStone: new T.MeshStandardMaterial({ color: 0x415852, map: stone, bumpMap: stone, bumpScale: .1, roughness: .95 }),
      bronze: new T.MeshStandardMaterial({ color: 0x897348, metalness: .72, roughness: .51 }),
      iron: new T.MeshStandardMaterial({ color: 0x303b37, metalness: .62, roughness: .69 }),
      rope: new T.MeshStandardMaterial({ color: 0x706c50, map: wood, bumpMap: wood, bumpScale: .03, roughness: 1 }),
      feathers: new T.MeshStandardMaterial({ color: 0x091311, roughness: .86, metalness: .08, side: T.DoubleSide }),
      mist: mist, noise: noise
    };
    return shared;
  }
  function mesh(geometry, material, parent, x, y, z) {
    var m = new T.Mesh(geometry, material); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m); return m;
  }
  function box(parent, w, h, d, x, y, z, material) { return mesh(new T.BoxGeometry(w, h, d), material, parent, x, y, z); }
  function bevelBox(parent, w, h, d, x, y, z, material, bevel) {
    var s = new T.Shape(), b = Math.min(bevel || .035, w * .12, h * .12, d * .2);
    s.moveTo(-w / 2 + b, -h / 2 + b); s.lineTo(w / 2 - b, -h / 2 + b); s.lineTo(w / 2 - b, h / 2 - b); s.lineTo(-w / 2 + b, h / 2 - b); s.closePath();
    var g = new T.ExtrudeGeometry(s, { depth: d - b * 2, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: b, bevelThickness: b });
    g.translate(0, 0, -d / 2 + b); return mesh(g, material, parent, x, y, z);
  }
  function beam(parent, a, b, radius, material, endRadius) {
    var av = new T.Vector3().fromArray(a), bv = new T.Vector3().fromArray(b), delta = bv.clone().sub(av);
    var m = mesh(new T.CylinderGeometry(endRadius === undefined ? radius : endRadius, radius, delta.length(), 8), material, parent);
    m.position.copy(av.add(bv).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); return m;
  }
  function rock(parent, x, y, z, sx, sy, sz, seed, dark) {
    var r = random(seed), g = new T.IcosahedronGeometry(1, 2), pos = g.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      var a = 1 + .11 * Math.sin(px * 11 + py * 7 + seed) + .07 * Math.sin(pz * 19 - py * 5 + seed);
      pos.setXYZ(i, px * a, py * a, pz * a);
    }
    g.computeVertexNormals(); var m = mesh(g, dark ? textures().darkStone : textures().stone, parent, x, y, z);
    m.scale.set(sx, sy, sz); m.rotation.set(r() * .5, r() * TAU, r() * .3); return m;
  }
  function snapshot(objects) {
    var states = objects.map(function (o) { return { o: o, p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone(), visible: o.visible }; });
    return function () { states.forEach(function (v) { v.o.position.copy(v.p); v.o.quaternion.copy(v.q); v.o.scale.copy(v.s); v.o.visible = v.visible; }); };
  }
  function gate() {
    var m = textures(), group = new T.Group(); group.name = 'Stone pass and ancient double doors';
    var left = new T.Group(), right = new T.Group(); left.name = 'Left door hinge'; right.name = 'Right door hinge';
    left.position.set(-3, 0, 0); right.position.set(3, 0, 0); group.add(left, right);
    [-1, 1].forEach(function (side) {
      var x = side * 3.58;
      bevelBox(group, 1.32, .42, 1.25, x, .12, -.22, m.darkStone, .07);
      for (var row = 0; row < 7; row++) bevelBox(group, 1.1 + (row % 2) * .02, .98, .92, x, .91 + row * .99, -.23, row % 3 ? m.stone : m.darkStone, .035);
      bevelBox(group, 1.45, .34, 1.26, x, 7.23, -.23, m.stone, .05);
      bevelBox(group, .14, 6.1, .15, x - side * .42, 3.75, .3, m.darkStone, .02);
      bevelBox(group, 2.1, 5.7, .7, side * 5.05, 2.85, -.43, m.darkStone, .04);
      for (var sy = 1; sy < 6; sy++) box(group, 1.94, .025, .02, side * 5.05, sy * .91, -.065, m.stone);
    });
    bevelBox(group, 8.36, .75, 1.05, 0, 7.69, -.23, m.stone, .05);
    bevelBox(group, 8.72, .22, 1.33, 0, 8.18, -.23, m.darkStone, .035);
    bevelBox(group, 6.15, .2, .52, 0, 7.12, -.05, m.darkWood, .025);
    bevelBox(group, 6.3, .22, 1.2, 0, -.12, .08, m.stone, .035);
    // Actual separate planks and recessed joints remain visible when the door opens.
    [left, right].forEach(function (leaf, leafIndex) {
      var sign = leafIndex ? -1 : 1, center = sign * 1.5;
      for (var i = 0; i < 6; i++) {
        var plank = bevelBox(leaf, .487, 6.96, .28, sign * (.25 + i * .5), 3.5, -.035, i % 3 ? m.darkWood : m.wood, .013);
        // Extrusion's front-face UVs run along the real grain, without repeating logos or decals.
        plank.userData.woodBoard = true;
      }
      [.65, 3.35, 6.34].forEach(function (yy) {
        bevelBox(leaf, 2.91, .27, .18, center, yy, .17, m.darkWood, .025);
        bevelBox(leaf, 2.88, .24, .15, center, yy, -.24, m.darkWood, .022);
        for (var k = 0; k < 6; k++) {
          var nail = mesh(new T.SphereGeometry(.052, 10, 7), m.bronze, leaf, sign * (.26 + k * .49), yy, .284); nail.scale.z = .42;
        }
      });
      bevelBox(leaf, .12, 6.94, .12, sign * 2.91, 3.5, .14, m.darkWood, .016);
      bevelBox(leaf, .13, 6.94, .13, sign * .08, 3.5, .14, m.darkWood, .017);
      var hx = sign * 2.46;
      var plate = mesh(new T.CylinderGeometry(.22, .22, .065, 18), m.bronze, leaf, hx, 3.05, .235); plate.rotation.x = Math.PI / 2;
      var boss = mesh(new T.SphereGeometry(.115, 14, 10), m.bronze, leaf, hx, 3.05, .3); boss.scale.set(1, 1, .6);
      var ring = mesh(new T.TorusGeometry(.23, .034, 8, 28), m.bronze, leaf, hx, 2.84, .39); ring.rotation.x = .12;
      for (var r = 0; r < 4; r++) {
        var a = r / 4 * TAU;
        mesh(new T.SphereGeometry(.026, 8, 6), m.bronze, leaf, hx + Math.cos(a) * .16, 3.05 + Math.sin(a) * .16, .275);
      }
      [1.1, 5.7].forEach(function (yy) {
        var hinge = mesh(new T.CylinderGeometry(.09, .09, .48, 10), m.iron, leaf, 0, yy, -.08);
        bevelBox(leaf, 1.03, .13, .045, sign * .47, yy, -.208, m.iron, .012);
        hinge.castShadow = true;
      });
    });
    var reset = snapshot([left, right]); return { group: group, left: left, right: right, reset: reset };
  }
  function walkway() {
    var m = textures(), group = new T.Group(), planks = [], r = random(361);
    group.name = 'Weathered cliff walkway';
    function pathX(z){var d=Math.max(0,4-z);return 1.4+.012*d*d;}
    function pathAngle(z){return -Math.atan(.024*Math.max(0,4-z));}
    var boardMaterials = [0x96866a, 0x85775f, 0x9d8b70, 0x8d7e67, 0xa18e71, 0x84755d].map(function (color) {
      var material = m.wood.clone(); material.color.setHex(color); material.roughness = .93; material.bumpScale = .035; return material;
    });
    for (var i = 0; i < 51; i++) {
      var board = new T.Group(); board.name = 'Loose walkway plank ' + i; board.position.set(pathX(4-i*.78), 0, 4-i*.78);board.rotation.y=pathAngle(4-i*.78);
      // Chipped corners and narrow open joints produce a real wooden silhouette.
      var w = 3.4, d = .72, s = new T.Shape(), chip = .035 + r() * .08;
      s.moveTo(-w / 2 + chip, -d / 2); s.lineTo(w / 2 - .055, -d / 2 + r() * .025); s.lineTo(w / 2, -d / 2 + .1);
      s.lineTo(w / 2 - r() * .045, d / 2 - .035); s.lineTo(w / 2 - .14, d / 2); s.lineTo(-w / 2 + .06, d / 2 - r() * .025); s.lineTo(-w / 2, d / 2 - .09); s.lineTo(-w / 2, -d / 2 + chip); s.closePath();
      var thickness = .18 + r() * .04;
      var g = new T.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: true, bevelSegments: 1, bevelSize: .013, bevelThickness: .013, steps: 1 });
      // Rotate XY shape into the XZ deck. Texture grain runs across each long timber.
      g.rotateX(-Math.PI / 2); g.translate(0, -thickness - .013, 0);
      var uv = g.attributes.uv;
      for (var k = 0; k < uv.count; k++) { var u = uv.getX(k), v = uv.getY(k); uv.setXY(k, v * 1.15 + i * .137, u * .35 + i * .211); }
      var surface = mesh(g, boardMaterials[i % boardMaterials.length], board);
      [-1.32, 1.32].forEach(function (x) {
        [-.2, .2].forEach(function (z) { var nail = mesh(new T.CylinderGeometry(.026, .026, .013, 7), m.iron, board, x, .002, z); nail.castShadow = false; });
      });
      // Fine end splits are physical recesses on the upper face.
      if (i % 3 === 0) {
        var split = box(board, .3 + r() * .28, .006, .012, -1.47, .005, (r() - .5) * .3, m.darkWood); split.rotation.y = (r() - .5) * .11;
      }
      group.add(board); planks.push(board);
    }
    [-1.5,1.5].forEach(function(offset){var pts=[];for(var j=0;j<52;j++){var z=4-j*.78;pts.push(new T.Vector3(pathX(z)+offset,-.4,z));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),100,.12,5,false),m.darkWood,group);});
    for (var support = 0; support < 13; support++) {
      var sz = 3.7 - support * 3.12;
      var supportBeam=bevelBox(group, 5.7, .23, .25, pathX(sz)+.9, -.56, sz, m.darkWood, .025);supportBeam.rotation.y=pathAngle(sz);
      beam(group, [pathX(sz)+3.1,-2,sz], [pathX(sz)-1.45,-.7,sz], .085, m.darkWood,.075);
      // A safety rope follows the open edge; supports enter the cliff on the right.
      var pz=3.8-support*3.12,px=pathX(pz)-1.66;
      var post = bevelBox(group, .15, 1.45, .16, px, .52, pz, m.darkWood, .025); post.rotation.z = (r() - .5) * .03;
      [.79, 1.08].forEach(function (height) {
        if (support === 12) return;
        var curve = new T.CatmullRomCurve3([new T.Vector3(px, height, pz), new T.Vector3(pathX(pz-1.56)-1.66,height-.13,pz-1.56),new T.Vector3(pathX(pz-3.12)-1.66,height,pz-3.12)]);
        mesh(new T.TubeGeometry(curve, 12, .026, 5, false), m.rope, group);
      });
      // Rope lashings read clearly close to the camera.
      for (var loop = 0; loop < 3; loop++) { var l = mesh(new T.TorusGeometry(.108, .016, 5, 12), m.rope, group, px, .96 + loop * .045, pz); l.rotation.x = Math.PI / 2; }
    }
    return { group: group, planks: planks, brokenIndex: 9, reset: snapshot(planks) };
  }
  function trunk(parent, points, radii, material, detail) {
    var curve = new T.CatmullRomCurve3(points.map(function (p) { return new T.Vector3().fromArray(p); }));
    var rings = detail || 18, sides = 10, frames = curve.computeFrenetFrames(rings, false), vertices = [], uvs = [], indices = [];
    for (var j = 0; j <= rings; j++) {
      var t = j / rings, v = curve.getPointAt(t), f = t * (radii.length - 1), low = Math.min(radii.length - 2, Math.floor(f)), radius = T.MathUtils.lerp(radii[low], radii[low + 1], f - low);
      for (var i = 0; i <= sides; i++) {
        var a = i / sides * TAU, rr = radius * (1 + .085 * Math.sin(a * 5 + j * .6));
        var offset = frames.normals[j].clone().multiplyScalar(Math.cos(a) * rr).addScaledVector(frames.binormals[j], Math.sin(a) * rr);
        vertices.push(v.x + offset.x, v.y + offset.y, v.z + offset.z); uvs.push(i / sides * 1.8, t * 3.6);
        if (j < rings && i < sides) { var p = j * (sides + 1) + i; indices.push(p, p + 1, p + sides + 1, p + 1, p + sides + 2, p + sides + 1); }
      }
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); return mesh(g, material, parent);
  }
  function needles(parent, position, size, seed) {
    var r = random(seed), vertices = [];
    for (var i = 0; i < 85; i++) {
      var angle = r() * TAU, radius = Math.sqrt(r()) * size, x = position[0] + Math.cos(angle) * radius, y = position[1] + (r() - .5) * size * .28, z = position[2] + Math.sin(angle) * radius * .55;
      var len = .12 + r() * .23;
      for (var j = 0; j < 4; j++) vertices.push(x, y, z, x + Math.sin(angle + j * .45) * len, y + .04 + r() * .09, z + Math.cos(angle + j * .45) * len);
    }
    var geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    var foliage = new T.LineSegments(geometry, new T.LineBasicMaterial({ color: seed % 2 ? 0x263f32 : 0x1c322b, transparent: true, opacity: .86 })); parent.add(foliage);
  }
  function bird(parent, x, y, z, index) {
    var m = textures(), group = new T.Group(); group.name = 'Raven ' + (index + 1); group.position.set(x, y, z); group.rotation.y = -.25 + index * .19;
    var body = mesh(new T.SphereGeometry(.2, 12, 9), m.feathers, group, 0, .1, 0); body.scale.set(.78, .98, 1.65);
    var head = mesh(new T.SphereGeometry(.13, 12, 8), m.feathers, group, 0, .25, -.27); head.scale.set(.88, .95, 1.13);
    var beak = mesh(new T.ConeGeometry(.052, .19, 7), m.iron, group, 0, .235, -.43); beak.rotation.x = -Math.PI / 2;
    var tail = mesh(new T.ConeGeometry(.14, .37, 4), m.feathers, group, 0, .035, .4); tail.rotation.x = -Math.PI / 2; tail.scale.z = .23;
    var leftWing = new T.Group(), rightWing = new T.Group(); leftWing.position.set(-.12, .13, -.01); rightWing.position.set(.12, .13, -.01); group.add(leftWing, rightWing);
    [leftWing, rightWing].forEach(function (wing, index) {
      var sign = index ? 1 : -1;
      var p = [0, 0, -.12, sign * .32, .025, -.23, sign * .72, -.02, -.07, sign * .89, -.06, .23, sign * .57, -.075, .34, sign * .21, -.015, .24];
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.setIndex([0, 1, 5, 1, 4, 5, 1, 2, 4, 2, 3, 4]); g.computeVertexNormals(); mesh(g, m.feathers, wing);
      for (var f = 0; f < 6; f++) {
        var feather = mesh(new T.SphereGeometry(1, 7, 5), m.feathers, wing, sign * (.31 + f * .084), -.04, .22 + f * .015);
        feather.scale.set(.057, .018, .18 + f * .018); feather.rotation.y = sign * (-.25 - f * .13);
      }
    });
    [-.065, .065].forEach(function (lx) { beam(group, [lx, 0, .035], [lx, -.12, .055], .013, m.iron); beam(group, [lx, -.12, .055], [lx, -.13, -.025], .009, m.iron); });
    parent.add(group); return { group: group, leftWing: leftWing, rightWing: rightWing, origin: group.position.clone() };
  }
  function forest() {
    var m = textures(), group = new T.Group(), birds = []; group.name = 'Right-hand pine boughs and ravens';
    // Every woody root starts well outside the right edge: no visible trunks or feet.
    trunk(group, [[14, 2.8, -6.6], [11.7, 3.04, -6.7], [9.2, 3.46, -6.42], [7.1, 3.91, -6.2], [5.3, 4.2, -6.03], [3.65, 4.48, -6.2]], [.22, .185, .14, .1, .055, .008], m.bark, 64);
    trunk(group, [[13.5, 6.5, -9.5], [11.2, 6.34, -9.3], [9.4, 6.62, -9.1], [7.8, 7.2, -9], [6.7, 7.38, -9.3]], [.14, .11, .08, .036, .006], m.bark, 48);
    trunk(group, [[13.6, .5, -8.8], [11.8, .94, -8.4], [10.2, 1.12, -8.2], [9.1, 1.79, -8.15], [8.1, 2.06, -8.35]], [.13, .105, .061, .029, .005], m.bark, 44);
    var twigs = [
      [[[7.25, 3.9, -6.21], [6.78, 4.46, -6.38], [6.6, 4.97, -6.45], [6.04, 5.19, -6.51]], [.068, .042, .022, .004]],
      [[[6.62, 4.93, -6.44], [6.96, 5.25, -6.59], [7.04, 5.63, -6.64]], [.022, .014, .003]],
      [[[5.46, 4.17, -6.06], [5.01, 3.82, -5.91], [4.42, 3.83, -5.98]], [.042, .023, .004]],
      [[[4.56, 4.31, -6.12], [4.2, 4.76, -6.18], [3.79, 4.89, -6.28]], [.028, .015, .003]],
      [[[10.1, 3.3, -6.55], [9.74, 4.13, -6.69], [9.21, 4.67, -6.82], [8.6, 4.83, -6.7]], [.075, .048, .024, .004]],
      [[[9.46, 6.61, -9.1], [9.03, 7.24, -9.3], [8.39, 7.5, -9.38]], [.054, .029, .004]],
      [[[8.2, 7.05, -9.03], [7.74, 6.78, -8.87], [7.12, 6.84, -8.93]], [.035, .018, .003]],
      [[[10.4, 1.1, -8.22], [10.06, 1.91, -8.48], [9.49, 2.19, -8.44]], [.041, .023, .003]]
    ];
    twigs.forEach(function (branch) { trunk(group, branch[0], branch[1], m.bark, 24); });
    // Small irregular needle sprays follow the ends; the large canopy stays in the plate.
    [[8.65, 4.86, -6.7], [8.35, 7.52, -9.36], [7.15, 6.86, -8.93], [6.72, 7.4, -9.3], [9.49, 2.2, -8.44], [8.12, 2.08, -8.35]].forEach(function (p, i) {
      needles(group, p, .24 + i % 3 * .055, 460 + i);
    });
    var perches = [[4.18, 4.51, -6.1], [4.91, 4.38, -6.05], [5.65, 4.27, -6.07], [6.43, 4.15, -6.13], [7.23, 4.02, -6.21], [8.05, 3.85, -6.3]];
    perches.forEach(function (p, i) { var b = bird(group, p[0], p[1], p[2], i); b.group.scale.setScalar(.69); birds.push(b); });
    var tracked = []; birds.forEach(function (b) { tracked.push(b.group, b.leftWing, b.rightWing); });
    return { group: group, birds: birds, reset: snapshot(tracked) };
  }
  function waterfall() {
    var m = textures(), group = new T.Group(), r = random(619); group.name = 'Transparent waterfall motion over photographic plate';
    var uniforms = { uTime: { value: 0 }, uIntensity: { value: 1 }, uNoise: { value: m.noise }, uTint: { value: new T.Color(0xb4c4be) } };
    uniforms.time = uniforms.uTime; uniforms.intensity = uniforms.uIntensity;
    // Sparse GPU-driven glints, with individually feathered edges. No water planes or rock meshes.
    var flowCount = 580, flowPositions = new Float32Array(flowCount * 3), phases = new Float32Array(flowCount), sizes = new Float32Array(flowCount), speeds = new Float32Array(flowCount), alphas = new Float32Array(flowCount);
    for (var i = 0; i < flowCount; i++) {
      flowPositions[i * 3] = 6.4 + (r() + r() + r() - 1.5) * 1.52;
      flowPositions[i * 3 + 1] = 0; flowPositions[i * 3 + 2] = -8.5 + (r() - .5) * .75;
      phases[i] = r(); sizes[i] = .43 + r() * 1.1; speeds[i] = .6 + r() * .8; alphas[i] = .3 + r() * .7;
    }
    var flowGeometry = new T.BufferGeometry();
    flowGeometry.setAttribute('position', new T.BufferAttribute(flowPositions, 3));
    flowGeometry.setAttribute('aPhase', new T.BufferAttribute(phases, 1));
    flowGeometry.setAttribute('aSize', new T.BufferAttribute(sizes, 1));
    flowGeometry.setAttribute('aSpeed', new T.BufferAttribute(speeds, 1));
    flowGeometry.setAttribute('aAlpha', new T.BufferAttribute(alphas, 1));
    var flowMaterial = new T.ShaderMaterial({
      uniforms: uniforms, transparent: true, depthWrite: false, depthTest: true, toneMapped: false,
      vertexShader: [
        'uniform float uTime; uniform float uIntensity;',
        'attribute float aPhase; attribute float aSize; attribute float aSpeed; attribute float aAlpha; varying float vAlpha;',
        'void main(){float flow=fract(aPhase+uTime*(.11+aSpeed*.055)*(.7+uIntensity*.3)); vec3 p=position;',
        'p.y=11.5-flow*21.0; p.x+=sin(flow*17.0+aPhase*41.0+uTime)*.045;',
        'vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;',
        'gl_PointSize=clamp(aSize*360.0/max(1.0,-mv.z),2.0,48.0);',
        'vAlpha=smoothstep(0.0,.08,flow)*smoothstep(0.0,.08,1.0-flow)*aAlpha;}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uIntensity; uniform vec3 uTint; varying float vAlpha;',
        'void main(){vec2 q=gl_PointCoord-vec2(.5);',
        'float narrow=exp(-q.x*q.x*1300.0); float lengthFade=pow(max(0.0,1.0-abs(q.y)*2.0),1.7);',
        'float a=narrow*lengthFade*vAlpha*.19*clamp(uIntensity,0.0,1.65); if(a<.004) discard;',
        'gl_FragColor=vec4(uTint,a);',
        '#include <colorspace_fragment>',
        '}'
      ].join('\n')
    });
    var flow = new T.Points(flowGeometry, flowMaterial); flow.frustumCulled = false; flow.renderOrder = 3; group.add(flow);
    var splashCount = 96, splashPositions = new Float32Array(splashCount * 3), splashSeeds = [];
    for (var s = 0; s < splashCount; s++) splashSeeds.push({ phase: r(), x: (r() - .5) * 1.7, angle: r() * TAU, speed: .45 + r() * 1.25, life: .75 + r() * .7, height: 2 + r() * 1.6 });
    var splashGeometry = new T.BufferGeometry(); splashGeometry.setAttribute('position', new T.BufferAttribute(splashPositions, 3));
    var splashMaterial = new T.PointsMaterial({ map: m.mist, color: 0xbdccc5, size: .055, transparent: true, opacity: .3, depthWrite: false });
    var splash = new T.Points(splashGeometry, splashMaterial); splash.frustumCulled = false; splash.renderOrder = 4; group.add(splash);
    var mistCount = 38, mistPositions = new Float32Array(mistCount * 3), mistSeeds = [];
    for (var j = 0; j < mistCount; j++) mistSeeds.push({ x: r() + r() - 1, y: r(), z: r(), phase: r() * TAU });
    var mistGeometry = new T.BufferGeometry(); mistGeometry.setAttribute('position', new T.BufferAttribute(mistPositions, 3));
    var mistMaterial = new T.PointsMaterial({ map: m.mist, color: 0xa8bcb4, size: 1.45, transparent: true, opacity: .075, depthWrite: false });
    var mist = new T.Points(mistGeometry, mistMaterial); mist.frustumCulled = false; mist.renderOrder = 5; group.add(mist);
    // Three very faint open arcs at the submerged foot, below the main composition.
    var ripples = [];
    for (var ringIndex = 0; ringIndex < 3; ringIndex++) {
      var ringPositions = [];
      for (var segment = 0; segment <= 42; segment++) { var a = segment / 42 * Math.PI * 1.55 + ringIndex * .7; ringPositions.push(Math.cos(a), 0, Math.sin(a) * .62); }
      var ringGeometry = new T.BufferGeometry(); ringGeometry.setAttribute('position', new T.Float32BufferAttribute(ringPositions, 3));
      var ringMaterial = new T.LineBasicMaterial({ color: 0x91afa5, transparent: true, opacity: .045, depthWrite: false });
      var ring = new T.Line(ringGeometry, ringMaterial); ring.position.set(6.45, -4.6, -7.95); ring.renderOrder = 2; group.add(ring); ripples.push(ring);
    }
    function update(time, intensity) {
      var strength = intensity === undefined ? uniforms.uIntensity.value : Math.max(0, intensity);
      uniforms.uTime.value = time; uniforms.uIntensity.value = strength;
      for (var p = 0; p < splashCount; p++) {
        var seed = splashSeeds[p], age = ((time * .85 + seed.phase * seed.life) % seed.life + seed.life) % seed.life;
        splashPositions[p * 3] = 6.4 + seed.x + Math.cos(seed.angle) * seed.speed * age;
        splashPositions[p * 3 + 1] = -4.55 + (seed.height * age - 3.1 * age * age) * Math.min(1.4, strength);
        splashPositions[p * 3 + 2] = -7.8 + Math.sin(seed.angle) * seed.speed * age;
      }
      splashGeometry.attributes.position.needsUpdate = true; splashMaterial.opacity = Math.min(.42, .28 * strength);
      for (var q = 0; q < mistCount; q++) {
        var seedMist = mistSeeds[q]; mistPositions[q * 3] = 6.4 + seedMist.x * 2.25 + Math.sin(time * .16 + seedMist.phase) * .3;
        mistPositions[q * 3 + 1] = -4.6 + seedMist.y * 4.1 + Math.sin(time * .22 + seedMist.phase) * .18;
        mistPositions[q * 3 + 2] = -7.75 + (seedMist.z - .5) * 1.4;
      }
      mistGeometry.attributes.position.needsUpdate = true; mistMaterial.opacity = Math.min(.11, .075 * strength);
      ripples.forEach(function (ring, index) { var phase = (time * .17 + index / 3) % 1; ring.scale.setScalar(.3 + phase * 1.45); ring.material.opacity = (1 - phase) * .045 * Math.min(strength, 1.4); });
    }
    update(0, 1);
    return { group: group, uniforms: uniforms, update: update, reset: function () { update(0, 1); } };
  }
  global.CinemaProps = { gate: gate, walkway: walkway, forest: forest, waterfall: waterfall };
})(window);