import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {api} from '../server/api.mjs';
import {fileStore} from '../scripts/storage.mjs';
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';
const draft={occasion:'birthday',recipient:'Alex',sender:'Sam',message:'A beautiful little message for your birthday.',photos:[photo],music:'starlight',theme:'blush',opensAt:null,timezone:'Asia/Kolkata'};
function req(path,method='GET',data,key,origin){return new Request('https://gift.test'+path,{method,headers:{'content-type':'application/json',...(key?{authorization:'Bearer '+key}:{}),...(origin?{origin}:{})},...(data?{body:JSON.stringify(data)}:{})});}
test('full persistent lifecycle, auth, photos, revision conflicts and deletion',async()=>{const dir=await mkdtemp(join(tmpdir(),'yas-test-'));try{
const store=fileStore(dir);let r=await api(req('/api/gifts','POST',draft),store);assert.equal(r.status,201);const {id,key,shareId}=await r.json();assert.match(id,/^[a-f0-9]{48}$/);assert.match(key,/^[a-f0-9]{64}$/);
const restarted=fileStore(dir);r=await api(req('/api/gifts/'+shareId),restarted);const publicGift=await r.json();assert.equal(publicGift.recipient,'Alex');assert.equal(publicGift.tokenHash,undefined);assert.equal(publicGift.photos.length,1);assert.ok(!JSON.stringify(publicGift).includes(key));
r=await api(req(publicGift.photos[0]),restarted);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');assert.ok((await r.arrayBuffer()).byteLength>20);
assert.equal((await api(req('/api/gifts/'+id+'/manage'),restarted)).status,403);
assert.equal((await api(req('/api/gifts/'+id+'/manage','DELETE',null,'0'.repeat(64)),restarted)).status,403);
r=await api(req('/api/gifts/'+id+'/manage','GET',null,key),restarted);assert.equal((await r.json()).photos[0],photo);
r=await api(req('/api/gifts/'+id+'/manage','PUT',{...draft,recipient:'Alexandra',revision:1},key),restarted);assert.equal(r.status,200);
assert.equal((await api(req('/api/gifts/'+id+'/manage','PUT',{...draft,revision:1},key),restarted)).status,409);
r=await api(req('/api/gifts/'+shareId),restarted);assert.equal((await r.json()).recipient,'Alexandra');
assert.equal((await api(req('/api/gifts/'+id+'/manage','DELETE',null,key),restarted)).status,200);
assert.equal((await api(req('/api/gifts/'+shareId),restarted)).status,404);assert.equal((await api(req(publicGift.photos[0]),restarted)).status,404);
}finally{await rm(dir,{recursive:true,force:true});}});
test('server scheduling seals contents and photos, creator can preview, unlocks after time',async()=>{const dir=await mkdtemp(join(tmpdir(),'yas-lock-'));try{const store=fileStore(dir);const opensAt=new Date(Date.now()+3600000).toISOString();let r=await api(req('/api/gifts','POST',{...draft,opensAt}),store);const {id,key,shareId}=await r.json();r=await api(req('/api/gifts/'+shareId),store);const locked=await r.json();assert.deepEqual(Object.keys(locked).sort(),['expiresAt','locked','opensAt','timezone']);assert.equal((await api(req(`/api/gifts/${shareId}/photos/0`),store)).status,423);assert.equal((await api(req(`/api/gifts/${id}/manage`,'GET',null,key),store)).status,200);await api(req(`/api/gifts/${id}/manage`,'PUT',{...draft,opensAt:new Date(Date.now()-1000).toISOString(),revision:1},key),store);r=await api(req(`/api/gifts/${shareId}`),store);assert.equal((await r.json()).recipient,'Alex');}finally{await rm(dir,{recursive:true,force:true});}});
test('validation, malicious images, cross-origin writes, unlisted routes and error states',async()=>{const dir=await mkdtemp(join(tmpdir(),'yas-invalid-'));const store=fileStore(dir);try{for(const bad of [{...draft,recipient:' '},{...draft,message:'short'},{...draft,photos:['data:image/jpeg;base64,PHNjcmlwdD4=']},{...draft,occasion:'puzzle',photos:[]},{...draft,timezone:'Invalid/Zone'},{...draft,photos:Array(7).fill(photo)},{...draft,milestones:[{date:'',title:'bad'}]}])assert.equal((await api(req('/api/gifts','POST',bad),store)).status,400);
assert.equal((await api(req('/api/gifts','POST',draft,null,'https://evil.test'),store)).status,403);assert.equal((await api(req('/api/gifts'),store)).status,404);assert.equal((await api(req('/api/gifts/../../../etc/passwd'),store)).status,404);
const failStore={get:async()=>{throw Error('disk offline')}};const r=await api(req('/api/gifts/'+'a'.repeat(48)),failStore);assert.equal(r.status,500);assert.ok(!(await r.text()).includes('disk offline'));
}finally{await rm(dir,{recursive:true,force:true});}});
test('all occasions are accepted with the shared gift contract',async()=>{const dir=await mkdtemp(join(tmpdir(),'yas-occasions-'));try{const store=fileStore(dir);for(const occasion of ['birthday','love','friendship','anniversary','proposal','apology','puzzle']){const r=await api(req('/api/gifts','POST',{...draft,occasion,milestones:[{date:'2020',title:'Our first hello'}]}),store);assert.equal(r.status,201,occasion);}}finally{await rm(dir,{recursive:true,force:true});}});

test('Vercel payload budget bounds both six-photo publishing and full management responses',async()=>{
 const {MAX_GIFT_BYTES,MAX_PHOTO_DATA_URL_CHARS}=await import('../lib/limits.mjs');
 const dir=await mkdtemp(join(tmpdir(),'tohfanote-size-'));const store=fileStore(dir);
 try{
  // Signature-valid carrier exercises the byte budget; rendering is checked in browsers.
  const bytes=Buffer.alloc(245000,65);bytes.set([137,80,78,71,13,10,26,10]);const image='data:image/png;base64,'+bytes.toString('base64');assert.ok(image.length<MAX_PHOTO_DATA_URL_CHARS);
  const six={...draft,photos:Array(6).fill(image)};assert.ok(Buffer.byteLength(JSON.stringify(six))<MAX_GIFT_BYTES);
  const response=await api(req('/api/gifts/','POST',six),store,{clientIp:'payload-test'});assert.equal(response.status,201);const {id,key,shareId}=await response.json();
  const management=await api(req(`/api/gifts/${id}/manage/`,'GET',null,key),store);assert.equal(management.status,200);assert.ok((await management.arrayBuffer()).byteLength<MAX_GIFT_BYTES);
  const huge=new Request('https://gift.test/api/gifts',{method:'POST',headers:{'Content-Type':'application/json'},body:' '.repeat(MAX_GIFT_BYTES+1)});assert.equal((await api(huge,store,{clientIp:'payload-too-large'})).status,413);
  const encodedTooLarge='data:image/png;base64,'+Buffer.concat([bytes,bytes]).toString('base64');assert.equal((await api(req('/api/gifts','POST',{...draft,photos:[encodedTooLarge]}),store,{clientIp:'photo-too-large'})).status,400);
 }finally{await rm(dir,{recursive:true,force:true});}
});
