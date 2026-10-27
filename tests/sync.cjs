const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {resolve}=require('../workspace.js'),manifest=require('../api/manifest.js');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const programSource=html.slice(html.indexOf('const PLAN='),html.indexOf("const STORAGE_KEY="));
const program={};vm.runInNewContext(programSource+';result=PLAN;',program);
const upperB=program.result.sessions.find(session=>session.id==='upper-b');
const firstFor=person=>upperB.blocks[0].items.filter(ex=>!ex.for||ex.for===person);
assert.equal(firstFor('Pierre')[0].id,'smith-incline');
assert.equal(firstFor('Pierre')[0].name,'Développé incliné à la Smith machine');
assert.equal(firstFor('Thomas')[0].id,'chest-incline');
const weightSource=html.match(/function weightFor1RM[^\n]+/)[0],weight={store:{Pierre:{bodyweights:{},bw:''}}};
vm.runInNewContext(weightSource+";added=result=weightFor1RM('Pierre',{loadType:'added'},0,1);plain=weightFor1RM('Pierre',{},0,1);",weight);
assert.equal(weight.added,0);assert.equal(weight.plain,null);
const room='A'.repeat(32),other='B'.repeat(32);
assert.equal(resolve('https://app.test/app/'+room,null),room);
assert.equal(resolve('https://app.test/#espace='+room,other),room);
assert.equal(resolve('https://app.test/app/'+room,other),room);
assert.equal(resolve('https://app.test/app/'+room+'#espace='+other,room),null);
assert.equal(resolve('https://app.test/app/invalid',room),null);
assert.equal(resolve('https://app.test/',null),null);
const headers={},res={setHeader:(k,v)=>headers[k]=v,end:value=>res.body=value};
manifest({url:'/api/manifest?espace='+room},res);let m=JSON.parse(res.body);
assert.equal(resolve('https://app.test'+m.start_url,null),room);assert.equal(m.scope,'/');assert.match(headers['Cache-Control'],/no-store/);
manifest({url:'/api/manifest?espace=bad'},res);assert.equal(res.statusCode,400);
const core={};vm.runInNewContext(fs.readFileSync(require.resolve('../sync-core.js'),'utf8'),{window:core});
const firstKey='4|upper-a|smith-decline|1',entries={
 [firstKey]:{kg:'75',reps:'10'},
 '4|upper-a|smith-decline|2':{kg:'70',reps:''},
 '4|upper-a|smith-decline|3':{kg:'',reps:'8'}
};
assert.deepEqual([...core.NatifSyncCore.autofillSets(entries,firstKey,3)],['4|upper-a|smith-decline|2','4|upper-a|smith-decline|3']);
assert.deepEqual(entries['4|upper-a|smith-decline|2'],{kg:'75',reps:'10'});
assert.deepEqual(entries['4|upper-a|smith-decline|3'],{kg:'75',reps:'10'});
assert.deepEqual([...core.NatifSyncCore.autofillSets(entries,firstKey,3)],[]);
assert.deepEqual([...core.NatifSyncCore.autofillSets(entries,'4|upper-a|smith-decline|2',3)],[]);
const sync=fs.readFileSync(require.resolve('../firebase-sync.js'),'utf8').replace(/^import .*;\n/gm,'');
const fresh=()=>({Thomas:{entries:{},targets:{},done:{},dates:{},bodyweights:{},bw:'',weekCount:12},Pierre:{entries:{},targets:{},done:{},dates:{},bodyweights:{},bw:'',weekCount:12}});
const data=()=>{const d=fresh();d.Thomas.entries.a={kg:'40',reps:'10'};return d;};
const records=Object.entries(core.NatifSyncCore.flatten(data())).map(([path,value])=>({data:()=>({path,value,deleted:false})}));
const snap={size:records.length,metadata:{fromCache:false,hasPendingWrites:false},forEach:cb=>records.forEach(cb)};
function client(uid,fail=false){
 let stored=fresh(),authCallback,listener,readCount=0,writeCount=0,notice='',loaded=false;const events={},elements={};
 const storage=new Map();
 const sandbox={console,URL,URLSearchParams,Set,Map,JSON,Object,Date,Error,Promise,clearTimeout:()=>{},setTimeout:()=>0,
  location:{origin:'https://app.test'},navigator:{onLine:true},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  document:{visibilityState:'visible',getElementById:id=>elements[id]||(elements[id]={dataset:{},addEventListener:()=>{}}),addEventListener:(n,cb)=>events[n]=cb},
  initializeApp:()=>({}),getAuth:()=>({app:{},currentUser:{uid,isAnonymous:true}}),getFirestore:()=>({}),onAuthStateChanged:(a,cb)=>authCallback=cb,
  collection:(db,...parts)=>parts.join('/'),doc:()=>({}),serverTimestamp:()=>0,getDocs:async()=>snap,
  getDocsFromServer:async path=>{assert.equal(path,'rooms/'+room+'/records');readCount++;if(fail)throw Error('offline');return snap;},
  onSnapshot:(ref,opt,cb)=>{listener=cb;return ()=>{};},writeBatch:()=>({set:()=>writeCount++,commit:async()=>{}}),signInAnonymously:async()=>{},toast:()=>{},
  window:{NatifWorkspace:{room,notice:t=>notice=t,ready:()=>loaded=true},NatifSyncCore:core.NatifSyncCore,NatifApp:{fresh,getLegacy:fresh,getData:()=>structuredClone(stored),setData:d=>stored=structuredClone(d),switchRoom:()=>{}},addEventListener:(n,cb)=>events[n]=cb}
 };
 vm.runInNewContext(sync,sandbox);
 return {start:async()=>{authCallback({uid,isAnonymous:true});for(let i=0;i<12;i++)await Promise.resolve();},get data(){return stored;},get readCount(){return readCount;},get writeCount(){return writeCount;},get loaded(){return loaded;},get notice(){return notice;},cached:()=>listener({...snap,metadata:{fromCache:true},forEach:()=>{}}),server:()=>listener(snap),events,sandbox,storage};
}
(async()=>{
 const a=client('chrome-uid'),b=client('iphone-new-uid');await a.start();await b.start();
 assert.deepEqual(a.data,b.data);assert.equal(b.data.Thomas.entries.a.kg,'40');assert.ok(a.loaded&&b.loaded);assert.equal(a.writeCount,0);assert.equal(b.writeCount,0);
 b.cached();assert.equal(b.data.Thomas.entries.a.kg,'40');
 const before=b.readCount;b.events.visibilitychange();for(let i=0;i<12;i++)await Promise.resolve();assert.equal(b.readCount,before+1);
 const c=client('offline',true);await c.start();assert.equal(c.loaded,false);assert.ok(c.notice.includes('Aucune donnée'));assert.equal(c.writeCount,0);
 // An edit survives lifecycle persistence and overlays subsequent server snapshots.
 b.data.Thomas.entries.a.kg='45';b.sandbox.window.NatifCloud.changed();b.events.pagehide();assert.ok(b.storage.get('natif_shared_pending:'+room).includes('45'));b.server();assert.equal(b.data.Thomas.entries.a.kg,'45');
 console.log('PASS: isolated storage, distinct UIDs, manifest launch, server fetch, cache rejection, resume, offline preservation, pending edits; no writes on initial reads.');
})().catch(e=>{console.error(e);process.exitCode=1;});
