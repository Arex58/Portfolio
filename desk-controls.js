/* The desk peripherals operate the existing OS controls, without replacing
   native typing, pointer navigation, or the window manager. */
(() => {
  'use strict';
  const stage = document.getElementById('monitorStage');
  const screen = document.getElementById('monitorLive');
  const keyboard = document.getElementById('deskKeyboard');
  const status = document.getElementById('deskInputStatus');
  const mouse = document.getElementById('deskMouse');
  const pad = document.getElementById('mousePad');
  const cursor = document.getElementById('deskCursor');
  const isOn = () => stage.dataset.power === 'on';
  const textField = element => element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLInputElement && ['text','search','url','tel','password'].includes(element.type));
  let input = null, shift = false, highlighted = null, drag = null, suppressClick = false;
  let point = { x: .5, y: .5 };

  const rows = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm,.?'];
  rows.forEach(letters => {
    const row = document.createElement('div');
    row.className = 'desk-key-row';
    for (const letter of letters) row.append(makeKey(letter, letter.toUpperCase()));
    keyboard.append(row);
  });
  const bottom = document.createElement('div');
  bottom.className = 'desk-key-row desk-key-actions';
  [['Shift','Shift'],[' ','Space'],['Backspace','Del'],['Enter','Enter']].forEach(([value,label]) => bottom.append(makeKey(value,label)));
  keyboard.append(bottom);

  function makeKey(value, label) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'desk-key'; button.dataset.key = value;
    button.textContent = label;
    button.setAttribute('aria-label', value === ' ' ? 'Space' : value === 'Backspace' ? 'Backspace' : label);
    if (value === 'Shift') button.setAttribute('aria-pressed', 'false');
    return button;
  }
  screen.addEventListener('focusin', event => {
    if (textField(event.target)) input = event.target;
  });
  // Closing the destination returns the keyboard to its ready state.
  new MutationObserver(() => {
    if(input && !input.isConnected) {
      input=null;
      if(isOn()) status.textContent='Click a key to type in JARVIS or a selected field.';
    }
  }).observe(document.getElementById('windowLayer'),{childList:true});
  // Mouse/touch key presses keep the input's selection. Keyboard users retain
  // focus on the key so Enter/Space can operate it like any other button.
  keyboard.addEventListener('pointerdown', event => {
    if (event.target.closest('.desk-key')) event.preventDefault();
  });
  function typingTarget() {
    if (input?.isConnected && !input.disabled && !input.readOnly && input.getClientRects().length) return input;
    document.querySelector('.shortcut[data-open="jarvis"]').click();
    input = document.getElementById('jarvisQuestion');
    return input;
  }
  keyboard.addEventListener('click', event => {
    const key = event.target.closest('.desk-key');
    if (!key || !isOn()) return;
    const value = key.dataset.key;
    if (value === 'Shift') {
      shift = !shift; key.setAttribute('aria-pressed', String(shift));
      keyboard.classList.toggle('shift-on', shift); return;
    }
    const focusedKey = document.activeElement?.closest('.desk-key');
    const target = typingTarget();
    if (!target) return;
    if (focusedKey) focusedKey.focus({ preventScroll: true });
    else if(event.pointerType !== 'touch') target.focus({ preventScroll: true });
    status.textContent = target.id === 'jarvisQuestion' ? 'Typing in JARVIS. Enter sends your message.' : 'Typing in the selected field.';
    if (value === 'Enter') { target.form?.requestSubmit(); return; }
    let start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    const replacement = value === 'Backspace' ? '' : shift ? value.toUpperCase() : value;
    if (value === 'Backspace' && start === end) start = Math.max(0, start - 1);
    if (target.maxLength >= 0 && target.value.length - (end-start) + replacement.length > target.maxLength) return;
    target.setRangeText(replacement, start, end, 'end');
    target.dispatchEvent(new Event('input', { bubbles: true }));
  });

  function clearHighlight() {
    highlighted?.classList.remove('desk-pointed'); highlighted = null;
  }
  function pointedElement() {
    const bounds = screen.getBoundingClientRect();
    const hit = document.elementFromPoint(bounds.left + point.x*bounds.width, bounds.top + point.y*bounds.height);
    return hit && screen.contains(hit) ? hit : null;
  }
  function renderPointer() {
    if (!isOn()) return;
    cursor.hidden = false;
    cursor.style.left = `${Math.round(point.x * screen.clientWidth)}px`;
    cursor.style.top = `${Math.round(point.y * screen.clientHeight)}px`;
    clearHighlight();
    highlighted = pointedElement()?.closest('button,a,input,textarea');
    highlighted?.classList.add('desk-pointed');
  }
  const clamp = value => Math.max(.01, Math.min(.97, value));
  function move(dx,dy) {
    point.x = clamp(point.x+dx); point.y = clamp(point.y+dy); renderPointer();
  }
  function clickPointer() {
    if (!isOn()) return;
    renderPointer();
    const target = pointedElement()?.closest('button,a,input,textarea,select');
    if (!target || target.disabled) return;
    target.focus({ preventScroll: true });
    target.click();
  }
  mouse.addEventListener('pointerdown', event => {
    if (!isOn() || event.button !== 0) return;
    event.preventDefault();
    mouse.focus({ preventScroll: true });
    mouse.setPointerCapture(event.pointerId);
    drag = { id:event.pointerId, x:event.clientX, y:event.clientY, travel:0, offsetX:0, offsetY:0 };
    suppressClick = false; renderPointer();
  });
  mouse.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
    drag.travel += Math.abs(dx)+Math.abs(dy);
    drag.x=event.clientX; drag.y=event.clientY;
    drag.offsetX=Math.max(-16,Math.min(16,drag.offsetX+dx));
    drag.offsetY=Math.max(-16,Math.min(16,drag.offsetY+dy));
    mouse.style.transform=`translate(${Math.round(drag.offsetX)}px,${Math.round(drag.offsetY)}px)`;
    move(dx/Math.max(120,pad.clientWidth),dy/Math.max(120,pad.clientHeight));
  });
  function release(event) {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.travel>4 || event.type === 'pointercancel';
    drag=null; mouse.style.transform='';
    if(mouse.hasPointerCapture(event.pointerId)) mouse.releasePointerCapture(event.pointerId);
  }
  mouse.addEventListener('pointerup',release);
  mouse.addEventListener('pointercancel',release);
  mouse.addEventListener('lostpointercapture',release);
  mouse.addEventListener('click', event => {
    if (event.detail === 0 || !suppressClick) clickPointer();
    suppressClick=false;
  });
  mouse.addEventListener('keydown', event => {
    const steps = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if (steps[event.key]) {
      event.preventDefault(); const [x,y]=steps[event.key];
      const step = event.shiftKey ? 2 : 12;
      move(x*step/screen.clientWidth,y*step/screen.clientHeight);
    } else if(event.key === 'Home') {event.preventDefault();point={x:.5,y:.5};renderPointer();}
    else if(event.key === 'Escape') {cursor.hidden=true;clearHighlight();}
  });
  // The pad's wheel scrolls the panel under the virtual cursor.
  pad.addEventListener('wheel',event=>{
    if(!isOn() || cursor.hidden) return;
    let target=pointedElement();
    while(target && target!==screen) {
      if(target.scrollHeight>target.clientHeight && ['auto','scroll'].includes(getComputedStyle(target).overflowY)) {
        event.preventDefault();target.scrollBy({top:event.deltaY,behavior:'instant'});break;
      }
      target=target.parentElement;
    }
  },{passive:false});
  screen.addEventListener('pointermove',()=>{if(!drag){cursor.hidden=true;clearHighlight();}});
  function syncPower() {
    keyboard.disabled = mouse.disabled = !isOn();
    if(!isOn()) {
      input=null;drag=null;mouse.style.transform='';cursor.hidden=true;clearHighlight();
      status.textContent='Power on to use the desk controls.';
    } else status.textContent='Click a key to type in JARVIS or a selected field.';
  }
  new MutationObserver(syncPower).observe(stage,{attributes:true,attributeFilter:['data-power']});
  new ResizeObserver(()=>{if(!cursor.hidden)renderPointer();}).observe(screen);
  syncPower();
})();
