const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../课件');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.mp3':'audio/mpeg','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
 const requested=decodeURIComponent((req.url||'/').split('?')[0]);
 const file=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.stat(file,(err,stat)=>{
  if(err||!stat.isFile()){res.writeHead(404);return res.end('Not found');}
  const range=req.headers.range;
  if(range){const [,a,b]=range.match(/bytes=(\d*)-(\d*)/)||[];const start=Number(a)||0,end=b?Number(b):stat.size-1;res.writeHead(206,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1,'Accept-Ranges':'bytes'});return fs.createReadStream(file,{start,end}).pipe(res);}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
 });
}).listen(4173,'127.0.0.1',()=>console.log('蜀道难预览 http://127.0.0.1:4173'));
