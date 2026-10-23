// Local-only, no Firebase app shell or backend proxy. Serves only the dedicated build.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('dist/ifyoumind-discovery/browser');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  const target=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  if(!target.startsWith(root+'/')){res.writeHead(404);res.end();return;}
  const data=await readFile(target);
  res.writeHead(200,{'content-type':types[extname(target)]||'application/octet-stream','cache-control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.argv[2]||4313),'127.0.0.1',()=>console.log('Local discovery preview at http://127.0.0.1:'+(process.argv[2]||4313)));
