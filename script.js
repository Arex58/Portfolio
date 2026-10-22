/* Alex/OS: a tiny dependency-free desktop written in vanilla JavaScript.
   All portfolio content comes from local <template> elements in index.html.
   The JARVIS widget is a scripted site guide, NOT a live AI service. */
(() => {
  'use strict';
  const desktop = document.getElementById('desktop');
  const layer = document.getElementById('windowLayer');
  const taskButtons = document.getElementById('taskButtons');
  const themeToggle = document.getElementById('themeToggle');
  const soundToggle = document.getElementById('soundToggle');
  const clock = document.getElementById('clock');
  const toast = document.getElementById('toast');
  const appNames = {
    about: 'about_me.txt', projects: 'my_projects', skills: 'toolbox.exe',
    experience: 'my_story.log', resume: 'resume.pdf', contact: 'say_hi.msg',
    jarvis: 'JARVIS.lab', 'project-jarvis': 'project_jarvis',
    'project-game': 'taekwondo_fighter', 'project-nightcrawler': 'nightcrawler_shop',
    'project-academy': 'academy_website'
  };
  const sizes = {
    about: [740, 610], projects: [760, 620], skills: [650, 600],
    experience: [675, 620], resume: [860, 680], contact: [590, 560],
    jarvis: [550, 580], 'project-jarvis': [750, 650],
    'project-game': [750, 670], 'project-nightcrawler': [720, 640],
    'project-academy': [720, 630]
  };
  const opened = new Map();
  let topZ = 10;
  let soundOn = false;
  let audioCtx = null;
  let toastTimeout;
  let youtubeLoad;
  const launchers = new Map();
  // Reuse the supplied artwork in window chrome as well as desktop shortcuts.
  const iconFiles = {about:'about_me',projects:'my_projects',skills:'toolbox',experience:'my_story',resume:'resume',contact:'say_hi',jarvis:'jarvis','project-jarvis':'jarvis','project-game':'my_projects','project-nightcrawler':'my_projects','project-academy':'my_projects'};
  function appLabel(parent, name) {
    const icon = document.createElement('img'); icon.alt = ''; icon.className = 'chrome-icon';
    icon.src = `assets/icons/game_icon_${iconFiles[name]}.png`;
    parent.replaceChildren(icon, document.createTextNode(appNames[name]));
  }
  function setupVideo(el) {
    const frame = el.querySelector('.youtube-player');
    const help = el.querySelector('.video-help');
    const state = document.createElement('span'); state.className = 'video-state'; state.setAttribute('role','status'); help.prepend(state);
    if (!/^https?:$/.test(location.protocol)) { state.textContent = 'Embedded playback needs a local web server or hosted website. '; return; }
    const url = new URL(frame.src); url.searchParams.set('origin',location.origin); url.searchParams.set('enablejsapi','1'); frame.src=url.href;
    if (!youtubeLoad) youtubeLoad = new Promise((resolve,reject) => {
      if (window.YT?.Player) { resolve(window.YT); return; }
      const script = document.createElement('script'); script.src='https://www.youtube.com/iframe_api';
      const timer=setTimeout(()=>reject(new Error('Player unavailable')),12000);
      window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);resolve(window.YT);};
      script.onerror=()=>{clearTimeout(timer);reject(new Error('Player unavailable'));};document.head.appendChild(script);
    });
    youtubeLoad.then(YT=>{
      if (!el.isConnected) return;
      el.videoPlayer = new YT.Player(frame,{events:{
        onReady:()=>{state.textContent='Press play to watch the trailer. ';},
        onStateChange:event=>{if(event.data===1)state.textContent='Trailer playing. ';},
        onError:event=>{const errors={100:'This video is unavailable or private.',101:'The video owner has disabled embedding.',150:'The video owner has disabled embedding.',153:'YouTube could not identify this page. Try opening the portfolio from its hosted URL.',5:'Your browser could not play this video.'};state.textContent=(errors[event.data]||'The embedded player could not play this video.')+' ';}
      }});
    }).catch(()=>{if(el.isConnected)state.textContent='The YouTube player could not connect. Use the original video link below. ';});
  }

  function note(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function beep(frequency = 480) {
    if (!soundOn) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.07);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.075);
    } catch (_) { /* Interface audio is optional. */ }
  }
  function isMobile() { return window.matchMedia('(max-width: 760px)').matches; }
  function clamp(value, min, max) { return Math.min(Math.max(value, min), Math.max(min, max)); }
  function desktopBounds() { return isMobile() ? layer.getBoundingClientRect() : desktop.getBoundingClientRect(); }
  function positionFor(app, el) {
    const [targetW, targetH] = sizes[app] || [680, 580];
    const b = desktopBounds();
    const width = Math.min(targetW, b.width - 30);
    const height = Math.min(targetH, b.height - 26);
    const offset = (opened.size % 5) * 22;
    el.style.width = `${Math.max(310, width)}px`;
    el.style.height = `${Math.max(240, height)}px`;
    el.style.left = `${clamp((b.width - width) / 2 + offset, 10, b.width - width - 10)}px`;
    el.style.top = `${clamp((b.height - height) / 2 + offset, 10, b.height - height - 10)}px`;
  }
  function topWindow() {
    return [...opened.values()].filter(w => !w.classList.contains('is-minimized')).sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0];
  }
  function focusWindow(el) {
    if (!el || !el.isConnected) return;
    opened.forEach(win => { win.classList.remove('is-active'); });
    el.classList.remove('is-minimized');
    el.classList.add('is-active');
    el.style.zIndex = String(++topZ);
    syncTaskbar();
  }
  function syncTaskbar() {
    taskButtons.replaceChildren();
    opened.forEach((el, name) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'task-window';
      appLabel(b, name);
      b.title = `Show ${appNames[name]}`;
      b.setAttribute('aria-label', `Show ${appNames[name]}`);
      if (el.classList.contains('is-active') && !el.classList.contains('is-minimized')) b.classList.add('is-active');
      b.addEventListener('click', () => {
        if (el.classList.contains('is-active') && !el.classList.contains('is-minimized')) minimizeWindow(el);
        else { focusWindow(el); el.focus({ preventScroll: true }); }
      });
      taskButtons.appendChild(b);
    });
  }
  function closeWindow(el) {
    if (!el) return;
    const name = el.dataset.app;
    el.videoPlayer?.destroy();
    opened.delete(el.dataset.app);
    el.remove();
    const next = topWindow();
    if (next) { next.classList.add('is-active'); next.style.zIndex = String(++topZ); }
    syncTaskbar(); beep(350);
    if (next) next.focus({ preventScroll: true });
    else if (launchers.get(name)?.isConnected) launchers.get(name).focus({ preventScroll: true });
  }
  function minimizeWindow(el) {
    el.videoPlayer?.pauseVideo?.();
    el.classList.remove('is-active');
    el.classList.add('is-minimized');
    const next = topWindow();
    if (next) next.classList.add('is-active');
    syncTaskbar(); beep(320);
    if (next) next.focus({ preventScroll: true });
    else taskButtons.querySelector('button')?.focus({ preventScroll: true });
  }
  function maximizeWindow(el) {
    el.classList.toggle('is-maximized');
    focusWindow(el); beep(560);
  }
  function addDragSupport(el, titlebar) {
    let drag = null;
    titlebar.addEventListener('pointerdown', (event) => {
      if (isMobile() || el.classList.contains('is-maximized') || event.target.closest('button')) return;
      if (event.button !== 0) return;
      focusWindow(el);
      drag = { x: event.clientX, y: event.clientY, left: parseFloat(el.style.left), top: parseFloat(el.style.top) };
      titlebar.setPointerCapture(event.pointerId);
    });
    titlebar.addEventListener('pointermove', (event) => {
      if (!drag) return;
      const b = desktopBounds();
      const left = clamp(drag.left + event.clientX - drag.x, 0, b.width - el.offsetWidth);
      const top = clamp(drag.top + event.clientY - drag.y, 0, b.height - 44);
      el.style.left = `${left}px`; el.style.top = `${top}px`;
    });
    function end() { drag = null; }
    titlebar.addEventListener('pointerup', end);
    titlebar.addEventListener('pointercancel', end);
    titlebar.addEventListener('dblclick', event => { if (!isMobile() && !event.target.closest('button')) maximizeWindow(el); });
  }
  function openApp(name) {
    if (!appNames[name]) return;
    if (!opened.has(name)) launchers.set(name, document.activeElement);
    const existing = opened.get(name);
    if (existing) { focusWindow(existing); existing.focus({ preventScroll: true }); beep(590); return; }
    const template = document.getElementById(`tpl-${name}`);
    if (!template) return;
    const el = document.createElement('section');
    el.className = 'app-window'; el.dataset.app = name;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'false');
    el.setAttribute('aria-label', appNames[name]); el.setAttribute('tabindex', '-1');
    const titlebar = document.createElement('div'); titlebar.className = 'window-titlebar';
    const label = document.createElement('span'); label.className = 'window-label'; appLabel(label, name);
    const controls = document.createElement('div'); controls.className = 'window-controls';
    for (const [action, symbol, title] of [['minimize','−','Minimize'],['maximize','□','Maximize / restore'],['close','×','Close']]) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'window-control'; b.dataset.action = action;
      b.textContent = symbol; b.title = `${title} ${appNames[name]}`; b.setAttribute('aria-label', `${title} ${appNames[name]}`);
      b.addEventListener('click', () => { if (action === 'close') closeWindow(el); if (action === 'minimize') minimizeWindow(el); if (action === 'maximize') maximizeWindow(el); });
      controls.appendChild(b);
    }
    titlebar.append(label, controls);
    const content = document.createElement('div'); content.className = 'window-content';
    content.appendChild(template.content.cloneNode(true));
    el.append(titlebar, content);
    opened.set(name, el); layer.appendChild(el);
    positionFor(name, el); addDragSupport(el, titlebar);
    el.addEventListener('pointerdown', () => { if (!el.classList.contains('is-active')) focusWindow(el); });
    el.addEventListener('focusin', () => { if (!el.classList.contains('is-active')) focusWindow(el); });
    focusWindow(el); el.focus({ preventScroll: true }); beep(670);
    if (name === 'jarvis') setupJarvis(el);
    if (name === 'project-game') setupVideo(el);
  }
  function setTheme(theme) {
    const isNight = theme === 'night';
    document.body.dataset.theme = isNight ? 'night' : 'day';
    themeToggle.innerHTML = `${isNight ? '☀' : '☾'} <span class="task-action-name">theme</span>`;
    themeToggle.title = `Switch to ${isNight ? 'warm desk' : 'rainy night'} palette`;
    themeToggle.setAttribute('aria-label', themeToggle.title);
    try { localStorage.setItem('rainbyte-theme', isNight ? 'night' : 'day'); } catch (_) {}
  }
  let savedTheme='night';
  try { savedTheme=localStorage.getItem('rainbyte-theme') || 'night'; } catch (_) {}
  setTheme(savedTheme);
  themeToggle.addEventListener('click', () => { setTheme(document.body.dataset.theme === 'night' ? 'day' : 'night'); beep(750); });
  soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    soundToggle.innerHTML = `${soundOn ? '♫' : '♪̸'} <span class="task-action-name">sound ${soundOn ? 'on' : 'off'}</span>`;
    soundToggle.setAttribute('aria-pressed', String(soundOn));
    soundToggle.setAttribute('aria-label', `Turn sound ${soundOn ? 'off' : 'on'}`);
    note(`Interface sound ${soundOn ? 'on' : 'off'}.`); beep(820);
  });
  function updateClock() {
    const now = new Date();
    clock.textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(now);
    clock.dateTime = now.toISOString();
  }
  updateClock(); setInterval(updateClock, 30_000);
  document.addEventListener('click', event => {
    const openButton = event.target.closest('[data-open]');
    if (openButton) openApp(openButton.dataset.open);
    const copyButton = event.target.closest('[data-copy]');
    if (copyButton) {
      const copyText = copyButton.dataset.copy;
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(copyText).then(() => note('Email copied to clipboard!')).catch(() => note(`Email: ${copyText}`));
      else note(`Email: ${copyText}`);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { const top = topWindow(); if (top) { closeWindow(top); event.preventDefault(); } }
    if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '')) return;
    // Keyboard equivalent to dragging an active window: Alt+Shift+arrow.
    if (event.altKey && event.shiftKey && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key) && !isMobile()) {
      const top = topWindow(); if (!top || top.classList.contains('is-maximized')) return;
      event.preventDefault();
      const b = desktopBounds(); const step = 22;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      top.style.left = `${clamp(parseFloat(top.style.left) + dx, 0, b.width - top.offsetWidth)}px`;
      top.style.top = `${clamp(parseFloat(top.style.top) + dy, 0, b.height - 44)}px`;
    }
  });
  function setupJarvis(windowEl) {
    const log = windowEl.querySelector('#chatLog');
    const form = windowEl.querySelector('#jarvisForm');
    const input = windowEl.querySelector('#jarvisQuestion');
    const sendMessage = question => {
      const text = question.trim().slice(0, 180);
      if (!text) return;
      const userBubble = document.createElement('p'); userBubble.className = 'user-bubble'; userBubble.textContent = text;
      log.appendChild(userBubble);
      const q = text.toLowerCase(); let response = ''; let open = null;
      if (/project|built|build|made|work sample|portfolio|website|game/.test(q)) { response = 'Alex built a solo Unity taekwondo game and the Ultimate Taekwondo Academy website. His JARVIS assistant and the controller shop for his brother are still in development. Opening the projects now.'; open = 'projects'; }
      else if (/skill|language|code|tech|stack|tools/.test(q)) { response = 'Alex used Unity and C# for the game, PHP and MySQL for the academy site, and Python and JavaScript for JARVIS. Opening his skills list.'; open = 'skills'; }
      else if (/resume|résumé|cv|hire|job|experience/.test(q)) { response = 'The résumé PDF is right over here. It has his education, projects, and experience.'; open = 'resume'; }
      else if (/contact|email|reach|message|hello/.test(q)) { response = 'You can email Alex directly from his contact window. Opening it for you!'; open = 'contact'; }
      else if (/who|about|school|degree|alejandro/.test(q)) { response = 'Alex is a Los Angeles developer and Cal State LA Computer Science graduate. He also teaches taekwondo. Here is more about him.'; open = 'about'; }
      else if (/thank/.test(q)) { response = 'You\'re welcome!'; }
      else { response = 'I’m only a scripted portfolio guide, so I can answer simple site questions. Try asking about projects, skills, the résumé, or contact info.'; }
      const bubble = document.createElement('p'); bubble.className = 'bot-bubble'; bubble.textContent = response;
      log.appendChild(bubble); log.scrollTop = log.scrollHeight;
      if (open) openApp(open);
    };
    form.addEventListener('submit', event => { event.preventDefault(); sendMessage(input.value); input.value = ''; });
    windowEl.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => sendMessage(button.dataset.question)));
  }
  // Short, skippable startup; visitors who prefer reduced motion enter immediately.
  const boot = document.getElementById('bootScreen');
  let bootTimer;
  function enterDesktop() {
    clearTimeout(bootTimer); boot.hidden = true;
    document.querySelectorAll('body > header, body > main, body > footer').forEach(el => el.inert = false);
    document.getElementById('homeTitle').focus({ preventScroll: true });
    try { sessionStorage.setItem('rainbyte-booted','1'); } catch (_) {}
  }
  let hasBooted = false;
  try { hasBooted = sessionStorage.getItem('rainbyte-booted') === '1'; } catch (_) {}
  if (!hasBooted && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    boot.hidden = false;
    document.querySelectorAll('body > header, body > main, body > footer').forEach(el => el.inert = true);
    const skip = document.getElementById('skipBoot'); skip.addEventListener('click',enterDesktop); skip.focus();
    boot.addEventListener('keydown', event => { if(event.key === 'Escape') {event.stopPropagation();enterDesktop();} if(event.key === 'Tab'){event.preventDefault();skip.focus();} });
    bootTimer = setTimeout(enterDesktop,1600);
  }
  window.addEventListener('resize', () => {
    if (isMobile()) return;
    opened.forEach((el,name) => { if(!el.classList.contains('is-maximized')) positionFor(name,el); });
  });
})();
