<script lang="ts">
 import type { Card } from '$lib/game/cards';
 let { card, back = false }: { card: Card; back?: boolean } = $props();
</script>
<article class="card-face" class:back class:long-title={card.name.length > 15} data-category={card.category} data-family={card.family}>
 {#if back}
  <div class="back-frame"><span class="back-stars">✦ &nbsp; ✧ &nbsp; ✦</span><span class="back-logo">sa<span>BOBA</span>tage</span><div class="back-pearl">● ● ●</div><p>Sweet drinks.<br/>Sneaky moves.</p><small>THE BOBA CARD GAME</small></div>
 {:else}
 <header><span>{card.category === 'Tea' ? '❧' : card.category === 'Topping' ? '●' : card.category === 'Action' ? '✦' : '◇'}</span><span>{card.category}</span><span>{String(card.art+1).padStart(2,'0')}</span></header>
 <h3>{card.name}</h3>
 <div class="card-art" role="img" aria-label={`Original illustrated ${card.name} character`} style={card.art < 12 ? `background-position:${card.art%4*100/3}% ${Math.floor(card.art/4)*50}%` : `background-image:url(/art/boba-inventory-sheet.png);background-size:400% 400%;background-position:${(card.art-12)%4*100/3}% ${Math.floor((card.art-12)/4)*100/3}%`}></div>
 <div class="card-rules"><span class="family">{card.family}</span><p>{card.effect}</p></div>
 <footer><span>×{card.copies} IN DECK</span><span>{card.verified ? 'ART STUDY 01' : 'RULE TEXT PENDING'}</span></footer>
 {/if}
</article>
