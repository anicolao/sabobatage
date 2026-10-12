import {collection,doc,getDocFromServer,onSnapshot,orderBy,query,runTransaction,serverTimestamp,type Firestore} from 'firebase/firestore';
import {eventFor,replay,type GameEvent,type PendingIntent} from '../game/events';
export function randomId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');}
function canonical(value:unknown):string {if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;if(value&&typeof value==='object')return `{${Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;return JSON.stringify(value);}
export function roomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>chars[b%chars.length]).join('');}
export function validateCode(code:string){if(!/^[A-Z2-9]{6}$/.test(code))throw new Error('Enter a six-character room code.');return code;}
export async function createRoom(db:Firestore,uid:string){const code=roomCode();const event=eventFor([],uid,randomId(),{type:'game/created',seed:crypto.getRandomValues(new Uint32Array(1))[0]});const ref=doc(db,'games',code);
 await runTransaction(db,async tx=>{if((await tx.get(ref)).exists())throw new Error('That room code was just taken. Try creating another table.');tx.set(ref,{owner:uid,players:[],revision:1});tx.set(doc(ref,'events','1'),{...event,createdAt:serverTimestamp()});});return code;
}
/** Client-side transaction. Firestore stores/serializes events, never game state. */
export async function appendIntent(db:Firestore,code:string,item:PendingIntent,cached:readonly GameEvent[]=[]):Promise<GameEvent[]>{
 validateCode(code);const ref=doc(db,'games',code);
 let observedRevision=-1;
 for(let attempt=0;attempt<5;attempt++){
 try{return await runTransaction(db,async tx=>{
  const snapshot=await tx.get(ref);if(!snapshot.exists())throw new Error('Table not found. Check the room code.');const metadata=snapshot.data();
  observedRevision=metadata.revision;
  const prefix=cached.length<=metadata.revision&&cached[0]?.actorUid===metadata.owner?[...cached]:[];
  const missing=await Promise.all(Array.from({length:metadata.revision-prefix.length},(_,i)=>tx.get(doc(ref,'events',String(prefix.length+i+1)))));
  const events=[...prefix,...missing.map(s=>s.data() as GameEvent)];
  const acknowledged=events.find(e=>e.id===item.id);if(acknowledged){if(acknowledged.actorUid!==item.actorUid||canonical(acknowledged.intent)!==canonical(item.intent))throw new Error('Event identity collision.');return events;}
  const event=eventFor(events,item.actorUid,item.id,item.intent);const next=replay([...events,event]);
  tx.update(ref,{revision:event.sequence,players:next.game.players.map(p=>p.id)});
  tx.set(doc(ref,'events',String(event.sequence)),{...event,createdAt:serverTimestamp()});return [...events,event];
 });}catch(error){
  // Pantheon's reconciliation pattern: a racing append can fail the rule
  // check before the SDK retries. Retry only after a confirmed head change.
  if((error as {code?:string}).code!=='permission-denied')throw error;
  const current=await getDocFromServer(ref);
  if(!current.exists()||current.data().revision<=observedRevision)throw error;
 }
 }
 throw new Error('The table is busy. Please try that move again.');
}
export function watchEvents(db:Firestore,code:string,onEvents:(events:GameEvent[],fromCache:boolean)=>void,onError:(error:Error)=>void){validateCode(code);return onSnapshot(query(collection(db,'games',code,'events'),orderBy('sequence')),{includeMetadataChanges:true},snapshot=>{
 if(snapshot.metadata.hasPendingWrites)return;
 onEvents(snapshot.docs.map(d=>d.data() as GameEvent),snapshot.metadata.fromCache);
 },onError);}
