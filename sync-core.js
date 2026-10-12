/* Small pure helpers: one Firestore document per editable scalar. */
(function(root){
  const people=['Thomas','Pierre'], maps=['entries','targets','done','dates','bodyweights'];
  function flatten(data){
    const out={};
    for(const p of people){
      const d=data[p];
      for(const k of ['bw','weekCount'])out[JSON.stringify([p,k])]=JSON.stringify(d[k]);
      for(const m of maps)for(const [key,value] of Object.entries(d[m]||{})){
        if(m==='entries')for(const field of ['kg','reps'])if(value[field]!==undefined)out[JSON.stringify([p,m,key,field])]=JSON.stringify(value[field]);
        if(m!=='entries')out[JSON.stringify([p,m,key])]=JSON.stringify(value);
      }
    }
    return out;
  }
  function apply(data,path,value,deleted=false){
    const parts=JSON.parse(path);if(!Array.isArray(parts)||!people.includes(parts[0]))throw Error('Invalid record');
    const [p,m,key,field]=parts;
    if(['bw','weekCount'].includes(m)&&parts.length===2){if(!deleted)data[p][m]=JSON.parse(value);return;}
    if(!maps.includes(m)||typeof key!=='string'||key.length>200||['__proto__','constructor','prototype'].includes(key))throw Error('Invalid record');
    if(m==='entries'){
      if(parts.length!==4||!['kg','reps'].includes(field))throw Error('Invalid entry');
      if(deleted){if(data[p].entries[key])delete data[p].entries[key][field];}
      else {data[p].entries[key]??={};data[p].entries[key][field]=JSON.parse(value);}
    }else {if(parts.length!==3)throw Error('Invalid path');if(deleted)delete data[p][m][key];else data[p][m][key]=JSON.parse(value);}
  }
  function diff(before,after){const out={};for(const path of new Set([...Object.keys(before),...Object.keys(after)]))if(before[path]!==after[path])out[path]={value:after[path]??'null',deleted:after[path]===undefined};return out;}
  const api={flatten,apply,diff};if(typeof module!=='undefined')module.exports=api;else root.NatifSyncCore=api;
})(typeof window!=='undefined'?window:globalThis);
