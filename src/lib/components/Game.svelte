<script lang="ts">
 import { onMount } from 'svelte';
 import { base } from '$app/paths';
 import { goto, replaceState } from '$app/navigation';
 import QRCode from 'qrcode';
 import { connectFirebase } from '$lib/backend/firebase';
 import { createRoom } from '$lib/backend/repository';
 import { GameSession, firestoreTransport } from '$lib/backend/session';
 import CardFace from './CardFace.svelte';
 import DrinkCounter from './DrinkCounter.svelte';
 import './game-surface.css';
 import {captureCards,animateCards} from './card-motion';
 import { definitions, complete, score, canPlace, type Piece, type View, type Target, type Command } from '$lib/game/engine';
 import { cards } from '$lib/game/cards';
 let { mode='lobby' }: {mode?:'lobby'|'table'|'hand'}=$props();
 let mounted=$state(false);
 let room=$state(''), name=$state(''), view=$state<View|null>(null), error=$state(''), busy=$state(false), connected=$state(false);
 let focusPlayer=$state(''), focusSlot=$state(0), handPage=$state(0), inspecting=$state(false), journal=$state(false), upright=$state(false), placingTea=$state(false);
 let counter=$derived(view?.players.find(p=>p.id===(focusPlayer||view?.you))??view?.players[0]);
 let handStart=$derived(Math.min(handPage,Math.max(0,Math.ceil((view?.hand.length??0)/7)-1))*7);
 let visibleHand=$derived(view?.hand.slice(handStart,handStart+7)??[]);
 let selected=$state<Piece|null>(null), targets=$state<Target[]>([]), destinations=$state<number[]>([]), wildAs=$state('green-tea'), bonus=$state<'draw'|'play'|null>(null), discarding=$state(false), showDiscard=$state(false), detail=$state<Piece|null>(null);
 let qr=$state(''), joinUrl=$state(''), address=$state(''), target=$state(5), localRevision=-1;
 let preview: {command:(cmd:Command|{type:'undo'})=>void}|undefined;
 let syncPending=$state(0); let session:GameSession|undefined; let uid=''; let disposed=false;
 let active=$derived(view?.players[view.active]);let me=$derived(view?.players.find(p=>p.id===view?.you));
 let myTurn=$derived(!!me&&active?.id===me.id);let choosing=$derived(view?.phase==='choice'&&view.pending?.victim===view.you);
 let selectedDef=$derived(selected?definitions[selected.type]:null);
 let prompt=$derived(choosing?`Choose ${view?.pending?.choice==='milk'?'one Milk card':'an incomplete drink'} to discard.`:selected?selected.type==='5-star-review'?'Tap the draw pile to draw two.':selected.type==='recycle'?'Tap a card in the discard pile.':selected.type==='sabobatage'?`Choose five ingredients. ${targets.length}/5 selected; reactions start after the fifth.`:selected.type==='sugar-and-ice'||selected.type==='tea-party'?targets.length?`Choose your destination drink${targets.length>1?'s, in order':''}. ${destinations.length}/${targets.length} placed.`:selected.type==='tea-party'?'Choose one or two tea cards, then tap your destination drinks.':'Tap an opponent’s ingredient, then your destination drink.':['bogo','pos-down','lactose-intolerant','untrained-employee'].includes(selected.type)?'Tap the shop you want to target.':selected.type==='health-inspector'?'Tap a topping or flavor to target its type.':'Tap one of your drink slots to place this card.':view?.phase==='reaction'?'All targets are chosen. Play Customer Loyalty or pass.':myTurn?view?.phase==='draw'?'Tap the deck to draw for your turn.':`${view?.plays} plays left. Tap a hand card to play it.`:`${active?.name??'The next shop'} is taking a turn.`);
 function accept(next:View){const before=localRevision>=0&&next.revision===localRevision+1?captureCards():null;if(next.revision!==localRevision){if(localRevision>=0){selected=null;targets=[];destinations=[];}localRevision=next.revision;view=next;}else view=next;if(before)void animateCards(before);}
 async function connectTable(fresh=false){
  if(busy)return;busy=true;error='';
  try{
   const services=await connectFirebase();if(disposed)return;
   if(fresh||!room){const code=await createRoom(services.db,services.uid);if(disposed)return;room=code;view=null;localRevision=-1;replaceState(`${base}/table/?room=${room}`,{});}
   uid=services.uid;session?.stop();await updateQR();
   if(disposed)return;
   session=new GameSession(firestoreTransport(services.db,room),uid,mode==='table',state=>{accept(state.view);connected=state.connected;syncPending=state.pending;if(state.error)error=state.error;},localStorage,`sabobatage:events:v1:${room}:${uid}`);session.start();
  }catch(e){error=(e as Error).message;}finally{busy=false;}
 }
 async function create(){if(mode==='table')await connectTable(true);else await goto(`${base}/table/`);}
 function join(){error='';try{session?.send({type:'player/joined',name});}catch(e){error=(e as Error).message;}}
 function command(cmd:Command|{type:'undo'}){cmd=$state.snapshot(cmd);if(!view||(!session&&!preview))return;error='';try{if(preview)preview.command(cmd);else if(cmd.type==='undo')session!.undo();else session!.send({type:'game/command',command:cmd});selected=null;targets=[];destinations=[];discarding=cmd.type==='discard'&&(view?.hand.length??0)>7;inspecting=false;showDiscard=false;placingTea=false;}catch(e){error=(e as Error).message;}}
 function cancel(){selected=null;targets=[];destinations=[];discarding=false;placingTea=false;bonus=null;}
 async function play(extra:Partial<Command>={}){if(!selected)return;await command({type:'play',card:selected.uid,targets,destinations,wildAs,...(bonus?{bonus}:{}),...extra});}
 function handCard(c:Piece){
  detail=c;inspecting=false;
  if(discarding){command({type:'discard',card:c.uid});return;}
  if(view?.phase==='reaction'&&c.type==='customer-loyalty'){selected=selected?.uid===c.uid?null:c;return;}
  if(!myTurn||view?.phase!=='play'){inspecting=true;return;}
  if(selected?.uid===c.uid){cancel();return;}
  selected=c;targets=[];destinations=[];bonus=null;placingTea=false;
  if(c.type==='recycle')showDiscard=true;
 }
 function counterLoyalty(counterLast=false){if(selected?.type==='customer-loyalty')command({type:'counter',card:selected.uid,counterLast});}
 function openShop(id:string){if(selected&&['bogo','pos-down','lactose-intolerant','untrained-employee'].includes(selected.type)){targetPlayer(id);return;}focusPlayer=id;inspecting=false;showDiscard=false;}
 function inspect(c:Piece){detail=c;inspecting=true;showDiscard=false;journal=false;}
 function needsBonus(){return selected?.type==='boba'||targets.some(t=>view?.players.find(p=>p.id===t.player)?.drinks[t.slot].cards.some(c=>c.uid===t.card&&c.type==='boba'));}
 function tableCard(player:string,slot:number,c:Piece){
  if(mode==='table'){inspect(c);return;}
  if(!selected&&!choosing){inspect(c);return;}
  if(player===view?.you&&selected&&!['sabobatage','health-inspector','sugar-and-ice','tea-party'].includes(selected.type)&&!choosing)slotClick(player,slot);
  else targetCard({player,slot,card:c.uid},c);
 }
 function seatStyle(i:number,n:number){const seats=n===2?[[50,82,0],[50,18,180]]:n===3?[[50,82,0],[26,19,180],[74,19,180]]:n===4?[[50,82,0],[16,50,90],[50,18,180],[84,50,-90]]:[[50,82,0],[16,50,90],[29,18,180],[71,18,180],[84,50,-90]];const [x,y,r]=seats[i];return `--sx:${x}%;--sy:${y}%;--seat-width:${Math.abs(r)===90?23:29}%;--rotation:${upright?0:r}deg`;}
 function targetCard(t:Target,c:Piece){detail=c;inspecting=false;if(choosing){void command({type:'choose',targets:[t]});return;}if(!selected)return;
  const drink=view?.players.find(p=>p.id===t.player)?.drinks[t.slot];
  if(drink?.protection.some(c=>c.type==='straw')){error='A Straw protects this drink.';return;}
  if(definitions[c.type].category==='Action'){inspect(c);return;}
  if(['sugar-and-ice','tea-party'].includes(selected.type)&&t.player===view?.you){error='Choose another shop’s ingredient.';return;}
  if(selected.type==='tea-party'&&definitions[c.type].category!=='Tea'){error='Tea Party takes tea cards.';return;}
  if(selected.type==='sabobatage'){targets=targets.some(x=>x.card===t.card)?targets.filter(x=>x.card!==t.card):[...targets,t];if(targets.length===5)void play();}
  else if(selected.type==='health-inspector')void play({targets:[t]});
  else if(selected.type==='sugar-and-ice') {targets=[t];destinations=[];focusPlayer=view?.you??'';focusSlot=0;}
  else if(selected.type==='tea-party'){targets=targets.some(x=>x.card===t.card)?targets.filter(x=>x.card!==t.card):targets.length<2?[...targets,t]:targets;destinations=[];}
 }
 function slotClick(player:string,slot:number){if(mode==='table'){focusSlot=slot;return;}if(needsBonus()&&!bonus){error='Choose Draw 1 or +1 play first.';return;}if(choosing&&view?.pending?.choice==='drink'){void command({type:'choose',targets:[{player,slot}]});return;}if(player!==view?.you||!selected)return;if(selectedDef?.category==='Action'&&!['straw','bobasurance','sugar-and-ice','tea-party'].includes(selected.type))return;if(['sugar-and-ice','tea-party'].includes(selected.type)){if(!targets.length)return;if(selected.type==='tea-party'&&!placingTea){error='Choose your teas, then use the placement tray.';return;}destinations=[...destinations,slot];if(destinations.length===targets.length)void play();}else void play({slot});}
 function targetPlayer(id:string){if(selected&&['bogo','pos-down','lactose-intolerant','untrained-employee'].includes(selected.type))void play({victim:id});}
 function targetable(player:string,slot:number,c:Piece){
  const drink=view?.players.find(p=>p.id===player)?.drinks[slot];
  if(drink?.protection.some(p=>p.type==='straw'))return false;
  if(choosing)return player===view?.you&&(view.pending?.choice==='milk'?c.type==='milk':!!drink&&!complete(drink));
  if(!selected||definitions[c.type].category==='Action')return false;
  if(selected.type==='sabobatage')return true;
  if(selected.type==='health-inspector')return c.type!=='wild-ingredient'&&['Flavor','Topping'].includes(definitions[c.type].category);
  return player!==view?.you&&(selected.type==='sugar-and-ice'||selected.type==='tea-party'&&definitions[c.type].category==='Tea');
 }
 function fit(slot:number){if(!selected||!me)return false;if(selected.type==='straw'||selected.type==='bobasurance')return !!me.drinks[slot].cards.length&&(selected.type!=='straw'||complete(me.drinks[slot]))&&!me.drinks[slot].protection.some(c=>c.type===selected?.type||c.type==='straw');const c=targets.length?view?.players.find(p=>p.id===targets[destinations.length]?.player)?.drinks[targets[destinations.length]?.slot]?.cards.find(c=>c.uid===targets[destinations.length]?.card):selected;if(!c)return false;const probe=me.drinks.map(d=>({cards:d.cards.map(c=>({...c})),protection:d.protection.map(c=>({...c}))}));destinations.forEach((dest,i)=>{const t=targets[i];const previous=view?.players.find(p=>p.id===t.player)?.drinks[t.slot]?.cards.find(c=>c.uid===t.card);if(dest>=0&&previous)probe[dest].cards.push(previous);});return canPlace(probe[slot],{...c,...(c.type==='wild-ingredient'?{as:wildAs}:{})});}
 async function updateQR(){if(!room||!address)return;joinUrl=`${location.protocol}//${address}${base}/hand/?room=${room}`;qr=await QRCode.toDataURL(joinUrl,{width:220,margin:2,color:{dark:'#583c32',light:'#fffaf0'}});}
 onMount(()=>{mounted=true;const params=new URLSearchParams(location.search);room=(params.get('room')??'').toUpperCase();address=location.host;void updateQR();
  if(import.meta.env.DEV&&params.has('demo')){room='DEMO';connected=true;void import('$lib/game/preview').then(({previewSession})=>{if(!disposed)preview=previewSession(params.get('demo')||'resting',mode==='table',accept);});return()=>{disposed=true;};}

  if(mode==='table'||mode==='hand'&&room)void connectTable();
  return()=>{disposed=true;session?.stop();};
 });
