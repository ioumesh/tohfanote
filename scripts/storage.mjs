import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
export function fileStore(directory=process.env.DATA_DIR||'data'){
 const root=resolve(directory);const locks=new Map();
 const digest=text=>createHash('sha256').update(text).digest('hex');
 const path=id=>{if(!/^[a-f0-9]{48}$/.test(id))throw Error('Invalid storage ID');return join(root,`${id}.json`);};
 return {
 async get(id){try{const text=await readFile(path(id),'utf8');return {value:JSON.parse(text),etag:digest(text)};}catch(e){if(e.code==='ENOENT')return null;throw e;}},
 async put(id,value,etag){const previous=locks.get(id)||Promise.resolve();let release;const next=new Promise(r=>release=r);locks.set(id,next);await previous;try{await mkdir(root,{recursive:true,mode:0o700});if(etag){let old;try{old=await readFile(path(id),'utf8');}catch(error){if(error.code==='ENOENT')return false;throw error;}if(digest(old)!==etag)return false;}const tmp=path(id)+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(value),{mode:0o600});await rename(tmp,path(id));return true;}finally{release();if(locks.get(id)===next)locks.delete(id);}},
 async delete(id){await unlink(path(id));}
 };
}
