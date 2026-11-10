'use client';
import {PasscodeInput} from '@/components/PasscodeInput';
import {BrandName} from '@/components/BrandName';
import {GiftActions} from '@/components/GiftActions';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {Experience} from '@/components/Experience';
import {Gift,request,dateInZone} from '@/lib/gift';
export default function GiftPage(){
 const [gift,setGift]=useState<Gift|null>(null),[locked,setLocked]=useState<{opensAt:string;timezone:string}|null>(null),[protectedGift,setProtected]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true),[now,setNow]=useState(Date.now()),[passcode,setPasscode]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{try{const id=new URLSearchParams(location.search).get('id');if(!id)throw Error('This link is missing its gift.');const data=await request(`/api/gifts/${encodeURIComponent(id)}`);setError('');if(data.locked){setLocked(data);setProtected(false);}else if(data.passcodeRequired){setProtected(true);setLocked(null);}else{setGift(data);setLocked(null);setProtected(false);}}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);
 useEffect(()=>{load();},[load]);
 useEffect(()=>{if(!locked)return;const t=setInterval(()=>setNow(Date.now()),1000),p=setInterval(load,15000);return ()=>{clearInterval(t);clearInterval(p);};},[locked,load]);
 useEffect(()=>{if(locked&&now>=Date.parse(locked.opensAt))load();},[now,locked,load]);
 async function unlock(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const id=new URLSearchParams(location.search).get('id');await request(`/api/gifts/${id}/unlock`,{method:'POST',body:JSON.stringify({passcode})});setPasscode('');await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(gift)return <Experience gift={gift}/>;
 const seconds=locked?Math.max(0,Math.floor((Date.parse(locked.opensAt)-now)/1000)):0;
 return <main id="main" className="status-screen"><Link className="brand" href="/"><BrandName/> ♡</Link><span className="big-heart">{locked?'✧':'♡'}</span>{loading?<><h1>A little love is on its way.</h1><p role="status">Unwrapping the details…</p></>:protectedGift?<><h1>A little secret,<br/><em>just for you.</em></h1><p>Enter the six-digit passcode your sender shared separately.</p><form className="manage-form" onSubmit={unlock}><label>Recipient passcode<PasscodeInput required value={passcode} onChange={setPasscode}/></label><button disabled={busy} className="button primary">{busy?'Checking…':'Unlock my gift'}</button></form>{error&&<p className="error" role="alert">{error}</p>}<p className="field-note">Five failed attempts trigger a 15-minute cooldown. Your sender can reset the passcode through their private management link.</p></>:error?<><h1>This little surprise is out of reach.</h1><p role="alert">{error}</p><button className="button primary" onClick={()=>{setLoading(true);load();}}>Try again</button></>:locked?<><span className="eyebrow">GOOD THINGS ARE WORTH WAITING FOR</span><h1>A little early.<br/><em>A lot to look forward to.</em></h1><p>Your surprise is sealed until<br/><strong>{dateInZone(locked.opensAt,locked.timezone)} · {locked.timezone}</strong></p><div className="countdown">{Math.floor(seconds/86400)}d {Math.floor(seconds%86400/3600)}h {Math.floor(seconds%3600/60)}m {seconds%60}s</div><p>This page will open automatically when it’s time.</p></>:null}<GiftActions/></main>;
}
