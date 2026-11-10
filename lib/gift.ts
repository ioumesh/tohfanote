export type Occasion='birthday'|'love'|'friendship'|'anniversary'|'proposal'|'apology'|'puzzle';
export type Gift={id?:string;revision?:number;milestones?:{date:string;title:string}[];occasion:Occasion;recipient:string;sender:string;message:string;photos:string[];theme:'blush'|'lavender'|'gold';music:'none'|'starlight'|'celebration';opensAt:string|null;timezone:string};
export const occasions:{id:Occasion;name:string;description:string;icon:string;color:string}[]=[
{id:'birthday',name:'Birthday',description:'A wish, a little magic, a lot of love.',icon:'cake',color:'pink'},
{id:'love',name:'Love',description:'For your favourite person.',icon:'heart',color:'rose'},
{id:'friendship',name:'Best Friend',description:'Your kind of wonderfully weird.',icon:'spark',color:'lavender'},
{id:'anniversary',name:'Anniversary',description:'Another chapter of your story.',icon:'rings',color:'peach'},
{id:'proposal',name:'Proposal',description:'A question from the heart.',icon:'diamond',color:'lavender'},
{id:'apology',name:'Apology',description:'Find the words that matter.',icon:'flower',color:'sage'},
{id:'puzzle',name:'Photo Puzzle',description:'A memory, piece by lovely piece.',icon:'puzzle',color:'peach'}];
export const emptyGift:Gift={occasion:'birthday',recipient:'',sender:'',message:'',photos:[],theme:'blush',music:'none',opensAt:null,timezone:'Asia/Kolkata'};
export const demoGift:Gift={...emptyGift,recipient:'Alex',sender:'Someone who loves you',message:'Some people make the world feel a little warmer just by being in it. You are one of those people.\n\nHere’s to the little adventures, the big dreams, and all the beautiful ordinary days still to come. I’m so glad you’re here. Happy birthday, Alex. ♡',music:'starlight'};
export function dateInZone(iso:string,zone:string){return new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeStyle:'short',timeZone:zone}).format(new Date(iso));}
export function zonedISO(local:string,zone:string){
 if(!local)return null;
 const target=Date.parse(local+'Z');if(!Number.isFinite(target))throw Error('Choose a valid opening date and time.');
 const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const render=(n:number)=>fmt.format(new Date(n)).replace(' ','T');let guess=target;
 for(let i=0;i<4;i++){const observed=Date.parse(render(guess)+'Z');guess+=target-observed;}
 if(render(guess)!==local)throw Error('This local time does not exist because of daylight saving. Choose another time.');
 if(render(guess-3600000)===local||render(guess+3600000)===local)throw Error('This time happens twice because of daylight saving. Choose a different time or use UTC.');
 if(guess<Date.now()+60000)throw Error('Choose an opening time at least one minute in the future.');
 return new Date(guess).toISOString();
}
export async function request(path:string,options:RequestInit={}){const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers}});const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to connect. Please try again.');return data;}
export async function photoData(file:File):Promise<string>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose JPEG, PNG or WebP photos.');
 if(file.size>12*1024*1024)throw Error('Please choose photos smaller than 12 MB.');
 const url=URL.createObjectURL(file);
 try{const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(Error('This photo could not be read.'));img.src=url;});
 if(img.width*img.height>50000000)throw Error('This photo is too large to resize.');
 const scale=Math.min(1,1000/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Photo resizing is unavailable.');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const result=canvas.toDataURL('image/jpeg',.78);if(result.length>1000000)throw Error('Please choose a smaller photo.');return result;
 }finally{URL.revokeObjectURL(url);}
}
