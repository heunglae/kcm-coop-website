import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const categories = new Set(['공지사항','활동소식','자유게시판','문의사항']);
const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function json(data,status=200) { return new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}}); }
function failure(message,status=400) { const error = new Error(message); error.status = status; throw error; }
function text(value,max,name) { if(typeof value !== 'string' || !value.trim() || value.trim().length>max) failure(name+' 입력을 확인해 주세요.'); return value.trim(); }
function passwordMatches(value, expected) {
  if(typeof value !== 'string' || value.length>256) return false;
  const hash = s => createHash('sha256').update(s).digest();
  return timingSafeEqual(hash(value),hash(expected));
}
function validateImage(image) {
  if(!image || typeof image.data !== 'string' || image.data.length>550000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)) failure('첨부 사진 형식 또는 크기가 올바르지 않습니다.');
  const bytes = Buffer.from(image.data,'base64');
  if(bytes.length<4 || bytes.length>400000) failure('첨부 사진은 압축 후 장당 400KB 이하여야 합니다.');
  const jpeg = bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff;
  if(!jpeg || image.type !== 'image/jpeg') failure('사이트의 사진 선택 기능으로 JPG·PNG·WEBP를 다시 선택해 주세요.');
  return {bytes:Uint8Array.from(bytes).buffer,name:String(image.name || '사진.jpg').slice(0,160)};
}
export function createBoardHandler(storeFactory=getStore) {
  return async function(req) {
    try {
      const url = new URL(req.url);
      if(!['GET','POST'].includes(req.method)) return json({error:'허용되지 않은 요청입니다.'},405);
      // No credentials or private configuration are sent to the browser.
      if(req.method==='POST') {
        const expected = process.env.BOARD_WRITE_PASSWORD;
        if(!expected || expected.length<16) return json({error:'Netlify에 BOARD_WRITE_PASSWORD를 16자 이상으로 설정하고 다시 배포해 주세요.'},503);
        const origin = req.headers.get('origin');
        const allowed = new Set([url.origin,'https://kcmcoops.kr','https://www.kcmcoops.kr',process.env.URL].filter(Boolean));
        if(origin && !allowed.has(origin)) return json({error:'허용되지 않은 사이트의 요청입니다.'},403);
        if(!req.headers.get('content-type')?.includes('application/json')) return json({error:'JSON 요청이 필요합니다.'},415);
        const raw = await req.text();
        if(Buffer.byteLength(raw)>1200000) return json({error:'사진 용량이 너무 큽니다. 사진 수나 크기를 줄여 주세요.'},413);
        let input; try {input=JSON.parse(raw);} catch {return json({error:'입력 형식이 잘못되었습니다.'},400);}
        if(!input || typeof input!=='object') failure('입력 형식을 확인해 주세요.');
        if(!passwordMatches(input.password,expected)) return json({error:'관리자 작성 비밀번호가 일치하지 않습니다.'},401);
        const id = String(input.requestId || '');
        if(!UUID.test(id)) failure('요청 번호가 잘못되었습니다. 페이지를 새로 열어 주세요.');
        const category = text(input.category,30,'카테고리');
        if(!categories.has(category)) failure('지원하지 않는 카테고리입니다.');
        const post = {id,category,author:text(input.author,80,'작성자'),title:text(input.title,200,'제목'),content:text(input.content,20000,'내용'),created_at:new Date().toISOString(),images:[]};
        const images = input.images ?? [];
        if(!Array.isArray(images) || images.length>2) failure('사진은 최대 2장까지 첨부할 수 있습니다.');
        const validated = images.map(validateImage);
        const store = storeFactory({name:'kcm-board-v1',consistency:'strong'});
        const existing = await store.get('posts/'+id,{type:'json'});
        if(existing) return json({ok:true,id:existing.id,alreadySaved:true});
        // Image objects are written before the visible post. If interrupted, retrying
        // with the same requestId finishes the post instead of creating a duplicate.
        for(let i=0;i<validated.length;i++) {
          const file = validated[i],key='images/'+id+'/'+i+'.jpg';
          await store.set(key,file.bytes,{metadata:{type:'image/jpeg',name:file.name},onlyIfNew:true});
          post.images.push({url:'/.netlify/functions/board?image='+encodeURIComponent(id+'/'+i+'.jpg'),name:file.name});
        }
        await store.setJSON('posts/'+id,post,{onlyIfNew:true});
        const saved = await store.get('posts/'+id,{type:'json'});
        if(!saved) failure('저장 확인에 실패했습니다. 같은 화면에서 다시 등록해 주세요.',503);
        return json({ok:true,id:saved.id},201);
      }
      const store = storeFactory({name:'kcm-board-v1',consistency:'strong'});
      const image = url.searchParams.get('image');
      if(image) {
        const [id,filename,...rest] = image.split('/');
        if(!UUID.test(id || '') || !/^[01]\.jpg$/.test(filename || '') || rest.length) return json({error:'잘못된 사진 경로입니다.'},400);
        const found = await store.getWithMetadata('images/'+image,{type:'arrayBuffer'});
        if(!found) return json({error:'사진을 찾을 수 없습니다.'},404);
        return new Response(found.data,{headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Content-Disposition':'inline'}});
      }
      const listed = await store.list({prefix:'posts/'});
      const posts = [];
      // Batch requests to avoid opening an unbounded number of reads at once.
      for(let start=0;start<listed.blobs.length;start+=10) {
        const items = await Promise.all(listed.blobs.slice(start,start+10).map(blob=>store.get(blob.key,{type:'json'})));
        posts.push(...items.filter(Boolean));
      }
      posts.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
      return json({posts});
    } catch(error) {
      if(!error.status) console.error('Board storage request failed:',error.name);
      return json({error:error.status ? error.message : '공용 저장소 연결에 실패했습니다. Netlify Functions 설정과 로그를 확인해 주세요.'},error.status || 503);
    }
  };
}
export default createBoardHandler();
