import {api,securityHeaders} from './api.mjs';
import {getStorage} from './storage.mjs';
export async function handleGiftRequest(request){
  try{
    const store=getStorage();
    const clientIp=process.env.VERCEL==='1'?request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim():'local';
    return await api(request,store,{clientIp:clientIp||'unknown'});
  }catch(error){
    if(error.status!==503)console.error('Gift API initialization failed');
    return Response.json({error:error.status===503?error.message:'The gift service could not start. Please try again.'},{status:error.status||500,headers:securityHeaders});
  }
}
