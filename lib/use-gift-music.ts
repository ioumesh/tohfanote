'use client';
import {useEffect,useRef,useState} from 'react';
export function useMusic(track:string){
 const [playing,setPlaying]=useState(false);const [volume,setVolume]=useState(.25);const context=useRef<AudioContext|null>(null);const gain=useRef<GainNode|null>(null);const timer=useRef<ReturnType<typeof setInterval>|null>(null);
 const stop=()=>{if(timer.current)clearInterval(timer.current);timer.current=null;context.current?.close();context.current=null;gain.current=null;setPlaying(false);};
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current);context.current?.close();},[]);
 const toggle=async()=>{if(playing){stop();return;}try{const ctx=new AudioContext();context.current=ctx;await ctx.resume();const output=ctx.createGain();gain.current=output;output.gain.value=volume;output.connect(ctx.destination);let index=0;const notes=track==='celebration'?[261.63,329.63,392,523.25,440,392,329.63,293.66]:[261.63,392,329.63,493.88,440,329.63,392,293.66];
 const note=()=>{if(ctx.state==='closed')return;const osc=ctx.createOscillator(),g=ctx.createGain();osc.type='sine';osc.frequency.value=notes[index++%notes.length];g.gain.setValueAtTime(0,ctx.currentTime);g.gain.linearRampToValueAtTime(.22,ctx.currentTime+.04);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+1.4);osc.connect(g);g.connect(output);osc.start();osc.stop(ctx.currentTime+1.5);};note();timer.current=setInterval(note,track==='celebration'?430:720);setPlaying(true);}catch{stop();}};
 function change(value:number){setVolume(value);if(gain.current)gain.current.gain.value=value;}
 return {playing,toggle,volume,change,stop};
}
