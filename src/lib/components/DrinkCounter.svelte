<script lang="ts">
 import CardFace from './CardFace.svelte';
 import { complete, definitions, type View, type Piece, type Target } from '$lib/game/engine';
 let { player, focused=0, publicTable=false, selected=null, targets=[], fit=()=>false, targetable=()=>false, onslot, oncard, onfocus }:{player:View['players'][number];focused?:number;publicTable?:boolean;selected?:Piece|null;targets?:Target[];fit?:(slot:number)=>boolean;targetable?:(slot:number,card:Piece)=>boolean;onslot:(slot:number)=>void;oncard:(slot:number,card:Piece)=>void;onfocus:(slot:number)=>void}=$props();
</script>
<div class="counter-drinks" class:public-drinks={publicTable} aria-label={`${player.name}'s counter`}>
 {#each player.drinks as drink,slot}
  <div class="counter-drink" class:focused={focused===slot} class:complete={complete(drink)} class:legal={fit(slot)} role="group" aria-label={`${player.name} drink ${slot+1}`} ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();onslot(slot);}}>
   <button class="drink-coaster" onclick={()=>onslot(slot)} aria-label={`${player.name} drink ${slot+1}${drink.cards.length?'':' empty slot'}`}><span>{slot+1}</span>{#if !drink.cards.length}<svg viewBox="0 0 48 64" aria-hidden="true"><path d="M8 20h32l-4 38H12ZM5 14h38M26 14l7-12"/><circle cx="20" cy="47" r="2"/><circle cx="29" cy="48" r="2"/><circle cx="25" cy="40" r="2"/></svg><small>New drink</small>{:else}<small>{complete(drink)?'✓ Complete':'Brewing'}</small>{/if}</button>
   <div class="counter-stack">
    {#each drink.cards as card,j (card.uid)}
     {@const mark=targets.findIndex(t=>t.card===card.uid)}
     <button class="counter-card" data-piece={card.uid} style={`--layer:${j}`} class:marked={mark>=0} class:targetable={targetable(slot,card)} aria-label={`${definitions[card.type].name} in ${player.name} drink ${slot+1}`} onclick={()=>oncard(slot,card)}><CardFace card={definitions[card.type]}/>{#if mark>=0}<span class="target-number">{mark+1}</span>{/if}</button>
    {/each}
   </div>
   <div class="counter-protection">{#each drink.protection as card}<button onclick={()=>oncard(slot,card)} aria-label={`Inspect ${definitions[card.type].name}`}>{card.type==='straw'?'✦':'◈'} {definitions[card.type].name}</button>{/each}</div>
   {#if selected&&!publicTable}<button class="counter-place" onclick={()=>onslot(slot)}>Place here</button>{/if}
  </div>
 {/each}
</div>
{#if !publicTable}<nav class="drink-selectors" aria-label="Your seven drink positions">{#each player.drinks as drink,slot}<button class:current={focused===slot} class:done={complete(drink)} class:has-target={targets.some(t=>t.player===player.id&&t.slot===slot)} aria-label={`View drink ${slot+1}${complete(drink)?', complete':''}`} aria-pressed={focused===slot} onclick={()=>onfocus(slot)}>{slot+1}{#if complete(drink)}<small>✓</small>{/if}</button>{/each}</nav>{/if}
