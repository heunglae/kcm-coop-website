(() => {
  'use strict';
  async function init(){
    const body=document.getElementById('postsBody');if(!body)return;
    const input=document.getElementById('searchInput'),tabs=[...document.querySelectorAll('.tab-btn[data-category]')];
    let posts=[],category='',query='';
    const requested=new URLSearchParams(location.search).get('posted') || new URLSearchParams(location.search).get('id');
    function node(tag,text){const el=document.createElement(tag);if(text!=null)el.textContent=String(text);return el;}
    function cell(text){return node('td',text);}
    function show(text){const tr=node('tr'),td=cell(text);td.colSpan=6;td.style.cssText='padding:24px;text-align:center';tr.append(td);body.replaceChildren(tr);}
    function publicUrl(value){
      try{const url=new URL(value,location.origin);if(url.origin!==location.origin)return null;
        if(url.pathname==='/.netlify/functions/board' && url.searchParams.has('image'))return url.href;
        if(/^\/(uploads|images)\//.test(url.pathname) && /\.(jpe?g|png|webp|gif|pdf|hwpx?|docx?|xlsx?|pptx?|zip)$/i.test(decodeURIComponent(url.pathname)))return url.href;
      }catch{}return null;
    }
    function render(){
      const visible=posts.filter(p=>(!category || p.category===category) && [p.title,p.author,p.content].some(s=>String(s || '').toLowerCase().includes(query)));
      if(!visible.length){show('등록된 글 또는 검색 결과가 없습니다.');return;}
      body.replaceChildren();
      visible.forEach((p,index)=>{
        const tr=node('tr'),title=cell(),details=node('details'),summary=node('summary',p.title || '제목 없음');
        title.style.cssText='text-align:left;min-width:230px';summary.style.cssText='cursor:pointer;padding:10px 0;font-weight:600';
        const content=node('p',p.content || '');content.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.8';details.append(summary,content);
        let count=0;
        for(const image of (Array.isArray(p.images)?p.images:[])){
          const url=publicUrl(image?.url);if(!url)continue;count++;
          const photo=node('img');photo.src=url;photo.alt=String(image.name || '첨부 사진');photo.loading='lazy';photo.style.cssText='display:block;max-width:100%;max-height:500px;object-fit:contain;margin:12px 0';
          photo.addEventListener('error',()=>photo.replaceWith(node('p','사진을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.')),{once:true});
          const a=node('a','사진 다운로드 · '+(image.name || '사진.jpg'));a.href=url;a.download='photo.jpg';a.style.cssText='display:block;color:#287438;margin-bottom:18px;text-decoration:underline';
          details.append(photo,a);
        }
        for(const file of (Array.isArray(p.attachments)?p.attachments:[])){
          const url=publicUrl(file?.url);if(!url)continue;
          const a=node('a','첨부파일 · '+String(file.name || '내려받기'));a.href=url;a.download='';a.style.display='block';details.append(a);
        }
        if(String(p.id)===requested)details.open=true;
        title.append(details);tr.append(cell(visible.length-index),cell(p.category),title,cell(p.author),cell(count || '-'),cell(String(p.created_at || p.date || p.createdAt || '').slice(0,10)));body.append(tr);
      });
      const pagination=document.getElementById('pagination');if(pagination)pagination.textContent='총 '+visible.length+'건 · 제목을 누르면 내용과 사진이 열립니다.';
    }
    tabs.forEach(tab=>tab.addEventListener('click',()=>{category=tab.dataset.category || '';tabs.forEach(t=>t.classList.toggle('active',t===tab));render();}));
    function search(){query=(input?.value || '').trim().toLowerCase();render();}
    document.getElementById('boardSearchButton')?.addEventListener('click',search);
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
    const warning=node('p');warning.setAttribute('role','status');warning.style.cssText='padding:12px;color:#9b3a15';
    body.closest('.table-responsive')?.before(warning);
    async function get(url){const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('HTTP '+response.status);return response.json();}
    const results=await Promise.allSettled([get('/.netlify/functions/board').then(d=>{if(!Array.isArray(d.posts))throw new Error('서버 응답 오류');return d.posts;}),get('/data/posts.json').then(d=>{if(!Array.isArray(d))throw new Error('JSON 배열 필요');return d;})]);
    if(results.every(r=>r.status==='rejected')){show('게시글을 불러오지 못했습니다.');warning.textContent='서버 배포와 연결 상태를 확인하고 다시 새로고침해 주세요.';return;}
    const merged=results.flatMap(r=>r.status==='fulfilled'?r.value:[]).filter(p=>p && typeof p==='object');
    const seen=new Set();posts=merged.filter(p=>{const id=String(p.id);if(seen.has(id))return false;seen.add(id);return true;});
    posts.sort((a,b)=>String(b.created_at || b.date || b.createdAt || '').localeCompare(String(a.created_at || a.date || a.createdAt || '')));
    if(results[0].status==='rejected')warning.textContent='새 게시글 저장소에 연결하지 못해 기존 자료만 표시합니다. Netlify Functions 배포와 연결을 확인해 주세요.';
    else if(results[1].status==='rejected')warning.textContent='신규 게시글은 표시했지만 기존 data/posts.json 자료는 읽지 못했습니다.';
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
