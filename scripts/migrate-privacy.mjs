import {getStorage} from '../server/storage.mjs';
import {policy,ensurePrivacy,mutate} from '../server/privacy.mjs';
const store=getStorage();
const p=await policy(store);let cursor,count=0;
do{const page=await store.list('gifts/',cursor,25);for(const id of page.items){const row=await store.get(id);if(row&&!row.value.retentionEndsAt){await ensurePrivacy(store,row);count++;}}cursor=page.cursor;}while(cursor);
await mutate(store,'settings/privacy-v1',old=>({...old,migrationComplete:true,migrationCursor:null}));
console.log(`Privacy migration complete: ${count} legacy gifts indexed. Grace period began at ${p.activatedAt}. No private contents or credentials are printed.`);
