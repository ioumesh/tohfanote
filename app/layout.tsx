import type { Metadata } from 'next';
import './globals.css';
import {brand} from '@/lib/brand';
export const metadata:Metadata={metadataBase:new URL(brand.productionOrigin),title:brand.title,description:brand.tagline+' Create personalized digital gifts with your photos, letters and interactive surprises. Free to create.',openGraph:{siteName:brand.name,title:brand.title,description:brand.tagline,url:brand.productionOrigin,type:'website'},twitter:{card:'summary',title:brand.title,description:brand.tagline},authors:[{name:'Handmade Gifts Delhi',url:'https://www.instagram.com/handmadegiftsdelhi/'}],creator:'Handmade Gifts Delhi',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>{children}</body></html>;}
