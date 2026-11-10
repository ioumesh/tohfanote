'use client';
import {useId} from 'react';
/** One accessible input preserves paste, keyboard editing and password-manager behavior. */
export function PasscodeInput({value,onChange,required=false,autoComplete='off'}:{value:string;onChange:(value:string)=>void;required?:boolean;autoComplete?:string}){
 const hint=useId();
 return <span className="passcode-control"><span className="passcode-boxes" aria-hidden="true">{Array.from({length:6},(_,i)=><span key={i} className={`${value[i]?'filled':''} ${i===value.length?'current':''}`}>{value[i]?'●':'·'}</span>)}</span><input aria-label="Recipient passcode" aria-describedby={hint} type="password" inputMode="numeric" autoComplete={autoComplete} required={required} pattern="[0-9]{6}" minLength={6} maxLength={6} value={value} onChange={e=>onChange(e.target.value.replace(/\D/g,'').slice(0,6))}/><span id={hint} className="sr-only">Six digits. You can type or paste the complete passcode.</span></span>;
}
