<script lang="ts">
 import CardFace from './CardFace.svelte';
 import {complete,definitions,type View} from '$lib/game/engine';
 let {players,playerId,onselect,onopen}:{players:View['players'];playerId:string;onselect:(id:string)=>void;onopen:(id:string,slot:number)=>void}=$props();
 const player=$derived(players.find(p=>p.id===playerId)??players[0]);
</script>
{#if player}
 <section class="opponent-counter" aria-label="Opponent counter">
  <header>{#if players.length>1}<select aria-label="Opponent to preview" value={player.id} onchange={e=>onselect(e.currentTarget.value)}>{#each players as p}<option value={p.id}>{p.name}</option>{/each}</select>{:else}<strong>{player.name}</strong>{/if}<span>✓ {player.drinks.filter(complete).length} · ▤ {player.handCount}</span></header>
  <div class="mini-drinks">{#each player.drinks as drink,slot}
   <button class:complete={complete(drink)} aria-label={`View ${player.name} drink ${slot+1}${complete(drink)?', complete':''}${drink.protection.length?', protected':''}`} onclick={()=>onopen(player.id,slot)}>
    {#each drink.cards as card,i}<span class="mini-face" style={`--mini-layer:${i}`} aria-hidden="true"><CardFace card={definitions[card.type]}/></span>{/each}
    {#if !drink.cards.length}<span class="mini-empty">{slot+1}</span>{/if}
    {#if drink.protection.length}<span class="mini-protection" aria-hidden="true">✦</span>{/if}
   </button>
  {/each}</div>
 </section>
{/if}
