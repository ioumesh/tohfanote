export function Icon({name,size=24}:{name:string;size?:number}){
 const paths:Record<string,React.ReactNode>={
 heart:<path d="M12 20S2 14 2 7.8C2 2.8 8.5 1.4 12 6c3.5-4.6 10-3.2 10 1.8C22 14 12 20 12 20Z"/>,
 arrow:<><path d="M4 12h16M14 6l6 6-6 6"/></>,
 spark:<><path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z"/></>,
 cake:<><path d="M4 12h16v9H4zM3 12c0-4 4-4 5-1 1-3 6-3 7 0 1-3 6-3 6 1M8 8V5m8 3V5M8 2v1m8-1v1M2 21h20"/></>,
 rings:<><circle cx="8" cy="14" r="6"/><circle cx="16" cy="14" r="6"/><path d="m8 4 4-3 4 3-4 4Z"/></>,
 diamond:<><path d="m3 8 4-5h10l4 5-9 14ZM3 8h18M7 3l5 19 5-19"/></>,
 flower:<><path d="M12 15v7m0-4c-5 0-7-3-7-3 5-1 7 3 7 3Z"/><path d="M12 6c-6-9-13 1-6 5-3 7 7 10 9 3 8 1 10-9 3-9-2-6-7-5-6 1Z"/></>,
 puzzle:<path d="M3 3h6c-2 5 7 5 5 0h7v6c-5-2-5 7 0 5v7h-7c2-5-7-5-5 0H3v-7c5 2 5-7 0-5Z"/>,
 photo:<><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m3 17 6-5 4 4 3-3 5 4"/></>,
 lock:<><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
 check:<path d="m5 12 4 4L20 5"/>,
 music:<><path d="M9 18V5l12-3v13M9 8l12-3"/><ellipse cx="5.5" cy="18.5" rx="3.5" ry="2.5"/><ellipse cx="17.5" cy="15.5" rx="3.5" ry="2.5"/></>,
 mail:<><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 5 10 8L22 5"/></>,
 close:<path d="m6 6 12 12M6 18 18 6"/>,
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.spark}</svg>;
}
const cakeColours = {
  blush: ['#f8d7db', '#dc9ba8', '#f9dbe0'],
  lavender: ['#e8dff7', '#b9a5d8', '#e4d8f4'],
  gold: ['#faeacb', '#d8ad69', '#f8e5bc'],
} as const;
export function CakeArt({lit=true,theme='blush'}:{lit?:boolean;theme?:keyof typeof cakeColours}){
 const [light,shade,top]=cakeColours[theme];
 return <svg className="cake-art" viewBox="0 0 300 250" role="img" aria-label={lit?'A birthday cake with three glowing candles':'A birthday cake with the candles blown out'}><defs><linearGradient id="icing" x2="0" y2="1"><stop stopColor={light}/><stop offset="1" stopColor={shade}/></linearGradient></defs><ellipse cx="150" cy="225" rx="115" ry="13" fill="#a9776120"/><path d="M58 156v51c0 26 184 26 184 0v-51" fill="#e9b795"/><path d="M58 181c35 13 149 13 184 0v17c-35 15-149 15-184 0" fill="#fff1de"/><ellipse cx="150" cy="155" rx="92" ry="27" fill="#fff0df"/><path d="M58 151v22q14 20 28 0 14 30 28 4 15 27 30 0 15 30 30 0 16 26 31-2 24 20 37-4v-20" fill="url(#icing)"/><ellipse cx="150" cy="149" rx="92" ry="25" fill={top}/>{[108,150,192].map((x,i)=><g key={x}><rect x={x-4} y={98-i%2*14} width="8" height={51+i%2*14} rx="2" fill={i===1?'#c2b4d8':'#f7eee0'}/><path d={`m${x-3} ${110-i%2*14} 6 5m-6 8 6 5m-6 8 6 5`} stroke="#cc91a2" strokeWidth="2"/>{lit&&<path className="flame" d={`M${x} ${90-i%2*14}c-16-12 2-20 0-30 18 16 10 24 0 30Z`} fill="#e8b458"/>}</g>)}<path d="M77 152q80 28 146 0" stroke="#fff" fill="none" strokeWidth="2" opacity=".5"/></svg>;}
export function Envelope({name='Sandhya'}:{name?:string}){return <div className="envelope-art" aria-hidden="true"><div className="letter-peek"><span>A little note for</span><strong>{name||'someone special'}</strong><span>you make life sweeter ♡</span></div><div className="envelope-back"/><div className="envelope-front"/><div className="wax">♡</div><span className="envelope-label">sealed with a little love</span></div>;}
export function MemoryArt({variant=0}:{variant?:number}){return <svg viewBox="0 0 400 450" width="400" height="450" role="img" aria-label={variant?'A little bouquet, illustrated with love':'An illustrated sunset, a little memory of happiness'}><rect width="400" height="450" fill={variant?'#e5e0ed':'#efddc7'}/>{variant?<><path d="m200 370-45-165m45 165 42-180m-42 180 0-205" stroke="#788d72" strokeWidth="5"/>{[[155,200],[240,182],[200,151]].map(([x,y],i)=><g key={i} fill={i===1?'#e5a6aa':'#bd9bbe'}>{[0,72,144,216,288].map(a=><ellipse key={a} cx={x} cy={y-15} rx="14" ry="22" transform={`rotate(${a} ${x} ${y})`}/>)}<circle cx={x} cy={y} r="10" fill="#e6bd6e"/></g>)}<path d="m175 300 25 70 27-70Z" fill="#cbbf98"/></>:<><circle cx="270" cy="146" r="64" fill="#d49a77"/><path d="M0 280q100-130 200 0 120-130 200-30v200H0Z" fill="#a7aa8e"/><path d="M0 350q120-150 240 0 90-80 160-20v120H0Z" fill="#778c7c"/><path d="M148 450q125-98 34-177 156 130 18 177" fill="#d4c8a4"/></>}</svg>;}
