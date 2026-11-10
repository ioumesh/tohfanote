import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {createR2Client,s3Store,readR2Config} from '../server/s3-store.mjs';
import {getStorage} from '../server/storage.mjs';
const id='1'.repeat(48);
const config={R2_ENDPOINT:'https://'+'a'.repeat(32)+'.r2.cloudflarestorage.com',R2_BUCKET_NAME:'tohfanote-gifts',R2_ACCESS_KEY_ID:'test-key',R2_SECRET_ACCESS_KEY:'test-secret'};
test('R2 configuration validation; hosted execution never falls back to local files',()=>{
 assert.throws(()=>getStorage({VERCEL:'1'}),/R2_ENDPOINT/);
 assert.throws(()=>getStorage({VERCEL:'1',GIFT_STORAGE:'local'}),/disabled on Vercel/);
 assert.throws(()=>readR2Config({...config,R2_ENDPOINT:config.R2_ENDPOINT+'/bucket'}),/account-level/);
 assert.throws(()=>readR2Config({...config,R2_ENDPOINT:'https://attacker.test'}),/account-level/);
 assert.throws(()=>readR2Config({...config,R2_SECRET_ACCESS_KEY:''}),/R2_SECRET_ACCESS_KEY/);
 const settings=readR2Config(config);assert.equal(settings.bucket,'tohfanote-gifts');assert.equal(settings.secretAccessKey,'test-secret');
});
test('official SDK sends signed S3 requests, safely classifies 404/403/412 and preserves atomic update headers',async()=>{
 const objects=new Map(),requests=[];let deny=false;
 const server=http.createServer(async(req,res)=>{
  requests.push({method:req.method,url:req.url,authorization:req.headers.authorization,ifMatch:req.headers['if-match'],ifNoneMatch:req.headers['if-none-match']});
  const key=req.url.split('?')[0];
  const error=(code,status)=>{res.writeHead(status,{'Content-Type':'application/xml'});res.end(`<Error><Code>${code}</Code><Message>private diagnostic must not reach UI</Message></Error>`);};
  if(deny)return error('AccessDenied',403);
  if(req.method==='GET'){const item=objects.get(key);if(!item)return error('NoSuchKey',404);res.writeHead(200,{'Content-Type':'application/json',ETag:item.etag});return res.end(item.text);}
  if(req.method==='PUT'){const chunks=[];for await(const c of req)chunks.push(c);const text=Buffer.concat(chunks).toString();const old=objects.get(key);
   if(req.headers['if-none-match']==='*'&&old||req.headers['if-match']&&old?.etag!==req.headers['if-match'])return error('PreconditionFailed',412);
   const etag='"'+createHash('md5').update(text).digest('hex')+'"';objects.set(key,{text,etag});res.writeHead(200,{ETag:etag});return res.end();}
  if(req.method==='DELETE'){objects.delete(key);res.writeHead(204);return res.end();}res.writeHead(405);res.end();
 });server.listen(0,'127.0.0.1');await once(server,'listening');
 const client=createR2Client({endpoint:`http://127.0.0.1:${server.address().port}`,accessKeyId:'fixture-access',secretAccessKey:'fixture-secret'});
 const store=s3Store(client,'private-fixture');
 try{
  assert.equal(await store.get(id),null);
  assert.equal(await store.put(id,{message:'one',photos:[]}),true);
  assert.equal(await store.put(id,{message:'collision'}),false);
  const saved=await store.get(id);assert.equal(saved.value.message,'one');assert.ok(saved.etag.startsWith('"'));
  assert.equal(await store.put(id,{message:'two',photos:[]},saved.etag),true);
  assert.equal(await store.put(id,{message:'stale'},saved.etag),false);
  assert.equal((await store.get(id)).value.message,'two');
  assert.ok(requests.every(req=>req.authorization?.startsWith('AWS4-HMAC-SHA256 ')));
  assert.ok(requests.some(req=>req.url.split('?')[0]===`/private-fixture/gifts/${id}.json`));
  assert.ok(requests.some(req=>req.ifMatch===saved.etag));
  deny=true;await assert.rejects(store.get(id),error=>error.status===503&&!error.message.includes('private diagnostic')&&!error.message.includes('fixture-secret'));deny=false;
  await store.delete(id);assert.equal(await store.get(id),null);
 }finally{client.destroy();await new Promise(resolve=>server.close(resolve));}
});
