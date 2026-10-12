/** Deterministic, development-only visual fixtures. Never connected to Firestore. */
import { cards } from './cards';
import { addPlayer, applyCommand, emptyGame, project, type Command, type Game, type Piece, type View } from './engine';
export function previewSession(scenario:string,table:boolean,update:(view:View)=>void){
 let game=emptyGame(20261012),revision=0;
 const history:Game[]=[];
 for(const [i,name] of ['Peach Please','Taro & Co.','Milk Moon','Tea Time','Pearl Club'].entries())addPlayer(game,`preview-${i}`,name);
 const inventory=cards.flatMap(c=>Array.from({length:c.copies},(_,i)=>({uid:`${c.id}-${i}`,type:c.id})));
 const take=(type:string):Piece=>inventory.splice(inventory.findIndex(c=>c.type===type),1)[0];
 for(const [i,p] of game.players.entries()){p.drinks[0].cards=['black-tea','milk'].map(take);p.drinks[1].cards=['green-tea',i===4?'passion-fruit':'peach','boba'].map(take);p.drinks[2].cards=(i===4?['black-tea','oat-milk']:['taro','oat-milk']).map(take);}
 game.players[0].hand=['boba','straw','sabobatage','5-star-review','sugar-and-ice','tea-party','recycle'].map(take);
 for(const p of game.players.slice(1))p.hand=[take('customer-loyalty'),...inventory.splice(0,3)];
 game.discard=[take('health-inspector'),take('pudding'),take('lactose-intolerant')];game.deck=inventory;game.phase='play';game.plays=3;
 if(scenario==='overflow')game.players[0].hand.push(...game.deck.splice(0,7));
 if(scenario==='milk-choice'){
  game.active=1;game.players[1].hand.push(take('lactose-intolerant'));
  game=applyCommand(game,'preview-1',{type:'play',card:game.players[1].hand.at(-1)!.uid,victim:'preview-0'});
  for(const p of game.players)game=applyCommand(game,p.id,{type:'pass'});
 }
 if(scenario==='reaction')game=applyCommand(game,'preview-0',{type:'play',card:game.players[0].hand.find(c=>c.type==='sabobatage')!.uid,targets:game.players.map(p=>({player:p.id,slot:0,card:p.drinks[0].cards[0].uid}))});
 const emit=()=>update({...project(game,table?undefined:'preview-0'),host:table,revision:revision++,canUndo:history.length>0,undoLabel:'move'});
 emit();
 return {command(cmd:Command|{type:'undo'}){if(cmd.type==='undo'){const previous=history.pop();if(previous)game=previous;}else{const before=game;game=applyCommand(game,'preview-0',cmd);if(before.deck.length!==game.deck.length||before.rng!==game.rng||cmd.type==='end')history.length=0;else history.push(before);}emit();}};
}
