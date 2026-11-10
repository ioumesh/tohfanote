import {getStorage} from '@/server/storage.mjs';
import {cleanup,matches} from '@/server/privacy.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request){const secret=process.env.CRON_SECRET;if(!secret||secret.length<32)return Response.json({error:'Maintenance is not configured.'},{status:503});if(!matches(request.headers.get('authorization')||'',`Bearer ${secret}`))return Response.json({error:'Unauthorized.'},{status:401});try{return Response.json(await cleanup(getStorage()),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Cleanup failed. Check storage and retry.'},{status:503});}}
