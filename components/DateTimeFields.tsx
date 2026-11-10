'use client';
import {useEffect,useState} from 'react';
function Picker({label,type,value,onChange,required}:{label:string;type:'date'|'time';value:string;onChange:(value:string)=>void;required:boolean}){
 const display=value?(type==='date'?new Date(`${value}T12:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):`${String(Number(value.slice(0,2))%12||12).padStart(2,'0')}:${value.slice(3,5)} ${Number(value.slice(0,2))>=12?'PM':'AM'}`):(type==='date'?'Choose a date':'Choose a time');
 return <span className="native-picker"><span className={`picker-display ${value?'has-value':''}`} aria-hidden="true"><span>{display}</span><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5">{type==='date'?<><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/></>:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}</svg></span><input aria-label={label} type={type} required={required} step={type==='time'?'60':undefined} value={value} onChange={e=>onChange(e.target.value)}/></span>;
}
export function DateTimeFields({label,value,onChange,required=false}:{label:string;value:string;onChange:(value:string)=>void;required?:boolean}){
 const [date,setDate]=useState(value.split('T')[0]||'');const [time,setTime]=useState(value.split('T')[1]?.slice(0,5)||'');
 useEffect(()=>{if(value){setDate(value.split('T')[0]);setTime(value.split('T')[1]?.slice(0,5)||'');}},[value]);
 function change(d:string,t:string){setDate(d);setTime(t);onChange(d&&t?`${d}T${t}`:'');}
 return <fieldset className="date-time-fields"><legend>{label}</legend><div className="date-time-grid"><label>Date<Picker label={`${label} date`} type="date" required={required||!!time} value={date} onChange={d=>change(d,time)}/></label><label>Time<Picker label={`${label} time`} type="time" required={required||!!date} value={time} onChange={t=>change(date,t)}/></label></div></fieldset>;
}
