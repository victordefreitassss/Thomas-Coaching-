import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {getFirestore,collection,doc,writeBatch,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
const config={apiKey:'AIzaSyBW68ZDxdYkNgh3AkH3rAPgWJgvM4tm9jI',authDomain:'natif-body-coaching.firebaseapp.com',projectId:'natif-body-coaching',storageBucket:'natif-body-coaching.firebasestorage.app',messagingSenderId:'645511280100',appId:'1:645511280100:web:dd9728b29c787afd2f83f1'};
const auth=getAuth(initializeApp(config)),db=getFirestore(auth.app),app=window.NatifApp,core=window.NatifSyncCore;
const status=document.getElementById('cloud-status'),login=document.getElementById('cloud-login'),logout=document.getElementById('cloud-logout'),migrate=document.getElementById('cloud-import'),retry=document.getElementById('cloud-retry');
let uid=null,unsubscribe=null,ready=false,baseline={},pending={},timer=null,saving=false,epoch=0;
function message(text){status.textContent=text;}
function persistQueue(){if(uid)try{localStorage.setItem('natif_cloud_pending:'+uid,JSON.stringify(pending));}catch{message('Stockage local indisponible : exportez un JSON avant de fermer la page.');}}
function collect(){if(!uid)return;const after=core.flatten(app.getData());Object.assign(pending,core.diff(baseline,after));baseline=after;persistQueue();clearTimeout(timer);timer=setTimeout(flush,600);}
window.NatifCloud={changed:collect};
function recordId(path){return encodeURIComponent(path);}
async function flush(){
 if(!uid||!ready||saving||!navigator.onLine)return;
 const owner=uid,token=epoch;
 if(!Object.keys(pending).length){message('Données synchronisées dans votre compte Google.');retry.hidden=true;return;}
 saving=true;message('Enregistrement dans Firebase…');
 try{
  while(token===epoch&&Object.keys(pending).length){
   const chunk=Object.entries(pending).slice(0,400),batch=writeBatch(db);
   for(const [path,value] of chunk){if(path.length>300||value.value.length>1000)throw Error('record-too-large');batch.set(doc(db,'users',owner,'records',recordId(path)),{path,...value,updatedAt:serverTimestamp()});}
   await batch.commit();if(token!==epoch)return;
   for(const [path,value] of chunk)if(pending[path]===value)delete pending[path];persistQueue();
  }
  if(token===epoch){message('Données synchronisées dans votre compte Google.');retry.hidden=true;}
 }catch(error){if(token===epoch){message(error.code==='permission-denied'?'Accès Firebase refusé. Vos modifications sont conservées sur cet appareil.':'Synchronisation en attente. Vos modifications sont conservées sur cet appareil.');retry.hidden=false;}}
 finally{saving=false;if(token!==epoch&&uid&&ready)flush();}
}
function subscribe(){
 if(!uid)return;unsubscribe?.();ready=false;const token=epoch,owner=uid;message('Chargement de votre sauvegarde Firebase…');
 unsubscribe=onSnapshot(collection(db,'users',owner,'records'),{includeMetadataChanges:true},snap=>{
  if(token!==epoch||snap.metadata.fromCache)return;
  const data=app.fresh();
  try{snap.forEach(item=>{const r=item.data();core.apply(data,r.path,r.value,r.deleted);});for(const [path,r] of Object.entries(pending))core.apply(data,path,r.value,r.deleted);}
  catch{message('Sauvegarde incompatible. Exportez les données avant de réessayer.');retry.hidden=false;return;}
  app.setData(data);baseline=core.flatten(data);ready=true;retry.hidden=true;flush();
 },()=>{if(token===epoch){message('Firebase est indisponible. Les modifications restent enregistrées sur cet appareil.');retry.hidden=false;}});
}
login.disabled=false;
login.addEventListener('click',async()=>{login.disabled=true;try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider);}catch(error){message(error.code==='auth/unauthorized-domain'?'Ce domaine doit être autorisé dans Firebase. Ouvrez thomascoaching.vercel.app.':error.code==='auth/popup-blocked'?'Autorisez la fenêtre Google dans votre navigateur puis réessayez.':'Connexion non terminée. Les données locales sont conservées.');}finally{login.disabled=false;}});
logout.addEventListener('click',async()=>{collect();if(Object.keys(pending).length&&!confirm('Des modifications attendent leur synchronisation. Elles seront conservées sur cet appareil et envoyées lors de votre prochaine connexion. Se déconnecter ?'))return;await signOut(auth);});
retry.addEventListener('click',()=>{if(ready)flush();else subscribe();});
migrate.addEventListener('click',()=>{
 if(!ready){message('Attendez le chargement de Firebase avant de récupérer les anciennes données.');return;}
 const old=core.flatten(app.getLegacy()),data=app.getData(),current=core.flatten(data);let count=0;
 if(!confirm('Ajouter les anciennes données de cet appareil à ce compte Google ? Les valeurs déjà présentes dans Firebase seront conservées.'))return;
 for(const [path,value] of Object.entries(old)){const parts=JSON.parse(path);if(parts[1]==='bw'&&value==='""')continue;if(parts[1]==='weekCount'){const max=Math.max(JSON.parse(value),JSON.parse(current[path]||'12'));core.apply(data,path,JSON.stringify(max));continue;}if(current[path]===undefined||current[path]==='""'){core.apply(data,path,value);count++;}}
 app.setData(data);collect();message(`${count} valeurs récupérées. Synchronisation en cours…`);
});
onAuthStateChanged(auth,user=>{
 epoch++;clearTimeout(timer);unsubscribe?.();unsubscribe=null;ready=false;uid=user?.uid??null;pending={};
 app.switchAccount(uid);baseline=core.flatten(app.getData());
 login.hidden=!!uid;logout.hidden=!uid;migrate.hidden=!uid;retry.hidden=true;
 if(!uid){message('Mode local. Connectez-vous avec Google pour sauvegarder et retrouver vos données sur plusieurs appareils.');return;}
 try{pending=JSON.parse(localStorage.getItem('natif_cloud_pending:'+uid)||'{}');}catch{pending={};}
 subscribe();
});
window.addEventListener('online',()=>{if(ready)flush();else subscribe();});
window.addEventListener('offline',()=>message(uid?'Hors connexion : modifications conservées sur cet appareil, en attente de synchronisation.':'Mode local hors connexion.'));
window.addEventListener('pagehide',persistQueue);
