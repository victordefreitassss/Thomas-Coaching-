import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth,signInAnonymously,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {getFirestore,collection,doc,writeBatch,onSnapshot,getDocs,getDocsFromServer,serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
const config={apiKey:'AIzaSyBW68ZDxdYkNgh3AkH3rAPgWJgvM4tm9jI',authDomain:'natif-body-coaching.firebaseapp.com',projectId:'natif-body-coaching',storageBucket:'natif-body-coaching.firebasestorage.app',messagingSenderId:'645511280100',appId:'1:645511280100:web:dd9728b29c787afd2f83f1'};
const auth=getAuth(initializeApp(config)),db=getFirestore(auth.app),app=window.NatifApp,core=window.NatifSyncCore;
const status=document.getElementById('cloud-status'),migrate=document.getElementById('cloud-import'),retry=document.getElementById('cloud-retry'),share=document.getElementById('cloud-share');
let room=null,userId=null,unsubscribe=null,ready=false,baseline={},pending={},timer=null,saving=false,epoch=0,legacy={},known=new Set(),initializing=false,hydrated=false;
room=window.NatifWorkspace.room;
const queueKey=()=>`natif_shared_pending:${room}`,migrationKey=()=>`natif_shared_migrated:${room}`;
function message(text){status.textContent=text;}
function problem(text){message(text);window.NatifWorkspace.notice(text,true);}
function preserveLocal(){try{const data=app.getData(),flat=core.flatten(data);const meaningful=Object.entries(flat).some(([path,value])=>!['bw','weekCount'].includes(JSON.parse(path)[1])&&value!=='""');if(meaningful){const raw=JSON.stringify(data);if(raw!==localStorage.getItem(`natif_before_sync:${room}`))localStorage.setItem(`natif_recovery:${room}:${Date.now()}`,raw);localStorage.setItem(`natif_before_sync:${room}`,raw);}}catch{}}

function persistQueue(){if(room)try{localStorage.setItem(queueKey(),JSON.stringify(pending));}catch{message('Stockage local indisponible : exportez un JSON avant de fermer la page.');}}
function collect(){if(!room)return;const after=core.flatten(app.getData());Object.assign(pending,core.diff(baseline,after));baseline=after;persistQueue();clearTimeout(timer);timer=setTimeout(flush,600);}
window.NatifCloud={changed:collect};
function recordId(path){return encodeURIComponent(path);}
async function flush(){
 if(!room||!userId||!ready||saving||!navigator.onLine)return;
 const target=room,token=epoch;
 if(!Object.keys(pending).length){message('Données synchronisées : Thomas et Pierre partagent les mêmes carnets.');retry.hidden=true;return;}
 saving=true;message('Enregistrement dans Firebase…');
 try{
  while(token===epoch&&Object.keys(pending).length){
   const chunk=Object.entries(pending).slice(0,400),batch=writeBatch(db);
   for(const [path,value] of chunk){if(path.length>300||value.value.length>1000)throw Error('record-too-large');batch.set(doc(db,'rooms',target,'records',recordId(path)),{path,...value,updatedAt:serverTimestamp()});}
   await batch.commit();if(token!==epoch)return;
   for(const [path,value] of chunk)if(pending[path]===value)delete pending[path];persistQueue();
  }
  if(token===epoch){message('Données synchronisées : Thomas et Pierre partagent les mêmes carnets.');retry.hidden=true;}
 }catch(error){if(token===epoch){problem(error.code==='permission-denied'?'Accès à l’espace privé refusé. Les modifications restent sur cet appareil.':'Synchronisation en attente. Les modifications sont conservées sur cet appareil.');retry.hidden=false;}}
 finally{saving=false;if(token!==epoch&&room&&ready)flush();}
}
function mergeLegacy(data){
 const current=core.flatten(data);let count=0;
 for(const [path,value] of Object.entries(legacy)){
  const parts=JSON.parse(path);
  if(parts[1]==='bw'&&value==='""')continue;
  if(parts[1]==='weekCount'){const max=Math.max(JSON.parse(value),JSON.parse(current[path]||'12'));core.apply(data,path,JSON.stringify(max));continue;}
  if(!known.has(path)&&!Object.hasOwn(pending,path)&&(current[path]===undefined||current[path]==='""')){core.apply(data,path,value);count++;}
 }
 return count;
}
function acceptSnapshot(snap,token){
 if(token!==epoch||snap.metadata.fromCache||snap.metadata.hasPendingWrites)return;
 const data=app.fresh();known=new Set();
 try{snap.forEach(item=>{const r=item.data();known.add(r.path);core.apply(data,r.path,r.value,r.deleted);});for(const [path,r] of Object.entries(pending))core.apply(data,path,r.value,r.deleted);}
 catch{problem('Sauvegarde incompatible. Exportez les données avant de réessayer.');return;}
 baseline=core.flatten(data);
 if(!hydrated){mergeLegacy(data);hydrated=true;}
 preserveLocal();app.setData(data);ready=true;retry.hidden=true;window.NatifWorkspace.ready();
 status.dataset.project=config.projectId;status.dataset.collection='rooms/records';status.dataset.serverRecords=String(snap.size);status.dataset.serverRead=new Date().toISOString();
 collect();try{localStorage.setItem(migrationKey(),'1');}catch{}flush();
}
async function subscribe(){
 if(!room||!userId)return;
 unsubscribe?.();ready=false;const token=++epoch,target=room;
 message('Chargement des carnets partagés…');
 try{
  // Explicit server read: an empty cache must never become an empty journal.
  const reference=collection(db,'rooms',target,'records');
  const snap=await getDocsFromServer(reference);if(token!==epoch)return;
  acceptSnapshot(snap,token);
  unsubscribe=onSnapshot(reference,{includeMetadataChanges:true},current=>acceptSnapshot(current,token),error=>{if(token===epoch)problem(error.code==='permission-denied'?'Accès aux carnets refusé. Vérifiez votre lien privé. Les données locales sont conservées.':'Connexion interrompue. Les modifications locales attendent leur synchronisation.');});
 }catch(error){if(token===epoch)problem(error.code==='permission-denied'?'Accès aux carnets refusé. Vérifiez votre lien privé. Les données locales sont conservées.':'Impossible de charger les carnets en ligne. Aucune donnée locale n’a été effacée. Réessayez avec Internet.');}
}
async function initialize(){
 if(!room){message('Ouvrez le lien privé de votre espace partagé pour retrouver les données de Thomas et Pierre.');return;}
 if(initializing)return;initializing=true;message('Connexion automatique à votre espace privé…');
 try{if(!auth.currentUser)await signInAnonymously(auth);else await start(auth.currentUser);}
 catch(error){problem(error.code==='auth/operation-not-allowed'?'L’accès automatique doit être activé dans Firebase.':'Connexion automatique indisponible. Les données locales restent conservées.');retry.hidden=false;}
 finally{initializing=false;}
}
async function start(user){
 epoch++;const token=epoch;clearTimeout(timer);unsubscribe?.();ready=false;userId=user.uid;
 legacy=core.flatten(app.getLegacy());
 // Preserve data from a previous signed-in private account if one exists.
 if(!user.isAnonymous){try{const previous=await getDocs(collection(db,'users',user.uid,'records'));if(token!==epoch)return;previous.forEach(item=>{const r=item.data();if(!r.deleted)legacy[r.path]=r.value;});}catch{}}
 if(token!==epoch)return;
 app.switchRoom(room);baseline=core.flatten(app.getData());pending={};hydrated=false;
 let migrated=false;try{migrated=localStorage.getItem(migrationKey())==='1';}catch{}
 legacy=migrated?baseline:{...legacy,...baseline};
 try{pending=JSON.parse(localStorage.getItem(queueKey())||'{}');}catch{}
 share.hidden=false;migrate.hidden=false;subscribe();
}
retry.addEventListener('click',()=>{if(ready)flush();else if(userId)subscribe();else initialize();});
migrate.addEventListener('click',()=>{
 if(!ready){message('Attendez le chargement des carnets avant de récupérer les anciennes données.');return;}
 if(!confirm('Ajouter les anciennes données de cet appareil aux carnets partagés ? Les valeurs déjà présentes dans Firebase seront conservées.'))return;
 legacy={...legacy,...core.flatten(app.getLegacy())};const data=app.getData();const count=mergeLegacy(data);app.setData(data);collect();message(`${count} valeurs récupérées. Synchronisation en cours…`);
});
share.addEventListener('click',async()=>{if(!room){window.alert('Ouvrez le lien privé une première fois sur cet appareil pour rejoindre les carnets partagés.');return;}const link=location.origin+'/app/'+room;try{await navigator.clipboard.writeText(link);message('Lien privé copié : transmettez-le à l’autre utilisateur.');toast('Lien de partage copié.');}catch{window.prompt('Copiez ce lien privé pour l’autre utilisateur :',link);}});
onAuthStateChanged(auth,user=>{if(!room)return;if(user)start(user);else initialize();});
window.addEventListener('online',resume);
window.addEventListener('offline',()=>problem(room?'Hors connexion : modifications conservées sur cet appareil, en attente de synchronisation.':'Ouvrez votre lien privé avec une connexion Internet.'));
function resume(){if(!room)return;if(userId){collect();subscribe();}else initialize();navigator.serviceWorker?.getRegistration().then(reg=>reg?.update()).catch(()=>{});}
window.addEventListener('pageshow',event=>{if(event.persisted)resume();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resume();else{collect();persistQueue();}});
window.addEventListener('pagehide',()=>{collect();persistQueue();});
if(!room)message('Ouvrez le lien privé de votre espace partagé pour retrouver les données de Thomas et Pierre.');

document.addEventListener('click',event=>{if(event.target.closest('[data-share-space]'))share.click();});
