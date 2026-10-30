const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../courseware/V3.0'),port=Number(process.env.PORT)||4180;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.json':'application/json; charset=utf-8'};
http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end('Bad request')}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
 fs.stat(file,(error,stat)=>{
  if(error||!stat.isFile()){res.writeHead(404);return res.end('Not found')}
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
  if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end()}
   const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),stat.size-1):stat.size-1;if(start>=stat.size||end<start){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end()}
   res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});if(req.method==='HEAD')return res.end();return fs.createReadStream(file,{start,end}).pipe(res)
  }
  res.writeHead(200,{...headers,'Content-Length':stat.size});if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res)
 });
}).listen(port,'127.0.0.1',()=>console.log(`山海行歌 V3.0: http://127.0.0.1:${port}`));
