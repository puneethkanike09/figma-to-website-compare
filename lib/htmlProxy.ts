function buildProxyHeadInjection(targetOrigin: string): string {
  return `
<script data-pixelmatch="api">
(function(){
  var TARGET='${targetOrigin}';
  function toProxy(full){
    return '/api/proxy?url='+encodeURIComponent(full);
  }
  function resolve(u){
    if(typeof u!=='string')return u;
    if(u.indexOf('/api/proxy?url=')===0)return u;
    if(u.charAt(0)==='/')return toProxy(TARGET+u);
    try{
      var origin=window.location.origin;
      if(u.indexOf(origin)===0)return toProxy(TARGET+u.slice(origin.length));
      if(u.indexOf(TARGET)===0)return toProxy(u);
    }catch(e){}
    return u;
  }
  if(window.fetch){
    var nativeFetch=window.fetch;
    window.fetch=function(input,init){
      if(typeof input==='string'){
        var proxied=resolve(input);
        return nativeFetch.call(this,proxied,init);
      }
      if(input&&typeof input.url==='string'){
        var next=resolve(input.url);
        if(next!==input.url){
          return nativeFetch.call(this,new Request(next,input),init);
        }
      }
      return nativeFetch.call(this,input,init);
    };
  }
  if(window.XMLHttpRequest){
    var nativeOpen=XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open=function(method,url){
      arguments[1]=resolve(url);
      return nativeOpen.apply(this,arguments);
    };
  }
})();
</script>
<script data-pixelmatch="guard">
(function(){
  try {
    Object.defineProperty(window,'top',{configurable:true,get:function(){return window.self;}});
    Object.defineProperty(window,'parent',{configurable:true,get:function(){return window.self;}});
    Object.defineProperty(window,'frameElement',{configurable:true,get:function(){return null;}});
  } catch(e) {}
})();
</script>
<script data-pixelmatch="sync">
(function(){
  var SOURCE='pixelmatch';
  function scrollY(){
    return window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0;
  }
  function report(){
    parent.postMessage({source:SOURCE,type:'scroll',y:scrollY()},'*');
  }
  window.addEventListener('scroll',report,{passive:true});
  window.addEventListener('message',function(e){
    var d=e.data;
    if(!d||d.source!=='pixelmatch-parent'||d.type!=='setScroll')return;
    window.scrollTo(0, d.y);
    report();
  });
  function onReady(){
    parent.postMessage({source:SOURCE,type:'loaded'},'*');
    report();
    [100,300,600,1200,2500].forEach(function(ms){setTimeout(report,ms);});
  }
  if(document.readyState==='complete')onReady();
  else window.addEventListener('load',onReady);
  document.addEventListener('DOMContentLoaded',report);
})();
</script>
<style data-pixelmatch="scrollbar">
  html { scrollbar-width: none !important; -ms-overflow-style: none !important; }
  body { scrollbar-width: none !important; -ms-overflow-style: none !important; }
  html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
</style>
`;
}

export function isValidTargetUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function injectProxyHtml(html: string, targetUrl: string): string {
  const parsed = new URL(targetUrl);
  const baseHref = new URL('.', targetUrl).href;
  const baseTag = `<base href="${baseHref}">`;
  const injection = baseTag + buildProxyHeadInjection(parsed.origin);

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${injection}`);
  }

  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${injection}</head>`);
  }

  return `<!DOCTYPE html><html><head>${injection}</head><body>${html}</body></html>`;
}

const PROXY_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 PixelMatch/1.0';

const SKIP_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'accept-encoding',
]);

export function pickForwardHeaders(
  headers: Record<string, string | string[] | undefined>
): Record<string, string> {
  const forward: Record<string, string> = {
    'User-Agent': PROXY_USER_AGENT,
    'Accept-Language': 'en-US,en;q=0.9',
  };

  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (SKIP_REQUEST_HEADERS.has(lower) || value === undefined) continue;
    forward[lower] = Array.isArray(value) ? value.join(', ') : value;
  }

  if (!forward.accept) {
    forward.accept = '*/*';
  }

  return forward;
}

export interface ProxyRequestInit {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: Buffer | string | null;
}

export async function fetchProxiedResource(
  targetUrl: string,
  init: ProxyRequestInit = {}
): Promise<{
  body: Buffer;
  contentType: string;
  status: number;
}> {
  const parsed = isValidTargetUrl(targetUrl);
  if (!parsed) {
    throw new Error('Invalid URL');
  }

  const method = (init.method || 'GET').toUpperCase();
  const headers = pickForwardHeaders(init.headers || {});

  const response = await fetch(parsed.href, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : init.body ?? undefined,
    redirect: 'follow',
  });

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const rawBuffer = Buffer.from(await response.arrayBuffer());

  if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
    const html = rawBuffer.toString('utf-8');
    return {
      body: Buffer.from(injectProxyHtml(html, parsed.href), 'utf-8'),
      contentType: 'text/html; charset=utf-8',
      status: response.status,
    };
  }

  return {
    body: rawBuffer,
    contentType,
    status: response.status,
  };
}

/** @deprecated use fetchProxiedResource */
export async function fetchProxiedHtml(targetUrl: string) {
  const result = await fetchProxiedResource(targetUrl);
  return {
    body: result.body.toString('utf-8'),
    contentType: result.contentType,
    status: result.status,
  };
}
