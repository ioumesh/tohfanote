import {NextResponse,type NextRequest} from 'next/server';
export function proxy(request:NextRequest){
 const nonce=Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
 const script=`'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV==='development'?" 'unsafe-eval'":''}`;
 const csp=`default-src 'self'; script-src ${script}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' data:${process.env.NODE_ENV==='development'?' ws:':''}; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
 const headers=new Headers(request.headers);headers.set('x-nonce',nonce);headers.set('Content-Security-Policy',csp);
 const response=NextResponse.next({request:{headers}});response.headers.set('Content-Security-Policy',csp);response.headers.set('X-Frame-Options','DENY');response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','no-referrer');response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');if(request.nextUrl.protocol==='https:')response.headers.set('Strict-Transport-Security','max-age=31536000');if(/^\/(?:gift|manage|create)(?:\/|$)/.test(request.nextUrl.pathname))response.headers.set('Cache-Control','no-store');return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)']};
