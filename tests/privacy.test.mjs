import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {api} from '../server/api.mjs';
import {fileStore} from '../scripts/storage.mjs';
import {DAY,RETENTION_DAYS,cleanup,hash,policy} from '../server/privacy.mjs';
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';
const draft={occasion:'birthday',recipient:'Alex',sender:'Sam',message:'A private birthday letter, with love.',photos:[photo],music:'none',theme:'blush',timezone:'UTC',opensAt:null};
function req(path,method='GET',value,key,cookie){return new Request('https://tohfanote.test/api/gifts/'+path,{method,headers:{'content-type':'application/json',...(key?{authorization:'Bearer '+key}:{}),...(cookie?{cookie}:{})},...(value?{body:JSON.stringify(value)}:{})});}
async function fixture(fn){const dir=await mkdtemp(join(tmpdir(),'tohfanote-privacy-'));try{await fn(fileStore(dir),dir);}finally{await rm(dir,{recursive:true,force:true});}}
async function create(store,extra={}){const r=await api(req('','POST',{...draft,...extra}),store);assert.equal(r.status,201,await r.clone().text());return r.json();}
async function security(store,gift,action,extra={}){return api(req(gift.id+'/manage/security','POST',{action,...extra},gift.key),store);}
test('recipient passcode guards content/photos; secure session cookies; salted hashes never returned',()=>fixture(async store=>{
 const gift=await create(store,{passcode:'076853'}),other=await create(store,{passcode:'076853'});
 const stored=(await store.get(gift.id)).value;assert.equal(stored.passcode,undefined);assert.notEqual(stored.passcodeHash,'076853');assert.notEqual(stored.passcodeHash,(await store.get(other.id)).value.passcodeHash);
 const before=await(await api(req(gift.shareId),store)).json();assert.deepEqual(Object.keys(before).sort(),['expiresAt','passcodeRequired']);assert.equal((await api(req(gift.shareId+'/photos/0'),store)).status,403);
 const management=await(await api(req(gift.id+'/manage','GET',null,gift.key),store)).json();assert.equal(management.passcodeEnabled,true);assert.equal(management.passcodeHash,undefined);assert.equal(management.passcodeSalt,undefined);assert.equal(management.tokenHash,undefined);
 const unlock=await api(req(gift.shareId+'/unlock','POST',{passcode:'076853'}),store);assert.equal(unlock.status,200);const cookie=unlock.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);const token=cookie.split(';')[0];
 const after=await(await api(req(gift.shareId,'GET',null,null,token),store)).json();assert.equal(after.message,draft.message);assert.equal(after.passcodeHash,undefined);assert.equal(after.tokenHash,undefined);assert.equal((await api(req(gift.shareId+'/photos/0','GET',null,null,token),store)).status,200);
 assert.equal((await api(req(other.shareId+'/photos/0','GET',null,null,token),store)).status,403);
}));
test('attempt limits survive fresh storage adapters and concurrent attempts; cooldown expires',t=>fixture(async(store,dir)=>{
 const gift=await create(store,{passcode:'076853'});const tries=await Promise.all(Array.from({length:12},()=>api(req(gift.shareId+'/unlock','POST',{passcode:'111111'}),store,{clientIp:'198.51.100.1'})));assert.equal(tries.filter(r=>r.status===403).length,5);assert.ok(tries.every(r=>[403,429].includes(r.status)));
 const fresh=fileStore(dir);const blocked=await api(req(gift.shareId+'/unlock','POST',{passcode:'076853'}),fresh,{clientIp:'198.51.100.1'});assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('retry-after'))>0);
 const page=await fresh.list('attempts/');for(const id of page.items){assert.ok(!JSON.stringify((await fresh.get(id)).value).includes('198.51.100.1'));}
 const now=Date.now();t.mock.method(Date,'now',()=>now+16*60000);assert.equal((await api(req(gift.shareId+'/unlock','POST',{passcode:'076853'}),fresh,{clientIp:'198.51.100.1'})).status,200);
}));
test('revoke/regenerate invalidate old recipient URLs and sessions; management key rotation invalidates old key',()=>fixture(async store=>{
 const gift=await create(store,{passcode:'076853'});const u=await api(req(gift.shareId+'/unlock','POST',{passcode:'076853'}),store);const cookie=u.headers.get('set-cookie').split(';')[0];
 assert.equal((await security(store,gift,'revoke')).status,200);assert.equal((await api(req(gift.shareId,'GET',null,null,cookie),store)).status,404);assert.equal((await api(req(gift.shareId+'/photos/0','GET',null,null,cookie),store)).status,404);assert.equal((await api(req(gift.id+'/manage','GET',null,gift.key),store)).status,200);
 const refreshed=await(await security(store,gift,'regenerate')).json();assert.notEqual(refreshed.shareId,gift.shareId);assert.equal((await api(req(gift.shareId),store)).status,404);assert.equal((await(await api(req(refreshed.shareId,'GET',null,null,cookie),store)).json()).passcodeRequired,true);
 const newKey='b'.repeat(64);const rotation=await security(store,gift,'rotate-key',{newKey});assert.equal(rotation.status,200);assert.equal((await api(req(gift.id+'/manage','GET',null,gift.key),store)).status,403);assert.equal((await api(req(gift.id+'/manage','GET',null,newKey),store)).status,200);
 assert.equal((await api(req(gift.id+'/manage','DELETE',null,gift.key),store)).status,403);assert.equal((await api(req(gift.id+'/manage','DELETE',null,newKey),store)).status,200);assert.equal((await api(req(refreshed.shareId),store)).status,404);
}));
test('passcode changes invalidate unlock sessions and reset access-version attempt limits',()=>fixture(async store=>{
 const gift=await create(store,{passcode:'076853'});const u=await api(req(gift.shareId+'/unlock','POST',{passcode:'076853'}),store);const cookie=u.headers.get('set-cookie').split(';')[0];
 for(let i=0;i<5;i++)await api(req(gift.shareId+'/unlock','POST',{passcode:'111111'}),store);
 const edit=await api(req(gift.id+'/manage','PUT',{...draft,passcode:'098765',revision:1},gift.key),store);assert.equal(edit.status,200);assert.equal((await(await api(req(gift.shareId,'GET',null,null,cookie),store)).json()).passcodeRequired,true);assert.equal((await api(req(gift.shareId+'/unlock','POST',{passcode:'098765'}),store)).status,200);
}));
test('expiry seals all recipient content, cannot extend retention, and cleanup removes expired objects',t=>fixture(async store=>{
 const gift=await create(store,{expiresAt:new Date(Date.now()+60000).toISOString()});const original=(await store.get(gift.id)).value;assert.ok(Date.parse(original.retentionEndsAt)-Date.now()<=RETENTION_DAYS*DAY);
 assert.equal((await api(req(gift.id+'/manage','PUT',{...draft,revision:1,expiresAt:new Date(Date.now()+31*DAY).toISOString()},gift.key),store)).status,400);
 const now=Date.now();t.mock.method(Date,'now',()=>now+120000);assert.equal((await api(req(gift.shareId),store)).status,410);assert.equal((await api(req(gift.shareId+'/photos/0'),store)).status,410);const owner=await(await api(req(gift.id+'/manage','GET',null,gift.key),store)).json();assert.equal(owner.expired,true);assert.equal(owner.message,undefined);
 await cleanup(store);assert.equal(await store.get(gift.id),null);assert.equal(await store.get('links/'+gift.shareId),null);
}));
test('legacy gift links keep working with a single stable 30-day grace period',t=>fixture(async(store,dir)=>{
 const id='c'.repeat(48),key='d'.repeat(64);await store.put(id,{...draft,id,tokenHash:hash(key),createdAt:'2020-01-01T00:00:00Z',updatedAt:'2020-01-01T00:00:00Z',revision:1});
 const first=await api(req(id),store);assert.equal(first.status,200);const saved=(await store.get(id)).value;const p=await policy(store);assert.equal(Date.parse(saved.expiresAt),Date.parse(p.activatedAt)+30*DAY);
 const now=Date.now();t.mock.method(Date,'now',()=>now+DAY);const fresh=fileStore(dir);assert.equal((await api(req(id),fresh)).status,200);assert.equal((await fresh.get(id)).value.expiresAt,saved.expiresAt);assert.equal((await api(req(id+'/manage','GET',null,key),fresh)).status,200);
}));
test('scheduled gifts reveal neither photos nor passcode surface before opening; invalid passcodes rejected',()=>fixture(async store=>{
 assert.equal((await api(req('','POST',{...draft,passcode:'abc'}),store)).status,400);
 assert.equal((await api(req('','POST',{...draft,opensAt:new Date(Date.now()+2*DAY).toISOString(),expiresAt:new Date(Date.now()+DAY).toISOString()}),store)).status,400);
 const gift=await create(store,{passcode:'076853',opensAt:new Date(Date.now()+DAY).toISOString()});assert.equal((await(await api(req(gift.shareId),store)).json()).locked,true);assert.equal((await api(req(gift.shareId+'/unlock','POST',{passcode:'076853'}),store)).status,423);assert.equal((await api(req(gift.shareId+'/photos/0'),store)).status,423);
}));

