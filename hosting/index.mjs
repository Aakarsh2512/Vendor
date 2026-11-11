import assets from './assets.json';
import {extractEndpoint} from './extract.mjs';
export default {async fetch(request){const url=new URL(request.url);try{
 if(url.pathname==='/api/extract')return await extractEndpoint(request);
 if(url.pathname==='/health')return Response.json({status:'ok',reader:'PDF, DOCX, TXT, CSV'});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 let path=decodeURIComponent(url.pathname);if(path.endsWith('/'))path+='index.html';
 const asset=assets[path];if(!asset)return new Response('Not found',{status:404});
 const body=asset.encoding==='base64'?Uint8Array.from(atob(asset.content),c=>c.charCodeAt(0)):asset.content;
 return new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Cache-Control':path.endsWith('.html')||path.endsWith('.js')?'no-cache':'public, max-age=3600'}});
 }catch(error){return Response.json({detail:'Request could not be processed. '+String(error.message).slice(0,180)},{status:400});}}};
