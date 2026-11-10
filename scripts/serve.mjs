import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {api,MAX_BODY,securityHeaders} from '../server/api.mjs';
import {fileStore} from './storage.mjs';
const store=fileStore();const root=resolve('out');const port=Number(process.env.PORT||3000);
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain'};
const server=http.createServer(async(req,res)=>{try{
 const origin=process.env.PUBLIC_ORIGIN||`http://${req.headers.host}`;const url=new URL(req.url,origin);
 if(url.pathname.startsWith('/api/')){const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>MAX_BODY){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Your gift is too large.'}));return;}chunks.push(chunk);}
 const headers=new Headers(req.headers);headers.set('cf-connecting-ip',req.socket.remoteAddress||'local');
 const response=await api(new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),store);
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;}
 let path=resolve(root,'.'+decodeURIComponent(url.pathname));if(path!==root&&!path.startsWith(root+sep)){res.writeHead(404);res.end();return;}
 if(!extname(path))path=resolve(path,'index.html');
 let content;try{content=await readFile(path);}catch{res.writeHead(404,securityHeaders);res.end(await readFile(resolve(root,'404.html')));return;}
 res.writeHead(200,{...securityHeaders,'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(content);
 }catch{res.writeHead(500);res.end('Unable to load. Please retry.');}});
server.listen(port,'0.0.0.0',()=>console.log(`TohfaNote · http://localhost:${port}`));
