import test from 'node:test';
import assert from 'node:assert/strict';
import {handleGiftRequest} from '../server/next-handler.mjs';
test('a hosted API returns actionable JSON 503 for missing credentials instead of an HTML 404',async t=>{
 const names=['VERCEL','R2_ENDPOINT','R2_BUCKET_NAME','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY'];
 const previous=Object.fromEntries(names.map(name=>[name,process.env[name]]));for(const name of names)delete process.env[name];process.env.VERCEL='1';
 try{const r=await handleGiftRequest(new Request('https://tohfanote.live/api/gifts/',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));assert.equal(r.status,503);assert.match(r.headers.get('content-type'),/application\/json/);assert.equal(r.headers.get('cache-control'),'no-store');assert.match((await r.json()).error,/Set R2_ENDPOINT/);}finally{for(const name of names){if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];}}
});
