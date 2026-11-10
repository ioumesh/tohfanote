import {mkdir,readFile,writeFile,rename,unlink,readdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {recordKey,recordId} from '../server/records.mjs';
export function fileStore(directory=process.env.DATA_DIR||'data'){
 const root=resolve(directory),locks=new Map();
 const digest=text=>createHash('sha256').update(text).digest('hex');
 const path=id=>{const key=recordKey(id);return join(root,key.startsWith('gifts/')?key.slice(6):key);};
 return {kind:'local',
 async get(id){try{const text=await readFile(path(id),'utf8');return {value:JSON.parse(text),etag:digest(text)};}catch(e){if(e.code==='ENOENT')return null;throw e;}},
 async put(id,value,etag){const previous=locks.get(id)||Promise.resolve();let release;const next=new Promise(r=>release=r);locks.set(id,next);await previous;try{let old;try{old=await readFile(path(id),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}if(etag?(!old||digest(old)!==etag):old!==undefined)return false;await mkdir(dirname(path(id)),{recursive:true,mode:0o700});const tmp=path(id)+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(value),{mode:0o600});await rename(tmp,path(id));return true;}finally{release();if(locks.get(id)===next)locks.delete(id);}},
 async delete(id){try{await unlink(path(id));}catch(e){if(e.code!=='ENOENT')throw e;}},
 async list(prefix='',cursor='',limit=100){const keys=[];async function walk(dir,rel=''){let entries;try{entries=await readdir(dir,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}for(const entry of entries){const name=rel+entry.name;if(entry.isDirectory())await walk(join(dir,entry.name),name+'/');else if(name.endsWith('.json'))keys.push(/^[a-f0-9]{48}\.json$/.test(name)?'gifts/'+name:name);}}await walk(root);const all=keys.filter(k=>k.startsWith(prefix)&&k>cursor).sort();const page=all.slice(0,limit);return {items:page.map(recordId),cursor:all.length>limit?page.at(-1):null};}
 };
}
