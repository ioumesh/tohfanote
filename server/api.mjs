import {MAX_GIFT_BYTES,MAX_PHOTO_DATA_URL_CHARS,MAX_PHOTOS} from '../lib/limits.mjs';
const enc = new TextEncoder();
export const MAX_BODY = MAX_GIFT_BYTES;
const ID = /^[a-f0-9]{48}$/;
const TOKEN = /^[a-f0-9]{64}$/;
const occasions = ['birthday','love','friendship','anniversary','proposal','apology','puzzle'];
function random(bytes) { return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), x => x.toString(16).padStart(2,'0')).join(''); }
async function hash(value) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))), x => x.toString(16).padStart(2,'0')).join(''); }
function equal(a,b) { if(a.length !== b.length) return false; let n=0; for(let i=0;i<a.length;i++) n |= a.charCodeAt(i)^b.charCodeAt(i); return n===0; }
function fail(message,status=400) { throw Object.assign(new Error(message),{status}); }
function clean(input) {
  if (!input || typeof input !== 'object') fail('Please complete the gift form.');
  const text=(key,max,min=1)=>{const value=input[key]; if(typeof value!=='string'||value.trim().length<min||value.length>max) fail(`${key}: use ${min}–${max} characters.`); return value.trim();};
  const recipient=text('recipient',60), sender=text('sender',60), message=text('message',5000,10);
  if(!occasions.includes(input.occasion)) fail('Choose a supported occasion.');
  if(!['blush','lavender','gold'].includes(input.theme)) fail('Choose a theme.');
  if(!['none','starlight','celebration'].includes(input.music)) fail('Choose a music option.');
  if(!Array.isArray(input.photos)||input.photos.length>MAX_PHOTOS) fail('Choose up to six photos.');
  const photos=input.photos.map((p)=>{
    if(typeof p!=='string'||p.length>MAX_PHOTO_DATA_URL_CHARS||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(p)) fail('Photos must be JPEG, PNG or WebP and optimized for sharing. Please remove and re-add this photo.');
    const [meta,data]=p.split(','); let bytes; try {bytes=atob(data.slice(0,24));} catch {fail('Invalid photo.');}
    if(meta.includes('jpeg')&&!bytes.startsWith('\xff\xd8\xff')||meta.includes('png')&&!bytes.startsWith('\x89PNG\r\n\x1a\n')||meta.includes('webp')&&!(bytes.startsWith('RIFF')&&bytes.slice(8,12)==='WEBP')) fail('Photo contents do not match the image type.');
    return p;
  });
  if(input.occasion==='puzzle'&&!photos.length) fail('A photo puzzle needs at least one photo.');
  const timezone=text('timezone',80); try {new Intl.DateTimeFormat('en',{timeZone:timezone});}catch{fail('Choose a valid timezone.');}
  let opensAt=null;
  if(input.opensAt){const date=new Date(input.opensAt); if(isNaN(date.getTime())||date.getTime()>Date.now()+366*86400000) fail('Choose an opening date within the next year.'); opensAt=date.toISOString();}
  const milestones = Array.isArray(input.milestones) ? input.milestones.slice(0,5).map(m=>{if(!m||typeof m.date!=='string'||typeof m.title!=='string'||m.date.length>40||m.title.length>120||!m.date.trim()||!m.title.trim()) fail('Each timeline memory needs a date and a title.'); return {date:m.date.trim(),title:m.title.trim()};}) : [];
  return {milestones,occasion:input.occasion,recipient,sender,message,theme:input.theme,music:input.music,photos,timezone,opensAt};
}
export const securityHeaders = {'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
function json(data,status=200,extra={}){let serialized=JSON.stringify(data);if(enc.encode(serialized).byteLength>MAX_BODY){serialized=JSON.stringify({error:'This older gift is too large for the current editor. Contact the site owner to resize it or use its protected deletion API.'});status=413;}return new Response(serialized,{status,headers:{...securityHeaders,'Content-Type':'application/json; charset=utf-8',...extra}});}
async function body(request){
  if(!request.headers.get('content-type')?.includes('application/json')) fail('Expected JSON.',415);
  if(Number(request.headers.get('content-length'))>MAX_BODY) fail('Your gift is too large. Use fewer photos.',413);
  const reader=request.body?.getReader(); if(!reader) fail('Missing gift details.');let size=0,chunks=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BODY){await reader.cancel();fail('Your gift is too large. Use fewer photos.',413);}chunks.push(value);}
  const all=new Uint8Array(size);let i=0;for(const c of chunks){all.set(c,i);i+=c.length;}try{return JSON.parse(new TextDecoder().decode(all));}catch{fail('Invalid gift data.');}
}
const rates=new Map();
function rate(clientIp){const ip=clientIp||'local';const now=Date.now(); if(rates.size>10000)rates.clear();let item=rates.get(ip);if(!item||item.until<now)item={n:0,until:now+3600000};item.n++;rates.set(ip,item);if(item.n>30)fail('Too many publishing requests. Please try again in an hour.',429);}
export async function api(request,store,{clientIp}={}){
  try{
    const url=new URL(request.url); const parts=url.pathname.split('/').filter(Boolean);
    if(parts[0]!=='api'||parts[1]!=='gifts')return json({error:'Not found.'},404);
    if(['POST','PUT','DELETE'].includes(request.method)){
      const origin=request.headers.get('origin'); if(origin&&origin!==url.origin)fail('This request came from another site.',403);
    }
    if(parts.length===2&&request.method==='POST'){
      rate(clientIp);const gift=clean(await body(request));const id=random(24),key=random(32);const now=new Date().toISOString();
      if(!await store.put(id,{...gift,id,tokenHash:await hash(key),createdAt:now,updatedAt:now,revision:1}))fail('Please try publishing again.',409);
      return json({id,key,revision:1},201);
    }
    const id=parts[2];if(!ID.test(id||''))return json({error:'Gift not found. Check your link.'},404);
    const stored=await store.get(id);if(!stored)return json({error:'This gift is unavailable. It may have been deleted.'},404);
    const gift=stored.value;
    const key=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
    const authorized=TOKEN.test(key)&&equal(await hash(key),gift.tokenHash);
    const management=parts[3]==='manage';
    if(management&&!authorized)fail('Your management key is missing or incorrect.',403);
    const locked=gift.opensAt&&new Date(gift.opensAt).getTime()>Date.now();
    if(request.method==='GET'&&parts.length===3){
      if(locked)return json({locked:true,opensAt:gift.opensAt,timezone:gift.timezone});
      const {tokenHash,photos,...safe}=gift;void tokenHash;
      return json({...safe,photos:photos.map((_,i)=>`/api/gifts/${id}/photos/${i}`)});
    }
    if(request.method==='GET'&&management&&parts.length===4){const {tokenHash,...safe}=gift;void tokenHash;return json(safe);}
    if(request.method==='GET'&&parts[3]==='photos'&&parts.length===5){
      if(locked)return json({error:'This gift has not opened yet.'},423);
      if(!/^\d$/.test(parts[4]))return json({error:'Photo not found.'},404);
      const photo=gift.photos[Number(parts[4])];if(!photo)return json({error:'Photo not found.'},404);
      const [meta,data]=photo.split(',');const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
      return new Response(bytes,{headers:{...securityHeaders,'Content-Type':meta.slice(5,-7)}});
    }
    if(management&&request.method==='PUT'&&parts.length===4){
      const input=await body(request);if(input.revision!==gift.revision)fail('This gift changed in another tab. Reload before editing.',409);
      const revised={...gift,...clean(input),updatedAt:new Date().toISOString(),revision:gift.revision+1};
      if(!await store.put(id,revised,stored.etag))fail('This gift changed in another tab. Reload before editing.',409);
      return json({id,revision:revised.revision});
    }
    if(management&&request.method==='DELETE'&&parts.length===4){await store.delete(id);return json({deleted:true});}
    return json({error:'Not found.'},404);
  }catch(error){if(!error.status)console.error('Gift storage request failed');return json({error:error.status?error.message:'Something went wrong saving your gift. Please try again.'},error.status||500);}
}
export function r2Store(bucket){return {
  async get(id){const object=await bucket.get(`gifts/${id}.json`);return object?{value:await object.json(),etag:object.etag}:null;},
  async put(id,value,etag){return !!await bucket.put(`gifts/${id}.json`,JSON.stringify(value),{httpMetadata:{contentType:'application/json'},...(etag?{onlyIf:{etagMatches:etag}}:{})});},
  async delete(id){await bucket.delete(`gifts/${id}.json`);}
};}
