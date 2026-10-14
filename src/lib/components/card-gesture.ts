import type { Action } from 'svelte/action';

type Point = { x: number; y: number };
type Gestures = {
 activate: () => void;
 inspect: () => void;
 drag?: { start: () => void; move: (point: Point) => void; end: (point: Point) => void; cancel: () => void };
};

/** Pantheon's tap/hold inspection, extended with pointer dragging for phones. */
export const cardGesture: Action<HTMLButtonElement, Gestures> = (node, callbacks) => {
 let timer: ReturnType<typeof setTimeout> | undefined;
 let pointer: { id: number; x: number; y: number } | undefined;
 let suppressed = false, dragging = false;
 const clear = () => { clearTimeout(timer); timer = undefined; };
 const inspect = () => { clear(); suppressed = true; node.focus({preventScroll:true}); callbacks.inspect(); };
 const down = (event: PointerEvent) => {
  if (event.button !== 0 || !event.isPrimary) return;
  clear(); suppressed = false; dragging = false;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  node.setPointerCapture(event.pointerId);
  timer = setTimeout(inspect, 550);
 };
 const move = (event: PointerEvent) => {
  if (pointer?.id !== event.pointerId) return;
  if (Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>10 && !suppressed) {
   clear(); suppressed = true;
   if (callbacks.drag) { dragging = true; callbacks.drag.start(); }
  }
  if (dragging) callbacks.drag?.move({x:event.clientX,y:event.clientY});
 };
 const up = (event: PointerEvent) => {
  if (pointer?.id !== event.pointerId) return;
  clear(); pointer = undefined;
  if (dragging) { dragging = false; callbacks.drag?.end({x:event.clientX,y:event.clientY}); }
 };
 const cancel = () => { clear(); pointer = undefined; suppressed = true; if (dragging) callbacks.drag?.cancel(); dragging = false; };
 const context = (event: MouseEvent) => { event.preventDefault(); if (!suppressed) inspect(); };
 const key = (event: KeyboardEvent) => {
  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); inspect(); }
  else if (event.key === 'Enter' || event.key === ' ') suppressed = false;
  else if (event.key === 'Escape') cancel();
 };
 const click = (event: MouseEvent) => { event.preventDefault(); if (!suppressed) callbacks.activate(); };
 const listeners = {pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,lostpointercapture:()=>{if(pointer)cancel();},contextmenu:context,keydown:key,click};
 for (const [type, listener] of Object.entries(listeners)) node.addEventListener(type,listener as EventListener);
 return {update: value => {callbacks=value;},destroy:()=>{
  clear(); if(dragging)callbacks.drag?.cancel();
  for(const [type,listener] of Object.entries(listeners))node.removeEventListener(type,listener as EventListener);
 }};
};
