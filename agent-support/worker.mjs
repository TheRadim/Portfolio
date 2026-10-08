// Optional Cloudflare Worker ROUTE in front of the existing GitHub Pages origin.
// Not a Custom Domain worker: fetch(request) must reach the underlying origin.
export function negotiate(accept) {
  const ranges = (accept || '*/*').split(',').map(part => {
    const [type, ...params] = part.trim().toLowerCase().split(';').map(s => s.trim());
    let q = 1, supported = true;
    for (const param of params) {
      const [key, value] = param.split('=');
      if (key === 'q') q = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value) ? Number(value) : 0;
      else supported = false; // No parameterized variants are offered.
    }
    return { type, q: supported ? q : 0 };
  });
  const quality = type => {
    let specificity = -1, q = 0;
    for (const range of ranges) {
      const rank = range.type === type ? 2 : range.type === 'text/*' ? 1 : range.type === '*/*' ? 0 : -1;
      if (rank > specificity) { specificity = rank; q = range.q; }
      else if (rank === specificity && rank >= 0) q = Math.max(q, range.q);
    }
    return q;
  };
  const html = quality('text/html'), markdown = quality('text/markdown');
  return html <= 0 && markdown <= 0 ? null : markdown > html ? 'markdown' : 'html';
}

export async function handle(request, originFetch = fetch) {
  if (!['GET', 'HEAD'].includes(request.method)) return originFetch(request);
  const url = new URL(request.url);
  const markdownFile = new Map([['/', '/index.md'], ['/index.html', '/index.md'], ['/stories.html', '/stories.md']]).get(url.pathname);
  // Fetch a full origin response so conditional requests cannot hide a 404 or
  // make an HTML validator incorrectly validate the Markdown representation.
  const headers = new Headers(request.headers);
  headers.delete('if-none-match'); headers.delete('if-modified-since');
  const origin = await originFetch(new Request(request, { headers, redirect: 'manual' }));
  if (!((markdownFile && origin.status === 200) || origin.status === 404)) return origin;
  const vary = new Set((origin.headers.get('vary') || '').split(',').map(s => s.trim()).filter(Boolean));
  if (![...vary].some(s => ['accept', '*'].includes(s.toLowerCase()))) vary.add('Accept');
  const common = { 'Vary': [...vary].join(', '), 'Cache-Control': 'no-store' };
  const representation = negotiate(request.headers.get('accept'));
  if (!representation) return new Response(request.method === 'HEAD' ? null : 'No acceptable representation. Request text/html or text/markdown.', { status: 406, headers: { ...common, 'Content-Type': 'text/plain; charset=utf-8' } });
  if (representation === 'html') {
    const response = new Response(origin.body, origin);
    for (const [name, value] of Object.entries(common)) response.headers.set(name, value);
    return response;
  }
  const source = new URL(origin.status === 404 ? '/404.md' : markdownFile, url);
  const md = await originFetch(new Request(source, { headers: { Accept: 'text/plain' }, redirect: 'manual' }));
  const text = await md.text();
  if (!md.ok || !text.startsWith('# ')) return new Response('Markdown representation unavailable.', { status: 502, headers: { ...common, 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(request.method === 'HEAD' ? null : text, { status: origin.status, headers: { ...common, 'Content-Type': 'text/markdown; charset=utf-8', Link: '</llms.txt>; rel="describedby"' } });
}
export default { fetch: request => handle(request) };
