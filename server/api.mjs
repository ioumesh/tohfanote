import {MAX_GIFT_BYTES,MAX_PHOTO_DATA_URL_CHARS,MAX_PHOTOS} from '../lib/limits.mjs';
import {DAY,RETENTION_DAYS,random,hash,matches,problem,policy,sessionSecret,limit,attemptsKey,clearLimit,passcodeFields,checkPasscode,unlocked,unlockCookie,ensurePrivacy,indexExpiry,publicFields,managementFields,expiry} from './privacy.mjs';
const enc=new TextEncoder();
export const MAX_BODY=MAX_GIFT_BYTES;
const ID=/^[a-f0-9]{48}$/;const TOKEN=/^[a-f0-9]{64}$/;
const occasions=['birthday','love','friendship','anniversary','proposal','apology','puzzle','anonymous'];
const fail=problem;
function clean(input) {
  if (!input || typeof input !== 'object') fail('Please complete the gift form.');
  const text=(key,max,min=1)=>{const value=input[key]; if(typeof value!=='string'||value.trim().length<min||value.length>max) fail(`${key}: use ${min}–${max} characters.`); return value.trim();};
  const recipient=text('recipient',60), sender=input.occasion==='anonymous'?'Someone special':text('sender',60), message=text('message',5000,10);
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
  if(input.opensAt){const date=new Date(input.opensAt); if(isNaN(date.getTime())||date.getTime()>Date.now()+30*86400000) fail('Choose an opening date within the next 30 days.'); opensAt=date.toISOString();}
  const milestones = Array.isArray(input.milestones) ? input.milestones.slice(0,5).map(m=>{if(!m||typeof m.date!=='string'||typeof m.title!=='string'||m.date.length>40||m.title.length>120||!m.date.trim()||!m.title.trim()) fail('Each timeline memory needs a date and a title.'); return {date:m.date.trim(),title:m.title.trim()};}) : [];
  return {milestones,occasion:input.occasion,recipient,sender,message,theme:input.theme,music:input.music,photos,timezone,opensAt};
}
export const securityHeaders={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
function json(value,status=200,headers={}){let text=JSON.stringify(value);if(enc.encode(text).length>MAX_BODY){text=JSON.stringify({error:'This older gift exceeds the current editor size limit. Contact support.'});status=413;}return new Response(text,{status,headers:{...securityHeaders,'Content-Type':'application/json; charset=utf-8',...headers}});}
async function body(request){if(!request.headers.get('content-type')?.includes('application/json'))fail('Expected JSON.',415);if(Number(request.headers.get('content-length'))>MAX_BODY)fail('Your gift is too large.',413);const reader=request.body?.getReader();if(!reader)fail('Missing gift details.');const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BODY){await reader.cancel();fail('Your gift is too large.',413);}chunks.push(value);}const all=new Uint8Array(size);let i=0;for(const c of chunks){all.set(c,i);i+=c.length;}try{return JSON.parse(new TextDecoder().decode(all));}catch{fail('Invalid gift details.');}}
function available(gift){if(gift.deletedAt||Date.parse(gift.expiresAt)<=Date.now())fail('This gift has expired or been deleted.',410);}
function requireKey(gift,key){if(!TOKEN.test(key)||!matches(hash(key),gift.tokenHash))fail('Your management key is missing or incorrect.',403);}
export async function api(request,store,{clientIp='local'}={}){
 try{
  const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean),method=request.method;
  if(parts[0]!=='api'||parts[1]!=='gifts')return json({error:'Not found.'},404);
  if(['POST','PUT','DELETE'].includes(method)){const origin=request.headers.get('origin');if(origin&&origin!==url.origin)fail('This request came from another site.',403);}
  if(parts.length===2&&method==='POST'){
   await sessionSecret(store);await limit(store,await attemptsKey(store,'publish:'+clientIp),30,3600000);
   const input=await body(request),gift=clean(input),id=random(24),shareId=random(24),key=random(32),now=new Date().toISOString(),retentionEndsAt=new Date(Date.now()+RETENTION_DAYS*DAY).toISOString();
   const record={...gift,...await passcodeFields(input.passcode||null),id,shareId,accessVersion:1,revoked:false,tokenHash:hash(key),createdAt:now,updatedAt:now,revision:1,retentionEndsAt,expiresAt:expiry(input.expiresAt,{retentionEndsAt})};
   if(record.opensAt&&record.opensAt>=record.expiresAt)fail('Opening time must be before the gift expires.');
   if(!await store.put(id,record))fail('Please try publishing again.',409);
   try{if(!await store.put('links/'+shareId,{id,expiresAt:retentionEndsAt}))throw Error('Link conflict');await indexExpiry(store,record);}catch(error){await store.delete(id);await store.delete('links/'+shareId);throw error;}
   return json({id,shareId,key,revision:1,expiresAt:record.expiresAt,passcodeEnabled:!!record.passcodeHash},201);
  }
  const identifier=parts[2];if(!ID.test(identifier||''))fail('Gift not found. Check your link.',404);
  const management=parts[3]==='manage';let row;
  if(management)row=await store.get(identifier);else{const link=await store.get('links/'+identifier);row=await store.get(link?.value.id||identifier);}
  if(!row)fail('This gift is unavailable. It may have been deleted.',404);
  row=await ensurePrivacy(store,row);const gift=row.value;
  const key=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
  if(management){requireKey(gift,key);if(gift.deletedAt)fail('This gift has been deleted.',410);}else{
   if(identifier!==gift.shareId||gift.revoked)fail('This gift link is no longer available.',404);
   available(gift);
  }
  if(management&&parts.length===4&&method==='GET'){
   if(Date.parse(gift.expiresAt)<=Date.now())return json({id:gift.id,shareId:gift.shareId,expired:true,expiresAt:gift.expiresAt,revision:gift.revision});
   return json(managementFields(gift));
  }
  if(management&&parts.length===4&&method==='DELETE'){
   const tombstone={id:gift.id,shareId:gift.shareId,tokenHash:gift.tokenHash,deletedAt:new Date().toISOString(),expiresAt:new Date().toISOString(),retentionEndsAt:gift.retentionEndsAt};
   if(!await store.put(gift.id,tombstone,row.etag))fail('The gift changed. Reload before deleting.',409);
   await indexExpiry(store,tombstone);await store.delete('links/'+gift.shareId);await store.delete(gift.id);return json({deleted:true});
  }
  if(management&&parts.length===4&&method==='PUT'){
   available(gift);const input=await body(request);if(input.revision!==gift.revision)fail('This gift changed in another tab. Reload before editing.',409);
   const pass=input.passcode===undefined?{}:await passcodeFields(input.passcode);
   const revised={...gift,...clean(input),...pass,expiresAt:expiry(input.expiresAt||gift.expiresAt,gift),updatedAt:new Date().toISOString(),revision:gift.revision+1,accessVersion:gift.accessVersion+(input.passcode===undefined?0:1)};
   if(revised.opensAt&&revised.opensAt>=revised.expiresAt)fail('Opening time must be before expiry.');
   await indexExpiry(store,revised);if(!await store.put(gift.id,revised,row.etag))fail('The gift changed. Reload before editing.',409);return json({id:gift.id,shareId:gift.shareId,revision:revised.revision,expiresAt:revised.expiresAt,passcodeEnabled:!!revised.passcodeHash});
  }
  if(management&&parts[4]==='security'&&parts.length===5&&method==='POST'){
   available(gift);await limit(store,await attemptsKey(store,'manage:'+gift.id),30);const input=await body(request);let revised={...gift,revision:gift.revision+1,updatedAt:new Date().toISOString()};let newKey;
   if(input.action==='revoke')revised={...revised,revoked:true,accessVersion:gift.accessVersion+1};
   else if(input.action==='regenerate'){const shareId=random(24);if(!await store.put('links/'+shareId,{id:gift.id,expiresAt:gift.retentionEndsAt}))fail('Please try again.',409);revised={...revised,shareId,revoked:false,accessVersion:gift.accessVersion+1};}
   else if(input.action==='rotate-key'){if(!TOKEN.test(input.newKey||'')||matches(hash(input.newKey),gift.tokenHash))fail('Generate a new management key first.');newKey=input.newKey;revised.tokenHash=hash(newKey);}
   else fail('Unknown privacy action.');
   if(!await store.put(gift.id,revised,row.etag)){if(revised.shareId!==gift.shareId)await store.delete('links/'+revised.shareId);fail('The gift changed. Reload and try again.',409);}
   if(revised.shareId!==gift.shareId)await store.delete('links/'+gift.shareId);
   return json({id:gift.id,shareId:revised.shareId,revision:revised.revision,...(newKey?{key:newKey}:{}),revoked:revised.revoked});
  }
  if(management)fail('Not found.',404);
  const locked=gift.opensAt&&Date.parse(gift.opensAt)>Date.now();
  if(parts.length===3&&method==='GET'){
   if(locked)return json({locked:true,opensAt:gift.opensAt,timezone:gift.timezone,expiresAt:gift.expiresAt});
   if(!await unlocked(request,gift,store))return json({passcodeRequired:true,expiresAt:gift.expiresAt});
   const safe=publicFields(gift);delete safe.id;return json({...safe,photos:gift.photos.map((_,i)=>`/api/gifts/${identifier}/photos/${i}`)});
  }
  if(parts[3]==='unlock'&&parts.length===4&&method==='POST'){
   if(locked)fail('This gift has not opened yet.',423);
   if(!gift.passcodeHash)return json({unlocked:true});
   const ipKey=await attemptsKey(store,'unlock:'+gift.id+':'+gift.accessVersion+':'+clientIp);await limit(store,ipKey);await limit(store,await attemptsKey(store,'unlock-global:'+gift.id+':'+gift.accessVersion),60);
   const input=await body(request);if(!await checkPasscode(input.passcode,gift))fail('That passcode did not match. Please try again.',403);await clearLimit(store,ipKey);
   return json({unlocked:true},200,{'Set-Cookie':await unlockCookie(request,gift,store)});
  }
  if(parts[3]==='photos'&&parts.length===5&&method==='GET'){
   if(locked)fail('This gift has not opened yet.',423);if(!await unlocked(request,gift,store))fail('Enter the recipient passcode first.',403);
   if(!/^\d$/.test(parts[4])||!gift.photos[Number(parts[4])])fail('Photo not found.',404);
   const [meta,data]=gift.photos[Number(parts[4])].split(',');return new Response(Uint8Array.from(atob(data),c=>c.charCodeAt(0)),{headers:{...securityHeaders,'Content-Type':meta.slice(5,-7)}});
  }
  fail('Not found.',404);
 }catch(error){if(!error.status)console.error('Gift storage request failed');return json({error:error.status?error.message:'Something went wrong. Please try again.'},error.status||500,error.retryAfter?{'Retry-After':String(error.retryAfter)}:{});}
}
