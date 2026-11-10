export function recordKey(id){
 if(/^[a-f0-9]{48}$/.test(id))return `gifts/${id}.json`;
 if(/^(?:links\/[a-f0-9]{48}|attempts\/[a-f0-9]{64}|expiry\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{48}|settings\/(?:privacy-v1|local-secret))$/.test(id))return id+'.json';
 throw Error('Invalid storage identifier.');
}
export function recordId(key){return key.startsWith('gifts/')?key.slice(6,-5):key.slice(0,-5);}
