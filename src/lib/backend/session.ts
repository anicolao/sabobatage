import type {Firestore} from 'firebase/firestore';
import {optimisticReplay,eventFor,replay,viewFor,type GameEvent,type Intent,type PendingIntent,type Replay} from '../game/events';
import type {View} from '../game/engine';
import {appendIntent,randomId,watchEvents} from './repository';
export type SyncState={view:View;pending:number;connected:boolean;error:string};
export type EventTransport={watch:(receive:(events:GameEvent[],fromCache:boolean)=>void,error:(e:Error)=>void)=>()=>void;append:(item:PendingIntent,known:GameEvent[])=>Promise<GameEvent[]>};
export function firestoreTransport(db:Firestore,code:string):EventTransport{return {watch:(receive,error)=>watchEvents(db,code,receive,error),append:(item,known)=>appendIntent(db,code,item,known)};}
/** UI changes synchronously. The outbox runs independently of input handling. */
export class GameSession {
 private confirmed:GameEvent[]=[];private pending:PendingIntent[]=[];private state:Replay=replay([]);private online=false;private error='';private writing=false;private stopped=false;private stopWatch:()=>void=()=>{};private retry:ReturnType<typeof setTimeout>|undefined;
 constructor(private transport:EventTransport,private uid:string,private table:boolean,private update:(state:SyncState)=>void,private storage?:Pick<Storage,'getItem'|'setItem'>,private cacheKey=''){}
 start(){try{const saved=JSON.parse(this.storage?.getItem(this.cacheKey)||'null');if(saved){replay(saved.confirmed);this.confirmed=saved.confirmed;this.pending=saved.pending??[];}}catch{/* Invalid/old cache is replaced by stream replay. */}this.emit();this.stopWatch=this.transport.watch((events,fromCache)=>{if(events.length>=this.confirmed.length){this.confirmed=events;if(!fromCache&&!events.length)this.error='Table not found. Check the room code.';}this.online=!fromCache;this.emit();void this.flush();},error=>{this.online=false;this.error=error.message;this.emit();});void this.flush();return()=>this.stop();}
 send(intent:Intent){const item={id:randomId(),actorUid:this.uid,intent};const current=optimisticReplay(this.confirmed,this.pending);replay([...current.events,eventFor(current.events,this.uid,item.id,intent)]);this.error='';this.pending.push(item);this.emit();void this.flush();}
 undo(){const target=this.state.checkpoints.at(-1);if(!target)throw new Error('There is no move to undo.');this.send({type:'action/undone',targetId:target.id});}
 private emit(){try{const next=optimisticReplay(this.confirmed,this.pending);this.state=next.state;this.pending=next.pending;if(next.rejected.length)this.error=`A move changed during sync: ${next.rejected[0].message}`;try{this.storage?.setItem(this.cacheKey,JSON.stringify({confirmed:this.confirmed,pending:this.pending}));}catch{/* Cache failures do not prevent play. */}}catch(error){this.error=(error as Error).message;}this.update({view:viewFor(this.state,this.uid,this.table),pending:this.pending.length,connected:this.online,error:this.error});}
 private async flush(){if(this.writing||this.stopped)return;this.writing=true;
  try{while(this.pending.length&&!this.stopped){const item=this.pending[0];try{const events=await this.transport.append(item,this.confirmed);if(events.length>=this.confirmed.length)this.confirmed=events;this.pending=this.pending.filter(p=>p.id!==item.id);this.online=true;if(this.error.startsWith('Connection interrupted'))this.error='';this.emit();}catch(error){const code=(error as {code?:string}).code;if(code==='unavailable'||code==='deadline-exceeded'||code==='aborted'){this.online=false;this.error='Connection interrupted. Your moves are queued on this device.';this.emit();this.retry=setTimeout(()=>void this.flush(),2000);break;}this.pending=this.pending.filter(p=>p.id!==item.id);this.error=`Move could not sync: ${(error as Error).message}`;this.emit();}}}finally{this.writing=false;}
 }
 stop(){this.stopped=true;this.stopWatch();clearTimeout(this.retry);}
}
