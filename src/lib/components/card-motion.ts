import { tick } from 'svelte';
type Pose={rect:DOMRect;face:HTMLElement};
/** Capture only rendered cards: the public surface never receives private faces. */
export function captureCards(){
 const poses=new Map<string,Pose>();
 document.querySelectorAll<HTMLElement>('.play-surface [data-piece]').forEach(el=>{
  const face=el.querySelector<HTMLElement>('.card-face');if(!face||!el.getClientRects().length)return;
  const rect=face.getBoundingClientRect();if(rect.width&&rect.height)poses.set(el.dataset.piece!,{rect,face:face.cloneNode(true) as HTMLElement});
 });return poses;
}
export async function animateCards(before:ReturnType<typeof captureCards>){
 await tick();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const after=captureCards();
 for(const [id,to] of after){const from=before.get(id);if(!from||Math.abs(from.rect.x-to.rect.x)+Math.abs(from.rect.y-to.rect.y)<8)continue;
  const ghost=from.face;ghost.setAttribute('aria-hidden','true');ghost.inert=true;
  Object.assign(ghost.style,{position:'fixed',left:`${to.rect.x}px`,top:`${to.rect.y}px`,width:`${to.rect.width}px`,height:`${to.rect.height}px`,zIndex:'40',pointerEvents:'none',margin:'0'});
  document.body.append(ghost);
  const animation=ghost.animate([{transform:`translate(${from.rect.x-to.rect.x}px,${from.rect.y-to.rect.y}px) scale(${from.rect.width/to.rect.width})`,opacity:1},{transform:'translate(0,0) scale(1)',opacity:0}],{duration:280,easing:'ease-out'});
  void animation.finished.catch(()=>{}).finally(()=>ghost.remove());
 }
}