</script>
<svelte:head><title>{mode==='table'?'Shared table':mode==='hand'?'Your hand':'Play'} · Sabobatage</title></svelte:head>
<svelte:window onkeydown={e=>{if(e.key==='Escape'){if(inspecting||showDiscard||journal){inspecting=false;showDiscard=false;journal=false;}else cancel();}}}/>
<main id="main" class="game-page" class:playing={!!view&&view.phase!=='lobby'} class:shared-table={mode==='table'} class:gathering-table={mode==='table'&&(!view||view.phase==='lobby')}>
 {#if mode==='lobby'}
  <section class="game-welcome"><p class="eyebrow">OPEN YOUR BOBA SHOP</p><h1>One table.<br/><em>A few secret recipes.</em></h1><p>Gather 2–5 players. Keep the shared table on a big screen and your cards on your phone.</p><button class="primary-button" disabled={!mounted||busy} onclick={create}>Create a table ↗</button><form onsubmit={e=>{e.preventDefault();void goto(`${base}/hand/?room=${room.trim().toUpperCase()}`);}}><label>Room code<input aria-label="Room code" bind:value={room} maxlength="6" placeholder="ABC234" required/></label><button class="game-button" disabled={!mounted}>Join on this device</button></form><p class="small">Private hands, instant moves, and undo when someone makes a slip.</p></section>
 {:else if mode==='table'&&(!view||view.phase==='lobby')}
  <section class="table-gathering" aria-label="Tabletop setup">
   <div class="table-center table-lobby">
    <p class="eyebrow">ONE TABLE · 2–5 SHOPS</p><h1>sa<b>boba</b>tage</h1>
    {#if view}
     <p>Scan with your phone.<br/>Your recipes stay in your hand.</p>
     <strong class="table-room">{room}</strong>
     <ul aria-label="Joined shops">{#each view.players as p}<li>● {p.name}</li>{/each}</ul>
     <p aria-live="polite">{view.players.length} of 5 shops joined</p>
     {#if view.host}<label>Drinks to win<select bind:value={target}><option value={3}>3 · Quick game</option><option value={4}>4 drinks</option><option value={5}>5 · Full game</option></select></label><button class="primary-button" disabled={view.players.length<2||busy||!connected} onclick={()=>command({type:'start',target})}>Open the shops →</button>{:else}<p>Waiting for the host to open the shops.</p>{/if}
     {#if import.meta.env.DEV}<label class="table-network">Phone address<input aria-label="Address for phones" bind:value={address} onchange={updateQR}/></label>{/if}
    {:else if error}<p>We couldn’t open this table.</p><button class="primary-button" disabled={busy} onclick={()=>connectTable()}>Try again</button>
    {:else}<p role="status">Opening your table…</p>{/if}
   </div>
   {#each ['South','West','North','East'] as side,i}
    <aside class="table-phone-join" style={`--edge:${i}`} aria-label={`${side} phone join`}>
     {#if view&&qr}<a href={joinUrl} target="_blank" rel="noreferrer"><img src={qr} alt={`Scan to join room ${room} from the ${side.toLowerCase()} side`}/><strong>Scan to join</strong></a><span>Your cards. Your phone.</span>
     {:else}<span class="qr-placeholder" aria-hidden="true">▧</span><strong>Bring your phone</strong>{/if}
    </aside>
   {/each}
  </section>
 {:else if !room}<section class="game-welcome"><h1>Find your table</h1><a href={base + '/play/'} class="primary-button">Create or join a table</a></section>
 {:else}
  {#if !view||view.phase==='lobby'}<header class="game-heading"><div><p class="eyebrow">{mode==='table'?'SHARED TABLE':'PRIVATE HAND'} · {room}</p><h1>{me?.name??'The boba shop'}</h1></div><span class:offline={!connected} class="connection">{syncPending?`◌ Syncing ${syncPending} move${syncPending===1?'':'s'}`:connected?'● Synced':'○ Connecting…'}</span><a href={base + '/play/'}>Other tables</a></header>{/if}
  {#if view}
   {#if mode==='hand'&&!me}<form class="join-shop" onsubmit={e=>{e.preventDefault();void join();}}><h2>Take a seat</h2><label>Your shop name<input aria-label="Your shop name" bind:value={name} maxlength="32" required placeholder="Peach Please"/></label><button class="primary-button" disabled={busy||view.phase!=='lobby'}>Join table</button>{#if view.phase!=='lobby'}<p>This game has started. Reopen it on the phone you used to join.</p>{/if}</form>{/if}
   {#if view.phase==='lobby'}
    <section class="table-lobby"><div><p class="eyebrow">{view.players.length}/5 SHOPS OPEN</p><h2>Everyone brings<br/>their own secrets.</h2><ul>{#each view.players as p}<li>● {p.name}{p.id===view.you?' · you':''}</li>{/each}</ul>{#if !view.players.length}<p>Scan the code with each player’s phone to join.</p>{/if}{#if view.host}<label>Drinks to win<select bind:value={target}><option value={3}>3 · Quick game</option><option value={4}>4 drinks</option><option value={5}>5 · Full game</option></select></label><button class="primary-button" disabled={view.players.length<2||busy} onclick={()=>command({type:'start',target})}>Open the shops →</button>{:else}<p>Waiting for the host to open the shops.</p>{/if}</div>{#if mode==='table'}<div class="join-code">{#if qr}<img src={qr} alt={`Scan to join room ${room}`} width="220" height="220"/>{/if}<strong>{room}</strong><a href={joinUrl}>{joinUrl}</a><p>Scan to open your private hand.</p><label>Address for phones<input aria-label="Address for phones" bind:value={address} onchange={updateQR}/></label>{#if address.startsWith('127.')||address.startsWith('localhost')}<p>Use the Network address printed by the dev server so phones can reach this table.</p>{/if}<a href={`${base}/hand/?room=${room}`} target="_blank" rel="noreferrer">Open a hand on this device ↗</a></div>{/if}</section>
   {:else}
    <div class="play-surface" class:public-surface={mode==='table'} class:upright style={`--seat-count:${view.players.length}`}>
     <header class="surface-top"><a href={base + '/play/'} class="table-wordmark">sa<b>boba</b>tage</a><span class="room-label">{room}</span><span class="sync-note" aria-live="polite">{!connected?'Reconnecting':syncPending?'Sending…':''}</span><button onclick={()=>{journal=!journal;showDiscard=false;inspecting=false;}} aria-pressed={journal}>Journal</button>{#if mode==='table'}<button onclick={()=>upright=!upright} aria-pressed={upright}>{upright?'Upright display':'Seated display'}</button>{/if}</header>
     {#if mode!=='table'}<nav class="shop-coasters" aria-label="Shops">{#each view.players as p,i}<button class:turn-shop={active?.id===p.id} class:focused-shop={counter?.id===p.id} onclick={()=>openShop(p.id)} aria-label={`${p.name}, ${p.drinks.filter(complete).length} drinks, ${p.handCount} private cards`}><span class="shop-portrait" style={`background-position:${[0,100/3,200/3,100,0][i]}% ${i===4?50:0}%`}></span><strong>{p.id===view.you?'You':p.name}</strong><small>✓ {p.drinks.filter(complete).length}/{view.target} · ▤ {p.handCount}</small>{#if p.skip}<small>Skip next turn</small>{/if}</button>{/each}</nav>{/if}
     <section class="action-receipt" aria-live="polite"><small>{view.phase==='won'?'SHOP OF THE DAY':myTurn?'YOUR TURN':`${active?.name}’S TURN`}</small><strong>{view.phase==='won'?`${view.players.find(p=>p.id===view!.winner)?.name} wins!`:view.pending?definitions[view.pending.card.type].name:discarding?`Discard ${Math.max(0,(me?.handCount??0)-7)} cards`:mode==='table'?view.phase==='draw'?'Ready to draw':`${view.plays} plays left`:prompt}</strong>
      {#if view.pending}<span>{view.pending.targets.length?`${view.pending.targets.length} ingredients chosen`:view.players.find(p=>p.id===view!.pending!.victim)?.name} · {view.phase==='choice'?`Waiting for ${view.players.find(p=>p.id===view!.pending!.victim)?.name}`:`Waiting for ${view.players.filter(p=>!view!.pending!.passed.includes(p.id)).map(p=>p.name).join(', ')}`}</span>{#if view.pending.protected.length}<span>Saved by Loyalty: {view.players.filter(p=>view!.pending!.protected.includes(p.id)).map(p=>p.name).join(', ')}</span>{/if}{/if}
      {#if view.phase==='reaction'&&me}<div class="receipt-choices">{#if selected?.type==='customer-loyalty'}<button onclick={()=>counterLoyalty(false)}>Protect my shop</button>{#if view.pending?.chainTarget}<button onclick={()=>counterLoyalty(true)}>Counter last Loyalty</button>{/if}{/if}<button disabled={view.pending?.passed.includes(me.id)} onclick={()=>command({type:'pass'})}>{view.pending?.passed.includes(me.id)?'Passed':'Pass'}</button></div>{/if}
      {#if view.phase==='won'&&view.host}<button onclick={create}>Open a new table →</button>{/if}
     </section>
     <div class="surface-piles"><button class="surface-deck" aria-label={selected?.type==='5-star-review'?'Play 5-Star Review and draw two':myTurn&&view.phase==='draw'?`Draw ${me&&me.drinks.filter(complete).length>=2?3:2} cards`:'Draw pile'} disabled={!(myTurn&&view.phase==='draw')&&selected?.type!=='5-star-review'} onclick={()=>selected?.type==='5-star-review'?play():command({type:'draw'})}><CardFace card={cards[0]} back/><span>{selected?.type==='5-star-review'?'Draw 2':myTurn&&view.phase==='draw'?`Draw ${me&&me.drinks.filter(complete).length>=2?3:2}`:'Draw pile'} <b>{view.deckCount}</b></span></button><button class="surface-discard" data-piece={view.discard.at(-1)?.uid} aria-label={`Discard pile, ${view.discard.length} cards`} onclick={()=>{showDiscard=!showDiscard;inspecting=false;journal=false;}}>{#if view.discard.length}<CardFace card={definitions[view.discard.at(-1)!.type]}/>{:else}<div class="empty-pile">↻</div>{/if}<span>Discard <b>{view.discard.length}</b></span></button></div>
     {#if mode==='table'}
      {#each view.players as player,i}<section class="physical-seat" class:seat-active={active?.id===player.id} style={seatStyle(i,view.players.length)}><header><strong>{player.name}</strong><span>✓ {player.drinks.filter(complete).length}/{view.target} · ▤ {player.handCount} private cards{player.skip?' · Skip next turn':''}</span>{#if view.pending}<span>{view.pending.protected.includes(player.id)?'✓ Loyalty protection':view.pending.passed.includes(player.id)?'✓ Passed':'Choosing'}</span>{/if}</header><DrinkCounter {player} publicTable targets={view.pending?.targets??[]} onslot={slot=>{focusPlayer=player.id;focusSlot=slot;}} oncard={(slot,c)=>{focusPlayer=player.id;inspect(c);}} onfocus={()=>{}}/></section>{/each}
     {:else if counter}
      <section class="personal-counter"><div class="counter-owner"><strong>{counter.id===view.you?'Your counter':`${counter.name}’s counter`}</strong>{#if counter.id!==view.you&&me}<button onclick={()=>{focusPlayer=me!.id;inspecting=false;}}>Your counter ↩</button>{/if}{#if selected||discarding}<button onclick={cancel}>Back</button>{/if}</div><DrinkCounter player={counter} focused={focusSlot} selected={counter.id===view.you&&selected&&(selectedDef?.category!=='Action'||['straw','bobasurance'].includes(selected.type)||(['sugar-and-ice','tea-party'].includes(selected.type)&&targets.length>0))?selected:null} targets={view.pending?.targets??targets} fit={slot=>counter?.id===view?.you&&fit(slot)} targetable={(slot,c)=>targetable(counter?.id??String(),slot,c)} onslot={slot=>slotClick(counter!.id,slot)} oncard={(slot,c)=>tableCard(counter!.id,slot,c)} onfocus={slot=>{focusSlot=slot;inspecting=false;}}/></section>
     {/if}
     {#if selected&&mode!=='table'}<aside class="selection-ticket"><div><strong>{selectedDef?.name}</strong><button onclick={()=>inspect(selected!)}>Inspect</button></div><p>{selectedDef?.effect}</p>{#if needsBonus()}<div class="receipt-choices"><button class:picked={bonus==='draw'} aria-pressed={bonus==='draw'} onclick={()=>bonus='draw'}>Draw 1</button><button class:picked={bonus==='play'} aria-pressed={bonus==='play'} onclick={()=>bonus='play'}>+1 play</button></div>{/if}{#if selected.type==='tea-party'&&targets.length&&!placingTea}<button onclick={()=>{placingTea=true;focusPlayer=me?.id??'';}}>Use {targets.length} tea{targets.length>1?'s':''} →</button>{/if}{#if selected.type==='tea-party'&&placingTea&&!me?.drinks.some((_,i)=>fit(i))}<button onclick={()=>{destinations=[...destinations,-1];if(destinations.length===targets.length)void play();}}>Discard tea that cannot fit</button>{/if}{#if targets.length}<span class="selection-count">{targets.length} chosen{destinations.length?` · ${destinations.length} placed`:''}</span>{/if}</aside>{/if}
     {#if me&&mode!=='table'}<section class="near-hand" aria-label="Your private hand"><div class="hand-meta"><span>Your hand · {view.hand.length}{view.hand.length>7?' / 7':''}</span>{#if view.hand.length>7}<button aria-label="Previous hand cards" disabled={handStart===0} onclick={()=>handPage--}>←</button><span>{handStart+1}–{Math.min(handStart+7,view.hand.length)}</span><button aria-label="Next hand cards" disabled={handStart+7>=view.hand.length} onclick={()=>handPage++}>→</button>{/if}</div><div class="hand-fan" style={`--count:${visibleHand.length}`}>{#each visibleHand as c,i (c.uid)}<button class="fan-hit" class:lifted={selected?.uid===c.uid} style={`--i:${i};--tilt:${(i-(visibleHand.length-1)/2)*3}deg;--rise:${Math.abs(i-(visibleHand.length-1)/2)*7}px`} data-piece={c.uid} aria-label={`${discarding?'Discard':'Select'} ${definitions[c.type].name}`} aria-pressed={selected?.uid===c.uid} draggable={myTurn&&view.phase==='play'} ondragstart={e=>{handCard(c);e.dataTransfer?.setData('text/plain',c.uid);}} onclick={()=>handCard(c)}><span class="fan-face"><CardFace card={definitions[c.type]}/></span><span class="fan-label">{definitions[c.type].name}</span></button>{/each}</div></section>{/if}
     <footer class="surface-rail"><button disabled={!view.canUndo} title={view.canUndo?`Undo ${view.undoLabel}`:'No eligible move since the last draw, reveal, or turn end'} onclick={()=>command({type:'undo'})}>↶ Undo</button><span>{mode==='table'?'Hands stay on phones':myTurn?`${view.plays} plays left`:me?.name??'Private hand'}</span>{#if myTurn&&view.phase==='play'}<button class="end-receipt" onclick={()=>{if(me!.handCount>7){cancel();discarding=true;}else command({type:'end'});}}>{me!.handCount>7?`Discard ${me!.handCount-7} to end`:'End turn →'}</button>{:else if mode==='table'}<a href={joinUrl}>Phone link ↗</a>{:else}<span>✓ {me?.drinks.filter(complete).length??0}/{view.target}</span>{/if}</footer>
     {#if inspecting&&detail||showDiscard||journal}<aside class="surface-reader" style={mode==='table'?seatStyle(Math.max(0,view.players.findIndex(p=>p.id===focusPlayer)),view.players.length):''} aria-label={showDiscard?'Discard reader':journal?'Shop journal':'Card inspector'}><header><strong>{showDiscard?'Discard pile':journal?'Shop journal':definitions[detail!.type].name}</strong><button aria-label="Close reader" onclick={()=>{inspecting=false;showDiscard=false;journal=false;}}>Back ↩</button></header>{#if showDiscard}<div class="reader-discards">{#each view.discard as c}<button aria-label={`${selected?.type==='recycle'?'Recycle':'Inspect'} ${definitions[c.type].name}`} onclick={()=>{if(selected?.type==='recycle')void play({targets:[{player:'',slot:0,card:c.uid}]});else inspect(c);}}><CardFace card={definitions[c.type]}/></button>{:else}<p>No discarded cards yet.</p>{/each}</div>{:else if journal}<ol>{#each view.log.slice().reverse() as entry}<li>{entry}</li>{/each}</ol>{:else if detail}<div class="reader-face"><CardFace card={definitions[detail.type]}/></div><p>{definitions[detail.type].effect}</p>{/if}</aside>{/if}
    </div>
   {/if}
  {:else}<p>Connecting to room {room}…</p>{/if}
 {/if}
 {#if error}<div class="game-error" role="alert">{error}<button aria-label="Dismiss error" onclick={()=>error=''}>✕</button></div>{/if}
</main>
