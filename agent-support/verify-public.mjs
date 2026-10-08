// Read-only checks of changed resources and negotiated endpoints, following redirects.
import { readFile } from 'node:fs/promises';
const results=[];
for(const host of ['radim-theiner.com','www.radim-theiner.com']) {
  for(const [path,accept] of [['/','text/html'],['/','text/markdown'],['/stories.html','text/markdown'],['/__agent-readiness-missing-20261009','text/markdown'],['/__agent-readiness-missing-20261009','text/html'],['/llms.txt','text/plain'],['/index.md','text/plain'],['/stories.md','text/plain'],['/404.md','text/plain'],['/robots.txt','text/plain'],['/sitemap.xml','application/xml'],['/stories.html','text/html'],['/404.html','text/html']]) {
    try {
      const r=await fetch(`https://${host}${path}`,{headers:{Accept:accept},redirect:'follow',signal:AbortSignal.timeout(20000)});
      const text=await r.text(),type=r.headers.get('content-type')||'',vary=r.headers.get('vary')||'';
      const missing=path.startsWith('/__agent-');let pass=r.status===(missing?404:200);
      if(accept==='text/markdown') pass&&=type.startsWith('text/markdown')&&vary.toLowerCase().split(',').map(x=>x.trim()).includes('accept')&&text.startsWith('# ')&&text.length>20&&(!missing||text.includes('/llms.txt'));
      if(accept==='text/html')pass&&=type.startsWith('text/html')&&/<html/i.test(text);
      if(path==='/'&&accept==='text/html') {const match=text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);pass&&=!!match&&JSON.parse(match[1])['@type']==='Person';}
      if(['/llms.txt','/index.md','/stories.md','/404.md'].includes(path))pass&&=text==await readFile(new URL('..'+path,import.meta.url),'utf8');
      if(path==='/sitemap.xml')pass&&=text.includes('<urlset');
      if(path==='/robots.txt')pass&&=text.includes('User-agent:');
      if(['/stories.html','/404.html'].includes(path)&&accept==='text/html')pass&&=text.includes('rel="describedby"');
      results.push({host,path,accept,status:r.status,type,vary,finalURL:r.url,pass});
    }catch(e){results.push({host,path,accept,pass:false,error:e.message});}
  }
}
console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
