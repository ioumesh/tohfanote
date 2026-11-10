'use client';
import {useEffect,useState} from 'react';
export function DateTimeFields({label,value,onChange,required=false}:{label:string;value:string;onChange:(value:string)=>void;required?:boolean}){
 const [date,setDate]=useState(value.split('T')[0]||'');const [time,setTime]=useState(value.split('T')[1]?.slice(0,5)||'');
 useEffect(()=>{if(value){setDate(value.split('T')[0]);setTime(value.split('T')[1]?.slice(0,5)||'');}},[value]);
 function change(d:string,t:string){setDate(d);setTime(t);onChange(d&&t?`${d}T${t}`:'');}
 return <fieldset className="date-time-fields"><legend>{label}</legend><div className="date-time-grid"><label>Date<input aria-label={`${label} date`} type="date" required={required||!!time} value={date} onChange={e=>change(e.target.value,time)}/></label><label>Time<input aria-label={`${label} time`} type="time" required={required||!!date} step="60" value={time} onChange={e=>change(date,e.target.value)}/></label></div></fieldset>;
}
