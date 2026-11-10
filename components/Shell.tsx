import {BrandName} from '@/components/BrandName';
import Link from 'next/link';
import {Icon} from './Art';
import {CreatorCredit} from './CreatorCredit';
export function Header(){return <header className="header"><Link href="/" className="brand" aria-label="TohfaNote home"><span className="brand-mark"><Icon name="heart" size={21}/></span><BrandName/><span className="brand-dot">✦</span></Link><nav aria-label="Main navigation"><Link href="/#occasions">Explore gifts</Link><Link href="/#how-it-works">How it works</Link><Link className="nav-cta" href="/create/">Make someone smile <span>↗</span></Link></nav></header>;}
export function Footer(){return <footer className="footer"><div><Link href="/" className="brand"><BrandName/> ♡</Link><p>Har tohfe mein dil ki baat.</p><p className="brand-handle">@tohfanote</p><CreatorCredit/></div><div><Link href="/#occasions">Explore gifts</Link><Link href="/#faq">Questions & privacy</Link><Link href="/manage/">Manage a gift</Link></div><p>Made for the people who matter.<br/><small>© {new Date().getFullYear()} TohfaNote</small></p></footer>;}
