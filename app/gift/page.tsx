'use client';
import {BrandName} from '@/components/BrandName';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {Experience} from '@/components/Experience';
import {Gift,request,dateInZone} from '@/lib/gift';
export default function GiftPage(){const [gift,setGift]=useState<Gift|null>(null);const [locked,setLocked]=useState<{opensAt:string;timezone:string}|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [now,setNow]=useState(Date.now());
 const load=useCallback(async()=>{setError('');try{const id=new URLSearchParams(location.search).get('id');if(!id)throw Error('This link is missing its gift. Please check the full link.');const data=await request(`/api/gifts/${encodeURIComponent(id)}`);if(data.locked){setLocked(data);}else{setGift(data);setLocked(null);}}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);
 useEffect(()=>{load();},[load]);
 useEffect(()=>{if(!locked)return;const timer=setInterval(()=>{setNow(Date.now());},1000);const check=setInterval(load,15000);return ()=>{clearInterval(timer);clearInterval(check);};},[locked,load]);
 useEffect(()=>{if(locked&&now>=Date.parse(locked.opensAt))load();},[now,locked,load]);
 if(gift)return <Experience gift={gift}/>;
 const seconds=locked?Math.max(0,Math.floor((Date.parse(locked.opensAt)-now)/1000)):0;
 return <main id="main" className="status-screen"><Link className="brand" href="/"><BrandName/> ♡</Link><span className="big-heart">{locked?'✧':'♡'}</span>{loading?<><h1>A little love is on its way.</h1><p role="status">Unwrapping the details…</p></>:error?<><h1>This little surprise is out of reach.</h1><p role="alert">{error}</p><button className="button primary" onClick={()=>{setLoading(true);load();}}>Try again</button><Link href="/" className="text-button">Back home</Link></>:locked?<><span className="eyebrow">GOOD THINGS ARE WORTH WAITING FOR</span><h1>A little early.<br/><em>A lot to look forward to.</em></h1><p>Your surprise is sealed until<br/><strong>{dateInZone(locked.opensAt,locked.timezone)} · {locked.timezone}</strong></p><div className="countdown" aria-label="Time until opening">{Math.floor(seconds/86400)}d {Math.floor(seconds%86400/3600)}h {Math.floor(seconds%3600/60)}m {seconds%60}s</div><p>This page will open automatically when it’s time.</p></>:null}</main>;
}
