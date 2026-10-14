import { addPlayer, applyCommand, emptyGame, project, type Game, type Command, type View } from './engine';
export const SCHEMA_VERSION=1;
export const REDUCER_VERSION=1;
export type Intent = {type:'game/created';seed:number}|{type:'player/joined';name:string}|{type:'game/command';command:Command}|{type:'action/undone';targetId:string};
export type GameEvent = {id:string;actorUid:string;sequence:number;schemaVersion:1;reducerVersion:1;intent:Intent};
export type Checkpoint = {id:string;actorUid:string;label:string;before:Game};
export type Replay = {game:Game;owner:string;revision:number;checkpoints:Checkpoint[]};
function requireEvent(ok:unknown,message:string):asserts ok {if(!ok)throw new Error(message);}
export function replay(events:readonly GameEvent[]):Replay {
 const result:Replay={game:emptyGame(),owner:'',revision:0,checkpoints:[]};const seen=new Set<string>();
 for(const event of [...events].sort((a,b)=>a.sequence-b.sequence)){
  requireEvent(event.schemaVersion===SCHEMA_VERSION&&event.reducerVersion===REDUCER_VERSION,'This game uses a different rules version. Refresh the app.');
  requireEvent(event.sequence===result.revision+1,'The event stream has a gap or conflicting sequence.');
  requireEvent(!seen.has(event.id),'Duplicate event identity.');seen.add(event.id);
  const {intent,actorUid}=event;
  if(intent.type==='game/created'){
   requireEvent(event.sequence===1&&Number.isInteger(intent.seed),'Invalid game creation event.');result.owner=actorUid;result.game=emptyGame(intent.seed);
  }else{
   requireEvent(result.owner,'The game creation event is missing.');
   if(intent.type==='player/joined'){
    requireEvent(typeof intent.name==='string'&&intent.name.trim().length>0&&intent.name.length<=32,'Enter a shop name (up to 32 characters).');
    addPlayer(result.game,actorUid,intent.name.trim());result.checkpoints=[];
   }else if(intent.type==='action/undone'){
    const checkpoint=result.checkpoints.at(-1);
    requireEvent(checkpoint&&checkpoint.id===intent.targetId,'That move can no longer be undone.');
    requireEvent(checkpoint.actorUid===actorUid||result.owner===actorUid,'Only the last actor or host can undo this move.');
    result.game=structuredClone(checkpoint.before);result.checkpoints.pop();
   }else if(intent.type==='game/command'){
    const cmd=intent.command;
    requireEvent(cmd.type!=='start'||actorUid===result.owner,'Only the host can start the game.');
    const before=structuredClone(result.game);
    result.game=applyCommand(result.game,cmd.type==='start'?'host':actorUid,cmd);
    // A draw/shuffle/random steal reveals hidden information. End-of-turn and
    // setup are also barriers, matching Pantheon's replay-local undo history.
    const disclosed=before.deck.length!==result.game.deck.length||before.rng!==result.game.rng||
      (before.pending?.card.type==='bogo'&&before.phase==='reaction'&&result.game.phase!=='reaction'&&before.players.some((p,i)=>p.hand.length!==result.game.players[i].hand.length));
    if(disclosed||cmd.type==='start'||cmd.type==='end'||cmd.type==='draw')result.checkpoints=[];
    else result.checkpoints.push({id:event.id,actorUid,label:cmd.type,before});
   }else throw new Error('Unknown event type.');
  }
  result.revision=event.sequence;
 }
 return result;
}
export function eventFor(events:readonly GameEvent[],actorUid:string,id:string,intent:Intent):GameEvent {return {id,actorUid,sequence:events.length+1,schemaVersion:SCHEMA_VERSION,reducerVersion:REDUCER_VERSION,intent};}
export function viewFor(state:Replay,uid:string,table=false):View {
 const last=state.checkpoints.at(-1);return {...project(state.game,table?undefined:uid),host:uid===state.owner,revision:state.revision,canUndo:!!last&&(last.actorUid===uid||state.owner===uid),undoLabel:last?.label};
}
export type PendingIntent={id:string;actorUid:string;intent:Intent};
/** Rebase the optimistic tail over an immutable confirmed prefix. */
export function optimisticReplay(confirmed:readonly GameEvent[],pending:readonly PendingIntent[]){
 const events=[...confirmed];const kept:PendingIntent[]=[];const rejected:{id:string;message:string}[]=[];let state=replay(events);
 for(const item of pending){if(confirmed.some(e=>e.id===item.id))continue;
  const event=eventFor(events,item.actorUid,item.id,item.intent);
  try{state=replay([...events,event]);events.push(event);kept.push(item);}catch(error){rejected.push({id:item.id,message:(error as Error).message});}
 }
 return {state,events,pending:kept,rejected};
}
