(() => {
  'use strict';
  function init() {
    const form=document.getElementById('writeForm'); if(!form)return;
    const message=document.getElementById('writeMessage'),button=document.getElementById('publishButton');
    const files=document.getElementById('postImages'),preview=document.getElementById('imagePreview');
    let requestId=crypto.randomUUID(),busy=false,previewUrls=[];
    const startedAt=Date.now();
    function say(text,error=false){message.textContent=text;message.style.cssText='padding:14px;border-radius:8px;background:'+(error?'#fff1f0':'#edf7ee')+';color:'+(error?'#a21c17':'#205b2b');}
    files.addEventListener('change',()=>{
      previewUrls.forEach(url=>URL.revokeObjectURL(url));previewUrls=[];preview.replaceChildren();
      if(files.files.length>2){say('사진은 최대 2장까지 선택해 주세요.',true);return;}
      for(const file of files.files){
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)){say('JPG·PNG·WEBP 파일만 선택해 주세요.',true);continue;}
        const image=document.createElement('img'),url=URL.createObjectURL(file);previewUrls.push(url);
        image.src=url;image.alt=file.name;image.style.cssText='width:140px;height:100px;object-fit:cover;border-radius:8px';preview.append(image);
      }
    });
    async function compress(file){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('JPG·PNG·WEBP 파일만 첨부할 수 있습니다.');
      if(file.size>10*1024*1024)throw new Error('원본 사진은 장당 10MB 이하여야 합니다.');
      const url=URL.createObjectURL(file),image=new Image();
      try{image.src=url;await image.decode();}catch{throw new Error('사진을 읽을 수 없습니다. JPG 또는 PNG로 다시 저장해 주세요.');}finally{URL.revokeObjectURL(url);}
      const ratio=Math.min(1,1280/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('이 브라우저에서는 사진 압축을 지원하지 않습니다.');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
      let data='';
      for(const quality of [.8,.65,.5,.35,.2]){data=canvas.toDataURL('image/jpeg',quality).split(',')[1];if(data.length<520000)break;}
      if(!data || data.length>=520000)throw new Error('사진 용량을 더 줄인 뒤 다시 선택해 주세요.');
      return {name:file.name.replace(/\.[^.]+$/,'')+'.jpg',type:'image/jpeg',data};
    }
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(busy || !form.reportValidity())return;
      busy=true;button.disabled=true;
      const controls=[...form.querySelectorAll('input,textarea,select')];
      const payload={requestId,startedAt,website:document.getElementById('websiteUrl').value,
        category:document.getElementById('category').value,author:document.getElementById('author').value.trim(),
        title:document.getElementById('title').value.trim(),content:document.getElementById('content').value.trim(),images:[]};
      const selected=[...files.files];controls.forEach(el=>el.disabled=true);
      let timer;
      try{
        if(selected.length>2)throw new Error('사진은 최대 2장까지 선택해 주세요.');
        say('사진 준비 및 저장 중입니다. 창을 닫거나 반복해서 누르지 마세요.');
        for(const file of selected)payload.images.push(await compress(file));
        const controller=new AbortController();timer=setTimeout(()=>controller.abort(),60000);
        const response=await fetch('/.netlify/functions/board',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        const type=response.headers.get('content-type') || '';
        if(!type.includes('application/json'))throw new Error('서버 기능이 아직 배포되지 않았습니다. Netlify 설정과 배포 상태를 확인해 주세요.');
        const data=await response.json();
        if(!response.ok || !data.ok)throw new Error(data.error || '저장하지 못했습니다.');
        say('공용 저장소에 등록되었습니다. 소식 목록으로 이동합니다.');
        location.assign('/news?posted='+encodeURIComponent(data.id));
      }catch(error){
        say(error.name==='AbortError'?'저장 확인 시간이 초과되었습니다. 새로고침하지 말고 잠시 후 같은 화면에서 다시 눌러 주세요. 동일 요청은 중복 등록하지 않습니다.':(error.message || '네트워크 오류입니다. 입력 내용은 남아 있습니다. 같은 화면에서 다시 시도해 주세요.'),true);
        busy=false;button.disabled=false;controls.forEach(el=>el.disabled=false);
      }finally{clearTimeout(timer);}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
