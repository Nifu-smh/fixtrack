import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}if(pathname.includes('/.')||pathname.startsWith('/tests')||pathname.endsWith('.md')||pathname.endsWith('.mjs')){res.writeHead(404);res.end();return;}try{if(!(await stat(file)).isFile())file=path.join(root,'index.html');}catch{if(path.extname(pathname)){res.writeHead(404);res.end('Not found');return;}file=path.join(root,'index.html');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});res.end(await readFile(file));}catch{res.writeHead(500);res.end('Unable to serve this page');}}).listen(port,'127.0.0.1',()=>console.log(`FixTrack local preview: http://127.0.0.1:${port}`));
