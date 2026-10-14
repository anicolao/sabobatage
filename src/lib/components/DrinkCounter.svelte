<script lang="ts">
 import CardFace from './CardFace.svelte';
 import { cardGesture } from './card-gesture';
 import { coverflowLayout } from './coverflow-layout';
 import { complete, definitions, type View, type Piece, type Target } from '$lib/game/engine';
 let { player, focused=0, publicTable=false, selected=null, targets=[], fit=()=>false, targetable=()=>false, onslot, oncard, onfocus, oninspect=(_card:Piece)=>{} }:{player:View['players'][number];focused?:number;publicTable?:boolean;selected?:Piece|null;targets?:Target[];fit?:(slot:number)=>boolean;targetable?:(slot:number,card:Piece)=>boolean;onslot:(slot:number)=>void;oncard:(slot:number,card:Piece)=>void;onfocus:(slot:number)=>void;oninspect?:(card:Piece)=>void}=$props();
 let width=$state(360),height=$state(250);
 const first=$derived(Math.min(focused,player.drinks.length-2));
 const cardWidth=$derived(Math.max(60,Math.min(width*.34,(height-66)/1.75,180)));
 const poses=$derived(coverflowLayout(player.drinks.length,first+1,width,cardWidth,2,58));
 let swipe:{id:number;x:number;y:number}|undefined;
 let swiped=false;
 function down(event:PointerEvent){swiped=false;if(publicTable||width>700||event.button!==0)return;swipe={id:event.pointerId,x:event.clientX,y:event.clientY};}
 function up(event:PointerEvent){if(swipe?.id!==event.pointerId)return;const dx=event.clientX-swipe.x,dy=event.clientY-swipe.y;swipe=undefined;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){swiped=true;onfocus(Math.max(0,Math.min(player.drinks.length-2,first+(dx<0?1:-1))));}}
 function activate(slot:number,action:()=>void){if(swiped)return;if(!publicTable&&width<=700&&(slot<first||slot>first+1))onfocus(slot);else action();}
</script>
<div class="counter-drinks" class:public-drinks={publicTable} bind:clientWidth={width} bind:clientHeight={height} style={`--drink-width:${cardWidth}px`} role="group" aria-label={`${player.name}'s counter`} onpointerdown={down} onpointerup={up} onpointercancel={()=>swipe=undefined}>
 {#each player.drinks as drink,slot}
  <div class="counter-drink" class:focused={focused===slot} class:face-up={slot>=first&&slot<=first+1} class:complete={complete(drink)} class:legal={fit(slot)} data-drop-slot={slot} data-drop-player={player.id} style={`--drink-pose:${poses[slot].transform};--drink-z:${poses[slot].z};--layers:${Math.max(0,drink.cards.length-1)}`} role="group" aria-label={`${player.name} drink ${slot+1}`}>
   <button onkeydown={()=>swiped=false} class="drink-coaster" onclick={()=>activate(slot,()=>onslot(slot))} aria-label={`${player.name} drink ${slot+1}${drink.cards.length?'':' empty slot'}`}><span>{slot+1}</span>{#if !drink.cards.length}<svg viewBox="0 0 48 64" aria-hidden="true"><path d="M8 20h32l-4 38H12ZM5 14h38M26 14l7-12"/><circle cx="20" cy="47" r="2"/><circle cx="29" cy="48" r="2"/><circle cx="25" cy="40" r="2"/></svg><small>New drink</small>{:else}<small>{complete(drink)?'✓ Complete':'Brewing'}</small>{/if}</button>
   <div class="counter-stack">
    {#each drink.cards as card,j (card.uid)}
     {@const mark=targets.findIndex(t=>t.card===card.uid)}
     <button onkeydown={()=>swiped=false} class="counter-card" data-piece={card.uid} style={`--layer:${j}`} class:marked={mark>=0} class:targetable={targetable(slot,card)} aria-label={`${definitions[card.type].name} in ${player.name} drink ${slot+1}`} use:cardGesture={{activate:()=>activate(slot,()=>oncard(slot,card)),inspect:()=>oninspect(card)}}><CardFace card={definitions[card.type]}/>{#if mark>=0}<span class="target-number">{mark+1}</span>{/if}</button>
    {/each}
   </div>
   <div class="counter-protection">{#each drink.protection as card}<button onclick={()=>oncard(slot,card)} aria-label={`Inspect ${definitions[card.type].name}`}>{card.type==='straw'?'✦':'◈'} {definitions[card.type].name}</button>{/each}</div>
   {#if selected&&!publicTable}<button onkeydown={()=>swiped=false} class="counter-place" disabled={!fit(slot)} onclick={()=>activate(slot,()=>onslot(slot))}>Place here</button>{/if}
  </div>
 {/each}
</div>
{#if !publicTable}<nav class="drink-selectors" aria-label="Your seven drink positions">{#each player.drinks as drink,slot}<button class:current={focused===slot} class:done={complete(drink)} class:has-target={targets.some(t=>t.player===player.id&&t.slot===slot)} aria-label={`View drink ${slot+1}${complete(drink)?', complete':''}`} aria-pressed={focused===slot} onclick={()=>onfocus(slot)}>{slot+1}{#if complete(drink)}<small>✓</small>{/if}</button>{/each}</nav>{/if}
