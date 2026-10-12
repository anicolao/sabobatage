import { cards } from './cards';
export type Piece = { uid: string; type: string; as?: string };
export type Drink = { cards: Piece[]; protection: Piece[] };
export type Player = { id: string; name: string; hand: Piece[]; drinks: Drink[]; skip: number; delayed: Piece[] };
export type Target = { player: string; slot: number; card?: string };
export type Pending = { actor: string; card: Piece; targets: Target[]; victim?: string; destinations?: number[]; wildAs?: string; bonus?: 'draw'|'play'; passed: string[]; protected: string[]; chainTarget?: string; choice?: 'milk'|'drink' };
export type Game = { players: Player[]; deck: Piece[]; discard: Piece[]; active: number; plays: number; phase: 'lobby'|'draw'|'play'|'reaction'|'choice'|'won'; pending?: Pending; winner?: string; target: number; rng: number; log: string[] };
export type Command = { type: 'start'|'draw'|'play'|'end'|'discard'|'pass'|'counter'|'choose'; card?: string; slot?: number; targets?: Target[]; victim?: string; destinations?: number[]; wildAs?: string; bonus?: 'draw'|'play'; counterLast?: boolean; target?: number };
export const definitions = Object.fromEntries(cards.map(c=>[c.id,c]));
export const ingredientTypes = cards.filter(c=>c.category!=='Action' && c.id!=='wild-ingredient').map(c=>c.id);
export function emptyGame(seed = 12345): Game {return {players:[], deck:[],discard:[],active:0,plays:0,phase:'lobby',target:5,rng:seed||1,log:[]};}
function fail(message:string): never {throw new Error(message);}
function requireRule(value: unknown,message:string): asserts value {if(!value) fail(message);}
function random(g:Game) {g.rng=(Math.imul(g.rng,1664525)+1013904223)>>>0; return g.rng/4294967296;}
function shuffle(g:Game,arr:Piece[]) {for(let i=arr.length-1;i>0;i--){const j=Math.floor(random(g)*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
export function addPlayer(g:Game,id:string,name:string) {requireRule(g.phase==='lobby','This game has already started.');requireRule(g.players.length<5,'This table is full.');requireRule(!g.players.some(p=>p.id===id),'Already seated.');g.players.push({id,name,hand:[],drinks:Array.from({length:7},()=>({cards:[],protection:[]})),skip:0,delayed:[]});}
export const effective = (c:Piece)=>c.type==='wild-ingredient'?c.as!:c.type;
const ingredient = (c:Piece)=>definitions[c.type]?.category!=='Action';
function kind(c:Piece){return definitions[effective(c)]?.category;}
function validOrdinaryDrink(cs:Piece[]):boolean {
 if(cs.length===0)return true;
 if(cs.some(c=>!ingredient(c)||!definitions[effective(c)]||effective(c)==='wild-ingredient'||(c.type==='wild-ingredient'&&effective(c)==='taro')))return false;
 if(cs.some(c=>effective(c)==='taro'))return cs.length<=2 && cs.filter(c=>effective(c)==='taro').length===1 && cs.every(c=>['taro','milk','oat-milk'].includes(effective(c)));
 if(cs.some(c=>!['Tea','Flavor','Topping'].includes(kind(c))))return false;
 for(const k of ['Tea','Flavor','Topping'])if(cs.filter(c=>kind(c)===k).length>1)return false;
 const f=cs.find(c=>kind(c)==='Flavor'),t=cs.find(c=>kind(c)==='Topping');
 if(!f||!t)return true;
 const milk=['milk','oat-milk'].includes(effective(f));
 return (milk?['boba','pudding','red-bean']:['boba','aloe','lychee-jelly']).includes(effective(t));
}
/** Wilds stay flexible; no declaration is required by the rulebook. */
export function validDrink(cs:Piece[]):boolean {
 if(cs.length>3)return false;
 const wild=cs.findIndex(c=>c.type==='wild-ingredient');
 if(wild<0)return validOrdinaryDrink(cs);
 return ingredientTypes.filter(type=>type!=='taro').some(type=>validDrink(cs.map((c,i)=>i===wild?{...c,type,as:undefined}:c)));
}
export function complete(d:Drink){return validDrink(d.cards) && (d.cards.some(c=>effective(c)==='taro')?d.cards.length===2:d.cards.length===3);}
export function score(p:Player){return p.drinks.filter(complete).length;}
export function canPlace(d:Drink,c:Piece){return !complete(d)&&validDrink([...d.cards,c]);}
function draw(g:Game,p:Player,n:number){for(let i=0;i<n;i++){if(!g.deck.length)g.deck=shuffle(g,g.discard.splice(0));const c=g.deck.pop();if(c)p.hand.push(c);}}
function log(g:Game,text:string){g.log=[...g.log.slice(-79),text];}
function removeHand(p:Player,id:string){const index=p.hand.findIndex(c=>c.uid===id);requireRule(index>=0,'That card is not in your hand.');return p.hand.splice(index,1)[0];}
function place(g:Game,p:Player,c:Piece,slot:number,as?:string,bonus?:string){requireRule(Number.isInteger(slot)&&slot>=0&&slot<7,'Choose a drink slot.');if(c.type==='wild-ingredient')delete c.as;requireRule(canPlace(p.drinks[slot],c),'That ingredient does not fit this drink.');p.drinks[slot].cards.push(c);if(c.type!=='wild-ingredient'&&kind(c)==='Topping'){if(c.type==='boba'&&bonus==='play')g.plays++;else draw(g,p,1);}}
function checkWin(g:Game){const winner=g.players.find(p=>score(p)>=g.target);if(winner){g.phase='won';g.winner=winner.id;log(g,`${winner.name} wins with ${score(winner)} drinks!`);}}
function tableTarget(g:Game,t:Target){const p=g.players.find(p=>p.id===t.player);requireRule(p,'Choose a player at this table.');requireRule(Number.isInteger(t.slot)&&t.slot>=0&&t.slot<7,'Choose a drink.');const d=p.drinks[t.slot];const c=d.cards.find(c=>c.uid===t.card);return {p,d,c};}
function attackable(g:Game,t:Target,needsCard=true){const v=tableTarget(g,t);requireRule(!v.d.protection.some(c=>c.type==='straw'),'A Straw protects this drink.');if(needsCard)requireRule(v.c,'Choose an ingredient on the table.');return v;}
function discardPiece(g:Game,c:Piece){delete c.as;g.discard.push(c);}
function destroy(g:Game,t:Target){const {d,c}=tableTarget(g,t);if(c){d.cards=d.cards.filter(x=>x.uid!==c.uid);discardPiece(g,c);}}
function finishPending(g:Game){delete g.pending;g.phase='play';checkWin(g);}
function resolve(g:Game){const a=g.pending!;const actor=g.players.find(p=>p.id===a.actor)!;const victim=g.players.find(p=>p.id===a.victim);const type=a.card.type;
 if(victim&&a.protected.includes(victim.id)){if(type==='pos-down')discardPiece(g,a.card);log(g,`${victim.name}'s Customer Loyalty blocks ${definitions[type].name}.`);finishPending(g);return;}
 if(type==='bogo'){if(victim?.hand.length){actor.hand.push(victim.hand.splice(Math.floor(random(g)*victim.hand.length),1)[0]);draw(g,actor,1);}}
 else if(type==='pos-down'){victim!.skip++;victim!.delayed.push(a.card);}
 else if(type==='lactose-intolerant'||type==='untrained-employee'){g.phase='choice';a.choice=type==='lactose-intolerant'?'milk':'drink';return;}
 else {
  const protectedSlots=new Set<string>();
  for(const t of a.targets){const {d}=tableTarget(g,t);const key=`${t.player}:${t.slot}`;if(a.protected.includes(t.player)||d.protection.some(c=>c.type==='straw'))protectedSlots.add(key);else if(!protectedSlots.has(key)&&d.protection.length){protectedSlots.add(key);d.protection.splice(0).forEach(c=>discardPiece(g,c));}}
  a.targets.forEach((t,i)=>{if(protectedSlots.has(`${t.player}:${t.slot}`))return;const {d,c}=tableTarget(g,t);if(!c)return;
   if(type==='sugar-and-ice'||type==='tea-party'){
    d.cards=d.cards.filter(x=>x.uid!==c.uid);const dest=a.destinations?.[i];if(dest!==undefined&&dest>=0)place(g,actor,c,dest,c.type==='wild-ingredient'?a.wildAs:undefined,a.bonus);else discardPiece(g,c);
   }else destroy(g,t);
  });
 }
 finishPending(g);
}
function play(g:Game,p:Player,cmd:Command){const c=p.hand.find(c=>c.uid===cmd.card);requireRule(c,'Choose a card from your hand.');requireRule(g.plays>0,'No plays remaining. End your turn.');requireRule(c.type!=='customer-loyalty','Use Customer Loyalty during a reaction.');const type=c.type;
 if(ingredient(c)){const copy={...c};place(g,p,copy,cmd.slot!,cmd.wildAs,cmd.bonus);removeHand(p,c.uid);g.plays--;log(g,`${p.name} added ${definitions[type].name} to drink ${(cmd.slot??0)+1}.`);checkWin(g);return;}
 if(type==='straw'||type==='bobasurance'){
  const d=p.drinks[cmd.slot!];requireRule(d?.cards.length,'Choose one of your drinks.');requireRule(type!=='straw'||complete(d),'A Straw needs a completed drink.');requireRule(!d.protection.some(c=>c.type===type||c.type==='straw'),'That drink already has this protection.');d.protection.push(removeHand(p,c.uid));g.plays--;log(g,`${p.name} protected drink ${cmd.slot!+1}.`);return;
 }
 if(type==='5-star-review'){removeHand(p,c.uid);draw(g,p,2);discardPiece(g,c);g.plays--;log(g,`${p.name} played 5-Star Review.`);return;}
 if(type==='recycle'){const i=g.discard.findIndex(c=>c.uid===cmd.targets?.[0]?.card);requireRule(i>=0,'Choose a card in the discard pile.');removeHand(p,c.uid);p.hand.push(g.discard.splice(i,1)[0]);discardPiece(g,c);g.plays--;log(g,`${p.name} recycled a card.`);return;}
 const a:Pending={actor:p.id,card:c,targets:structuredClone(cmd.targets??[]),victim:cmd.victim,destinations:cmd.destinations,wildAs:cmd.wildAs,bonus:cmd.bonus,passed:[],protected:[]};
 requireRule(new Set(a.targets.map(t=>t.card)).size===a.targets.length,'Choose each card only once.');
 if(['bogo','pos-down','lactose-intolerant','untrained-employee'].includes(type)){
  const v=g.players.find(v=>v.id===cmd.victim);requireRule(v,'Choose a player.');
  if(type==='bogo')requireRule(v.hand.length,'That player has no hand cards.');
  if(type==='lactose-intolerant')requireRule(v.drinks.some(d=>!d.protection.some(c=>c.type==='straw')&&d.cards.some(c=>c.type==='milk')),'That player has no unprotected Milk.');
  if(type==='untrained-employee')requireRule(v.drinks.some(d=>d.cards.length&&!complete(d)),'That player has no incomplete drinks.');
 }else if(type==='health-inspector'){
  requireRule(a.targets.length===1,'Choose a topping or flavor on another table.');const t=a.targets[0],{p:v,c:target}=attackable(g,t);
  requireRule(target&&target.type!=='wild-ingredient'&&['Flavor','Topping'].includes(definitions[target.type].category),'Choose a topping or flavor, excluding Wild Ingredient.');
  a.victim=v.id;a.targets=v.drinks.flatMap((d,slot)=>d.cards.filter(x=>x.type===target.type).map(x=>({player:v.id,slot,card:x.uid})));
 }else if(type==='sabobatage'){
  requireRule(a.targets.length===5,'Choose all five ingredients before reactions.');a.targets.forEach(t=>attackable(g,t));
 }else if(type==='sugar-and-ice'||type==='tea-party'){
  requireRule(type==='sugar-and-ice'?a.targets.length===1:a.targets.length>=1&&a.targets.length<=2,'Choose the ingredients to steal.');
  const probe=structuredClone(p.drinks);
  a.targets.forEach((t,i)=>{const {p:v,c}=attackable(g,t);requireRule(v.id!==p.id,'Choose another player’s ingredient.');requireRule(type!=='tea-party'||definitions[c!.type].category==='Tea','Tea Party only steals tea cards.');const copy={...c!};if(copy.type==='wild-ingredient')copy.as=cmd.wildAs;const dest=a.destinations?.[i];if(dest===-1){requireRule(type==='tea-party'&&!probe.some(d=>canPlace(d,copy)),'Place stolen cards when they fit.');}else{requireRule(Number.isInteger(dest)&&dest!>=0&&dest!<7&&canPlace(probe[dest!],copy),'Choose a compatible destination for each stolen ingredient.');probe[dest!].cards.push(copy);}});
 }else fail('Unknown action.');
 removeHand(p,c.uid);if(type!=='pos-down')discardPiece(g,{...c});g.plays--;g.pending=a;g.phase='reaction';log(g,`${p.name} played ${definitions[type].name}. Targets declared; players may react.`);
}
/** Pure transaction: failed commands never mutate the caller's state. */
export function applyCommand(state:Game,actor:string,cmd:Command):Game{
 const g=structuredClone(state);const p=g.players.find(p=>p.id===actor);
 if(cmd.type==='start'){requireRule(actor==='host'&&g.phase==='lobby','Only the host can start the lobby.');requireRule(g.players.length>=2&&g.players.length<=5,'Seat 2–5 players first.');g.target=cmd.target??(g.players.length===5?4:5);requireRule([3,4,5].includes(g.target),'Choose a goal of 3, 4, or 5 drinks.');g.deck=shuffle(g,cards.flatMap(c=>Array.from({length:c.copies},(_,i)=>({uid:`${c.id}-${i}`,type:c.id}))));g.players.forEach(p=>draw(g,p,5));g.phase='draw';log(g,'The shops are open.');return g;}
 requireRule(p,'Join this table from your phone.');requireRule(g.phase!=='lobby'&&g.phase!=='won','This game is not taking turns.');
 if(g.phase==='reaction'){
  const a=g.pending!;
  if(cmd.type==='pass'){requireRule(!a.passed.includes(p.id),'Already ready.');a.passed.push(p.id);if(g.players.every(p=>a.passed.includes(p.id)))resolve(g);return g;}
  requireRule(cmd.type==='counter','Finish reactions before taking another action.');const c=p.hand.find(c=>c.uid===cmd.card);requireRule(c?.type==='customer-loyalty','Choose Customer Loyalty from your hand.');
  const affected=a.victim===p.id||a.targets.some(t=>t.player===p.id);
  if(cmd.counterLast){requireRule(a.chainTarget,'There is no Customer Loyalty to counter.');}else{requireRule(affected&&!a.protected.includes(p.id),'Counter an action against you, or counter the last Customer Loyalty.');a.chainTarget=p.id;}
  const target=a.chainTarget!;a.protected=a.protected.includes(target)?a.protected.filter(id=>id!==target):[...a.protected,target];discardPiece(g,removeHand(p,c.uid));a.passed=[];log(g,`${p.name} played Customer Loyalty.`);return g;
 }
 if(g.phase==='choice'){
  const a=g.pending!;requireRule(cmd.type==='choose'&&p.id===a.victim,'Waiting for the targeted player to choose.');const t=cmd.targets?.[0];requireRule(t&&t.player===p.id,'Choose from your own table.');const {d,c}=attackable(g,t,a.choice==='milk');requireRule(a.choice==='milk'?c?.type==='milk':d.cards.length&&!complete(d),'Choose the required Milk or incomplete drink.');if(d.protection.length)d.protection.splice(0).forEach(c=>discardPiece(g,c));else if(a.choice==='milk')destroy(g,t);else d.cards.splice(0).forEach(c=>discardPiece(g,c));log(g,`${p.name} resolved ${definitions[a.card.type].name}.`);finishPending(g);return g;
 }
 requireRule(g.players[g.active].id===actor,'It is another player’s turn.');
 if(cmd.type==='draw'){requireRule(g.phase==='draw','You already drew this turn.');draw(g,p,score(p)>=2?3:2);g.plays=3;g.phase='play';log(g,`${p.name} drew for their turn.`);return g;}
 requireRule(g.phase==='play','Draw cards to begin your turn.');
 if(cmd.type==='play')play(g,p,cmd);
 else if(cmd.type==='discard'){requireRule(p.hand.length>7,'Only discard to meet the seven-card hand limit.');discardPiece(g,removeHand(p,cmd.card!));log(g,`${p.name} discarded a card.`);}
 else if(cmd.type==='end'){
  requireRule(p.hand.length<=7,'Discard down to seven cards before ending your turn.');let next=(g.active+1)%g.players.length;
  while(g.players[next].skip>0){g.players[next].skip--;const down=g.players[next].delayed.shift();if(down)discardPiece(g,down);log(g,`${g.players[next].name} skips a turn (POS Down).`);next=(next+1)%g.players.length;}
  g.active=next;g.phase='draw';g.plays=0;log(g,`${g.players[next].name} is up.`);
 }else fail('That action is not available now.');
 return g;
}
export type PublicPlayer = Omit<Player,'hand'> & {handCount:number};
export type View = Omit<Game,'players'|'deck'|'rng'> & {players:PublicPlayer[];deckCount:number;hand:Piece[];you?:string;host:boolean;revision:number;canUndo:boolean;undoLabel?:string};
export function project(g:Game,viewer?:string):Omit<View,'revision'|'canUndo'|'undoLabel'>{const {deck,rng,players,...publicState}=structuredClone(g);return {...publicState,players:players.map(({hand,...p})=>({...p,handCount:hand.length})),deckCount:deck.length,hand:players.find(p=>p.id===viewer)?.hand??[],you:viewer==='host'?undefined:viewer,host:viewer==='host'};}
