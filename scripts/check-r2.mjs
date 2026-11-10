import {api} from '../server/api.mjs';
import {getStorage} from '../server/storage.mjs';
const store=getStorage({...process.env,GIFT_STORAGE:'r2'});
const origin='https://storage-check.invalid';
const gift={occasion:'birthday',recipient:'Storage verification',sender:'TohfaNote',message:'Temporary storage connection check; this record is deleted immediately.',photos:[],theme:'blush',music:'none',timezone:'UTC',opensAt:null};
let id,key;
try{
  const create=await api(new Request(origin+'/api/gifts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(gift)}),store);
  const result=await create.json();if(create.status!==201)throw Error(result.error);({id,key}=result);
  const read=await api(new Request(`${origin}/api/gifts/${id}`),store);if(read.status!==200)throw Error('Saved gift could not be read.');
  const editable=await api(new Request(`${origin}/api/gifts/${id}/manage`,{headers:{Authorization:`Bearer ${key}`}}),store);if(editable.status!==200)throw Error('Management read failed.');
  const update=await api(new Request(`${origin}/api/gifts/${id}/manage`,{method:'PUT',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({...gift,message:'Updated temporary storage check record.',revision:1})}),store);if(update.status!==200)throw Error('Conditional update failed.');
  await store.delete(id);
  if(await store.get(id))throw Error('Deleted gift still exists.');
  console.log('R2 verified: create, read, protected management, conditional update and delete.');
}finally{if(id)await store.delete(id);}