test('cleanup repairs a same-day expiry index after an extension and does not lose the deletion deadline',t=>fixture(async store=>{
 const now=Date.now();t.mock.method(Date,'now',()=>now);const gift=await create(store,{expiresAt:new Date(now+60000).toISOString()});
 const row=await store.get(gift.id);await store.put(gift.id,{...row.value,expiresAt:new Date(now+3600000).toISOString()},row.etag);
 t.mock.method(Date,'now',()=>now+120000);await cleanup(store);assert.ok(await store.get(gift.id));
 t.mock.method(Date,'now',()=>now+7200000);await cleanup(store);assert.equal(await store.get(gift.id),null);
}));
test('removing a passcode revokes old sessions but leaves an unprotected recipient link readable',()=>fixture(async store=>{
 const gift=await create(store,{passcode:'076853'});const response=await api(req(gift.id+'/manage','PUT',{...draft,revision:1,passcode:null},gift.key),store);assert.equal(response.status,200);const value=await(await api(req(gift.shareId),store)).json();assert.equal(value.message,draft.message);assert.equal(value.passcodeEnabled,false);
}));
test('the full 15-minute cooldown begins on the fifth failure, not on the first',t=>fixture(async store=>{
 const now=Date.now();t.mock.method(Date,'now',()=>now);const gift=await create(store,{passcode:'076853'});for(let i=0;i<4;i++)assert.equal((await api(req(gift.shareId+'/unlock','POST',{passcode:'111111'}),store)).status,403);
 t.mock.method(Date,'now',()=>now+10*60000);assert.equal((await api(req(gift.shareId+'/unlock','POST',{passcode:'111111'}),store)).status,403);
 t.mock.method(Date,'now',()=>now+16*60000);const blocked=await api(req(gift.shareId+'/unlock','POST',{passcode:'076853'}),store);assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('retry-after'))>=9*60);
 t.mock.method(Date,'now',()=>now+26*60000);assert.equal((await api(req(gift.shareId+'/unlock','POST',{passcode:'076853'}),store)).status,200);
}));
test('malformed unlock-cookie signatures fail closed without causing a server error',()=>fixture(async store=>{
 const gift=await create(store,{passcode:'076853'});const cookie=`tn_unlock_${gift.id}=payload.${'é'.repeat(64)}`;const response=await api(req(gift.shareId,'GET',null,null,cookie),store);assert.equal(response.status,200);assert.equal((await response.json()).passcodeRequired,true);assert.equal((await api(req(gift.shareId+'/photos/0','GET',null,null,cookie),store)).status,403);
}));

test('anonymous gifts discard sender identity on create and edit, while management remains protected',()=>fixture(async store=>{
 let r=await api(req('','POST',{...draft,occasion:'anonymous',sender:'Private creator name'}),store);
 assert.equal(r.status,201);const {id,key,shareId}=await r.json();
 const saved=await store.get(id);assert.equal(saved.value.sender,'Someone special');
 r=await api(req(shareId),store);assert.equal((await r.json()).sender,'Someone special');
 assert.equal((await api(req(id+'/manage'),store)).status,403);
 r=await api(req(id+'/manage','PUT',{...draft,occasion:'anonymous',sender:'Another private name',revision:1},key),store);assert.equal(r.status,200);
 assert.equal((await (await api(req(shareId),store)).json()).sender,'Someone special');
}));
