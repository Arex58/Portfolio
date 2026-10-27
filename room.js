/* Original Smokey's Studio pixel artwork. Integer coordinates, one shared palette,
   no image downloads. The room renders at 20 fps; inactive tabs do no work. */
(() => {
  'use strict';
  const city = document.getElementById('cityCanvas');
  const ctx = city.getContext('2d');
  const cat = document.getElementById('smokey');
  const catCanvas = document.getElementById('smokeyCanvas');
  const c = catCanvas.getContext('2d');
  const area = document.getElementById('smokeyArea');
  const bubble = document.getElementById('smokeyBubble');
  const motionButton = document.getElementById('motionToggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  if (!ctx || !c) return;
  ctx.imageSmoothingEnabled = c.imageSmoothingEnabled = false;
  const stillCity = document.createElement('canvas');
  stillCity.width = city.width; stillCity.height = city.height;
  const s = stillCity.getContext('2d');
  let seed = 58;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function rect(g, color, x, y, w, h) { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); }
  function poly(g, color, points) {
    g.fillStyle = color; g.beginPath();
    points.forEach(([x, y], i) => i ? g.lineTo(Math.round(x), Math.round(y)) : g.moveTo(Math.round(x), Math.round(y)));
    g.closePath(); g.fill();
  }
  // Broad, flat bands keep the night atmospheric without smooth gradients.
  rect(s, '#232c4a', 0, 0, 640, 280);
  rect(s, '#2e3758', 0, 35, 640, 70);
  rect(s, '#3c4164', 0, 105, 640, 90);
  rect(s, '#484569', 0, 170, 640, 40);
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(random() * 640), y = Math.floor(random() * 65), w = 28 + Math.floor(random() * 74);
    poly(s, ['#49516b', '#505770', '#3c4763'][i % 3], [[x,y+4],[x+8,y+4],[x+8,y],[x+w-12,y],[x+w-12,y+4],[x+w,y+4],[x+w,y+9],[x+w+13,y+9],[x+w+13,y+14],[x-8,y+14],[x-8,y+9],[x,y+9]]);
    rect(s, '#333e5c', x + 7, y + 13, w - 10, 3);
  }
  rect(s, '#9cabb5', 509, 18, 14, 14); rect(s, '#9cabb5', 506, 21, 20, 8);
  rect(s, '#6d7f95', 509, 28, 14, 4); rect(s, '#303b58', 506, 17, 9, 9);
  const litWindows = [];
  for (let depth = 0; depth < 3; depth++) {
    let x = -8;
    while (x < 640) {
      const w = 15 + Math.floor(random() * (depth ? 28 : 19));
      const h = 28 + Math.floor(random() * (depth === 0 ? 130 : 100));
      const base = 201 + depth * 13, y = base - h;
      const color = ['#3b4265', '#292f51', '#1c2642'][depth];
      rect(s, color, x, y, w, h);
      rect(s, ['#505778', '#43506e', '#39475f'][depth], x, y, w, 2);
      if (random() > .35) {
        rect(s, color, x + 4, y - 5, w - 9, 5);
        rect(s, '#576481', x + 7, y - 6, w - 14, 1);
      }
      if (random() > .7) {
        rect(s, '#303950', x + Math.floor(w/2), y - 17, 1, 13);
        rect(s, '#d49aab', x + Math.floor(w/2), y - 18, 1, 1);
      }
      for (let wy = y + 8; wy < base - 4; wy += 8) {
        for (let wx = x + 4; wx < x + w - 3; wx += 6) {
          const lit = random() > .42;
          const color = lit ? ['#b7a5b2', '#e0b08a', '#c78eac', '#7cabbc'][Math.floor(random()*4)] : '#46536e';
          rect(s, color, wx, wy, depth === 2 ? 2 : 1, 3);
          if (lit && depth === 2 && litWindows.length < 200) litWindows.push({ x: wx, y: wy, color });
        }
      }
      if (depth === 2 && random() > .72) {
        rect(s, '#9f749c', x + w - 5, y + 13, 3, 20);
        for (let j = 0; j < 4; j++) rect(s, '#f0b4bc', x + w - 4, y + 15 + j * 4, 1, 2);
      }
      x += w + 4 + Math.floor(random() * 5);
    }
  }
  // Riverside promenade, distant streetlamps, and broken reflections.
  rect(s, '#64607b', 0, 228, 640, 3); rect(s, '#191f38', 0, 231, 640, 49);
  rect(s, '#3e4b65', 0, 235, 640, 1); rect(s, '#303f5a', 0, 245, 640, 2);
  for (let x = 7; x < 640; x += 29) {
    rect(s, '#16223b', x, 216, 1, 13); rect(s, '#d4b69a', x - 1, 216, 3, 2);
    for (let y = 239; y < 279; y += 5) {
      const offset = Math.floor(random()*9)-4;
      rect(s, ['#656082', '#88718d', '#526981', '#977c8c'][Math.floor(random()*4)], x+offset, y, 2+Math.floor(random()*8), 1);
    }
  }
  // Window glass has permanent tiny droplets; moving streaks are clipped here.
  for (let i = 0; i < 100; i++) rect(s, '#8292a044', random()*640, random()*280, 1, 1);
  const rain = Array.from({ length: mobile.matches ? 42 : 100 }, () => ({ x: random()*640, y: random()*280, length: 2+Math.floor(random()*5), speed: 15+random()*30 }));
  const trails = Array.from({ length: 7 }, () => ({ x: 20+random()*600, y: random()*280, speed: 3+random()*5 }));
  function drawCity(time, moving) {
    ctx.drawImage(stillCity, 0, 0);
    const t = moving ? time : 0;
    for (const drop of rain) rect(ctx, '#a7c4d040', drop.x - ((t*drop.speed*.18)%15), (drop.y+t*drop.speed)%284-4, 1, drop.length);
    for (const drop of trails) {
      const y = (drop.y+t*drop.speed)%320-40;
      rect(ctx, '#a6c6d023', drop.x, y, 1, 22);
      rect(ctx, '#c7d9dd66', drop.x, y+22, 1, 2);
    }
    // Slow changes in a few distant lights, never a full-scene flash.
    const n = Math.floor(t/7);
    for (let i=0;i<5;i++) {
      const win = litWindows[(n*7+i*29)%litWindows.length];
      rect(ctx, '#46536e', win.x, win.y, 2, 3);
    }
  }
  // Smokey's palette: charcoal face, ashy fur, warm brown undercoat, golden eyes.
  const fur = { outline:'#302e3b', dark:'#42404a', gray:'#62616a', ash:'#82818a', light:'#a19c9c', brown:'#776b69', warm:'#95837b', eye:'#c8c27d', pupil:'#262e38', pink:'#c88d96' };
  function p(color, points) { poly(c, fur[color] || color, points); }
  function r(color,x,y,w,h) { rect(c, fur[color] || color,x,y,w,h); }
  function tail(frame, curled) {
    const sway = [0,1,2,1,0,-1][frame%6];
    c.save(); c.translate(0, sway);
    if (curled) {
      p('outline', [[12,47],[8,47],[8,41],[5,41],[5,31],[8,31],[8,28],[14,28],[14,33],[17,33],[17,39],[25,39],[25,48],[31,48],[31,58],[18,58],[18,54],[12,54]]);
      p('brown', [[10,32],[13,32],[13,39],[17,39],[17,43],[25,43],[25,50],[29,50],[29,55],[19,55],[19,51],[13,51],[13,46],[10,46]]);
      r('warm',9,34,3,8); r('ash',15,44,3,5); r('gray',20,49,4,3);
    } else {
      p('outline', [[30,48],[21,48],[21,45],[13,45],[13,41],[7,41],[7,35],[4,35],[4,25],[7,25],[7,21],[14,21],[14,25],[17,25],[17,34],[22,34],[22,38],[30,38]]);
      p('brown', [[8,26],[12,26],[12,35],[17,35],[17,39],[23,39],[23,43],[30,43],[30,47],[22,47],[22,43],[14,43],[14,39],[10,39],[10,34],[8,34]]);
      r('warm',7,27,3,7); r('ash',13,37,4,3); r('gray',22,41,5,3);
    }
    c.restore();
  }
  function head(x,y,expression,time) {
    c.save(); c.translate(Math.round(x),Math.round(y));
    const ear = expression==='look' ? -1 : Math.floor(time*1.5)%13===0 ? 1:0;
    // Stepped pointed ears and a broad fluffy cheek silhouette.
    p('outline', [[-17,4],[-17,-8],[-15,-8],[-15,-13+ear],[-12,-13+ear],[-6,-5],[-3,-5],[-3,-7],[4,-7],[4,-5],[8,-5],[15,-13],[18,-13],[18,5],[21,5],[21,12],[23,12],[23,16],[20,16],[20,20],[16,20],[16,24],[10,24],[10,27],[-9,27],[-9,24],[-15,24],[-15,21],[-19,21],[-19,16],[-22,16],[-22,10],[-19,10],[-19,4]]);
    p('gray', [[-14,-7],[-6,0],[-4,-3],[5,-3],[9,0],[15,-8],[15,5],[18,5],[18,11],[20,11],[20,15],[16,15],[16,20],[11,20],[11,23],[-8,23],[-8,21],[-14,21],[-14,17],[-18,17],[-18,10],[-15,10]]);
    p('brown', [[-14,-6],[-8,1],[-13,3]]); p('brown', [[11,0],[15,-7],[15,4]]);
    p('dark', [[-10,3],[-5,1],[5,1],[11,4],[14,8],[14,16],[10,19],[5,21],[-5,21],[-10,19],[-13,16],[-13,8]]);
    r('ash',-5,-2,3,2); r('ash',-16,9,3,3); r('ash',14,14,4,2);
    r('brown',-13,17,4,3); r('brown',11,19,3,2);
    const blink = expression==='sleep' || expression==='pet' || (time%6.7 >6.45);
    if (blink) { r('outline',-10,10,7,1); r('outline',4,10,7,1); r('gray',-9,9,5,1); r('gray',5,9,5,1); }
    else {
      p('outline', [[-12,7],[-3,7],[-3,13],[-9,13],[-12,10]]);
      p('eye', [[-11,8],[-4,8],[-4,11],[-9,11],[-11,9]]);
      p('outline', [[3,7],[12,7],[12,10],[9,13],[3,13]]);
      p('eye', [[4,8],[11,8],[11,10],[9,11],[4,11]]);
      const glance = expression==='look' ? 2 : 0;
      r('pupil',-8+glance,8,2,4); r('pupil',6+glance,8,2,4);
      r('#e0dcaa',-10,8,1,1); r('#e0dcaa',4,8,1,1);
    }
    r('gray',-2,10,3,6); r('outline',-3,16,6,2); r('outline',-1,18,2,2);
    r('ash',-7,16,3,2); r('ash',5,16,3,2);
    r('gray',-6,21,12,2); r('light',-3,22,6,1);
    // Smokey's long, pale whiskers, not a generic black-cat face.
    r('light',-22,15,9,1); r('light',-25,13,5,1); r('ash',-23,19,9,1);
    r('light',15,15,9,1); r('light',23,13,5,1); r('ash',16,19,9,1);
    if (expression==='blep') { r('pink',0,20,3,3); r('#e4a6aa',0,20,2,1); }
    c.restore();
  }
  function drawCat(time, expression, facing = 1) {
    c.clearRect(0,0,96,72); c.save();
    if (facing===-1) { c.translate(96,0); c.scale(-1,1); }
    const frame = Math.floor(time*3)%6;
    const walking = expression==='walk', sleeping=expression==='sleep';
    const breath = Math.floor(time*1.1)%2;
    tail(frame, !walking);
    if (sleeping) {
      p('outline', [[22,40],[29,40],[29,36],[42,36],[42,34],[58,34],[58,38],[68,38],[68,44],[77,44],[77,51],[82,51],[82,61],[76,61],[76,65],[25,65],[25,62],[18,62],[18,56],[15,56],[15,47],[22,47]]);
      p('brown', [[24,43],[33,43],[33,39],[48,39-breath],[58,39-breath],[58,42],[66,42],[66,48],[73,48],[73,59],[67,59],[67,62],[26,62],[26,59],[21,59],[21,48],[24,48]]);
      p('warm', [[27,45],[39,40],[49,40],[49,43],[36,46],[30,51],[25,51]]);
      head(62,37,'sleep',time);
      p('gray', [[24,57],[43,57],[43,60],[59,60],[59,64],[23,64],[23,61],[19,61],[19,57]]);
      r('ash',26,58,13,2); r('warm',35,60,16,2);
    } else {
      const bob = walking ? frame%2 : 0;
      c.translate(0,bob);
      p('outline', [[25,29],[31,29],[31,25],[44,25],[44,23],[57,23],[57,27],[66,27],[66,33],[72,33],[72,42],[76,42],[76,54],[72,54],[72,60],[67,60],[67,64],[27,64],[27,61],[21,61],[21,56],[18,56],[18,45],[21,45],[21,35],[25,35]]);
      p('brown', [[26,33],[33,33],[33,29],[47,27],[57,30],[63,32],[67,38],[68,49],[64,56],[56,60],[29,60],[25,56],[22,56],[22,45],[25,45]]);
      p('warm', [[26,36],[33,31],[43,29],[51,31],[51,34],[40,34],[33,38],[28,46],[24,46]]);
      p('gray', [[46,32],[60,29],[66,34],[69,46],[66,57],[59,61],[47,58],[41,52],[42,41]]);
      // Angular tufts break up the round body and form her generous chest mane.
      p('ash', [[49,36],[60,35],[66,41],[64,46],[68,47],[63,52],[63,56],[58,54],[56,60],[52,56],[48,58],[48,53],[44,51],[46,46],[43,44],[47,42]]);
      p('brown', [[50,40],[58,40],[62,46],[59,48],[60,52],[56,55],[53,51],[50,54],[50,49],[47,47]]);
      [[27,42],[29,50],[32,55],[38,38],[38,49],[35,57],[42,54],[23,51]].forEach(([x,y],i)=>r(i%2?'gray':'warm',x,y,2,5));
      const leg = walking ? [0,3,1,-2,0,2][frame] : 0;
      p('dark', [[30+leg,54],[37+leg,54],[37+leg,60],[40+leg,60],[40+leg,64],[28+leg,64],[28+leg,60],[30+leg,60]]);
      p('gray', [[54-leg,53],[61-leg,53],[62-leg,60],[67-leg,60],[67-leg,64],[53-leg,64]]);
      r('ash',55-leg,61,9,2); r('brown',30+leg,61,7,2);
      head(walking?66:59,walking?23:20,expression,time);
    }
    c.restore();
  }
  let state='idle', elapsed=0, duration=10, clock=0, x=0, fromX=0, targetX=0, facing=1, surface=0, fromSurface=0, targetSurface=0;
  let userPaused=false, raf=0, lastDraw=0, bubbleUntil=0, interactionCount=0;
  let knownReducedMotion=reducedMotion.matches;
  const paused = () => userPaused || reducedMotion.matches;
  const maxX = () => Math.max(0,area.clientWidth-cat.clientWidth);
  function setState(next, seconds) { state=next; elapsed=0; duration=seconds; cat.dataset.state=next; }
  function say(message, seconds=2.4) { bubble.textContent=message; bubbleUntil=seconds; }
  function settle() {
    if (mobile.matches) { setState(Math.random()<.4?'sleep':'look', 12+Math.random()*18); return; }
    const chance=Math.random();
    if (chance<.25) setState('sleep',22+Math.random()*22);
    else if (chance<.5) setState('look',5+Math.random()*8);
    else if (chance<.82 && maxX()>12) {
      fromX=x; targetX=x>maxX()*.5?0:maxX(); facing=targetX<x?-1:1;
      // Step off the low cushion before walking along the desk.
      if(surface) { fromSurface=surface; targetSurface=0; targetX=x; setState('jump',.8); }
      else setState('walk',Math.max(2.5,Math.abs(targetX-x)/18));
    } else if (x>maxX()*.6 && !surface && maxX()>12) {
      fromX=x;targetX=maxX();fromSurface=surface;targetSurface=9;setState('jump',.85);
    } else setState('idle',9+Math.random()*14);
  }
  function positionCat(lift=0) {
    x=Math.max(0,Math.min(maxX(),x));
    cat.style.transform=`translate(${Math.round(x)}px, ${-Math.round(surface+lift)}px)`;
  }
  function updateCat(dt) {
    clock+=dt; elapsed+=dt;
    if (elapsed>=duration) {
      if(state==='walk') x=targetX;
      if(state==='jump') {x=targetX;surface=targetSurface;}
      if (['walk','jump','pet','blep','wake'].includes(state)) setState('idle',10+Math.random()*12); else settle();
    }
    let lift=0;
    if (state==='walk') { const t=Math.min(1,elapsed/duration); x=fromX+(targetX-fromX)*t; }
    if (state==='jump') {
      const t=Math.min(1,elapsed/duration); x=fromX+(targetX-fromX)*t;
      surface=fromSurface+(targetSurface-fromSurface)*t; lift=4*t*(1-t)*32;
      // Snap the final fraction onto the destination surface before settling.
      if (t>.93) { surface=targetSurface; lift=0; }
    }
    positionCat(lift);
    drawCat(clock,state==='wake'?'look':state==='jump'?'walk':state,facing);
  }
  function interact() {
    interactionCount++;
    // Every eleventh greeting is the rare tongue-out photo reference.
    const blep=interactionCount%11===0;
    facing=1; setState(blep?'blep':'pet',blep?1.8:2.6);
    say(blep?'…blep.': ['Mrrp!','Purrr.','♡','Hello, human.'][Math.floor(Math.random()*4)]);
    if (paused()) { drawCat(1,blep?'blep':'pet'); positionCat(); if(!raf&&!document.hidden){lastDraw=0;raf=requestAnimationFrame(tick);} }
  }
  cat.addEventListener('click',interact);
  document.addEventListener('drizzlehaven:power',()=>{ facing=1;setState('wake',3); if(paused())drawCat(0,'look'); });
  function tick(now) {
    if(document.hidden) { raf=0;return; }
    // Some browsers update .matches a frame before delivering the change event.
    // Synchronize before stopping the loop so the control always reflects it.
    if(reducedMotion.matches!==knownReducedMotion) syncMotion();
    // Still run a single low-frequency timer for dismissal while motion is paused.
    if(now-lastDraw>=50) {
      const frameDelta=lastDraw?Math.min(.15,(now-lastDraw)/1000):0;
      lastDraw=now;
      if (!paused()) { updateCat(frameDelta); drawCity(clock,true); }
      if(bubbleUntil) {
        bubbleUntil-=frameDelta;
        if(bubbleUntil<=0) { bubbleUntil=0;bubble.textContent='';if(paused())drawCat(0,'idle'); }
      }
    }
    raf=(!paused() || bubbleUntil) ? requestAnimationFrame(tick) : 0;
  }
  function syncMotion() {
    knownReducedMotion=reducedMotion.matches;
    document.body.classList.toggle('room-paused',paused());
    motionButton.setAttribute('aria-pressed',String(paused()));
    motionButton.textContent=reducedMotion.matches?'Reduced motion on':userPaused?'Resume room motion':'Pause room motion';
    motionButton.disabled=reducedMotion.matches;
    if(paused()) { drawCity(0,false);drawCat(0,'idle'); }
    else if(!raf&&!document.hidden) {lastDraw=0;raf=requestAnimationFrame(tick);}
  }
  motionButton.addEventListener('click',()=>{userPaused=!userPaused;syncMotion();});
  reducedMotion.addEventListener('change',syncMotion);
  const resizeObserver=new ResizeObserver(()=>{x=Math.min(x,maxX());targetX=Math.min(targetX,maxX());if(mobile.matches){surface=0;setState('idle',14);}positionCat();});
  resizeObserver.observe(area);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) {cancelAnimationFrame(raf);raf=0;lastDraw=0;}
    else if(!raf)raf=requestAnimationFrame(tick);
  });
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
  window.addEventListener('pageshow',()=>{if(!raf&&!document.hidden){lastDraw=0;raf=requestAnimationFrame(tick);}});
  syncMotion();drawCity(0,false);drawCat(0,'idle');positionCat();
  if(!raf)raf=requestAnimationFrame(tick);
})();
