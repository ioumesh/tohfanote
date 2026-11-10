import {fileStore} from '../scripts/storage.mjs';
import {readR2Config,createR2Client,s3Store,r2Variables} from './s3-store.mjs';
let cached;
export function getStorage(env=process.env){
  const driver=env.GIFT_STORAGE;
  const hosted=env.VERCEL==='1';
  if(driver&&!['local','r2'].includes(driver))throw Object.assign(new Error('GIFT_STORAGE must be local or r2.'),{status:503});
  if(driver==='local'&&hosted)throw Object.assign(new Error('Local gift storage is disabled on Vercel. Configure R2 and redeploy.'),{status:503});
  const useR2=hosted||driver==='r2'||(driver!=='local'&&r2Variables.some(key=>env[key]));
  if(!useR2){if(!cached||cached.driver!=='local')cached={driver:'local',store:fileStore(env.DATA_DIR)};return cached.store;}
  const config=readR2Config(env);
  // Cache only within this server instance; deployment environment changes restart it.
  if(!cached||cached.driver!=='r2')cached={driver:'r2',store:s3Store(createR2Client(config),config.bucket)};
  return cached.store;
}
