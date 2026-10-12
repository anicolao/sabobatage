import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInAnonymously} from 'firebase/auth';
import {initializeFirestore,connectFirestoreEmulator,type FirestoreSettings} from 'firebase/firestore';
export function shouldUseFetchStreams(browser:Pick<Navigator,'platform'|'maxTouchPoints'|'userAgent'>|undefined){if(!browser)return true;return !(/iPad|iPhone|iPod/.test(browser.userAgent)||(browser.platform==='MacIntel'&&browser.maxTouchPoints>1)||/^((?!chrome|android|crios|fxios).)*safari/i.test(browser.userAgent));}
async function connect(){const env=import.meta.env;if(!env.VITE_FIREBASE_API_KEY||!env.VITE_FIREBASE_PROJECT_ID||!env.VITE_FIREBASE_APP_ID)throw new Error('Game sync is not configured. See the README for local Firebase emulator setup.');
 const app=initializeApp({apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,appId:env.VITE_FIREBASE_APP_ID});
 const auth=getAuth(app);const useFetchStreams=shouldUseFetchStreams(typeof navigator==='undefined'?undefined:navigator);
 const settings:FirestoreSettings&{useFetchStreams:boolean}={useFetchStreams,...(!useFetchStreams?{experimentalForceLongPolling:true}:{})};const db=initializeFirestore(app,settings);
 if(env.VITE_USE_FIREBASE_EMULATORS==='true'){const host=env.VITE_FIREBASE_EMULATOR_HOST||location.hostname;connectAuthEmulator(auth,`http://${host}:${env.VITE_FIREBASE_AUTH_EMULATOR_PORT||9295}`,{disableWarnings:true});connectFirestoreEmulator(db,host,Number(env.VITE_FIRESTORE_EMULATOR_PORT||8195));}
 await auth.authStateReady();if(!auth.currentUser)await signInAnonymously(auth);return {auth,db,uid:auth.currentUser!.uid};
}
let connection:ReturnType<typeof connect>|undefined;
export function connectFirebase(){return connection??=connect();}
