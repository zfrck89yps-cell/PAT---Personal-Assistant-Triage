(() => {
  const isoLocal=d=>{try{return new Date(d).toLocaleDateString('en-CA')}catch(e){return''}};
  const safe=s=>String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const clean=s=>String(s||'').trim().replace(/\s+/g,' ');
  const eventDate=e=>{
    if(e.start){const d=new Date(e.start);if(!isNaN(d))return d.toLocaleDateString('en-CA')}
    return e.date||'';
  };
  function normaliseEventDates(){
    let changed=false;
    state.events=(state.events||[]).map(e=>{
      const d=eventDate(e);
      if(d&&e.date!==d){changed=true;return{...e,date:d}}
      return e;
    });
    if(changed)localStorage.setItem('pat-v2',JSON.stringify(state));
  }
  function normaliseMailQueue(){
    let changed=false;
    state.triage=(state.triage||[]).map(m=>{
      if(m.source!=='iCloud Mail'||m.unread!==true)return m;
      changed=true;
      return {...m,unread:false,score:Math.max(-5,(Number(m.score)||0)-1)};
    });
    if(changed)localStorage.setItem('pat-v2',JSON.stringify(state));
    const mailRow=[...document.querySelectorAll('.connection')].find(r=>r.querySelector('strong')?.textContent==='iCloud Mail');
    const note=mailRow?.querySelector('small');
    if(note)note.textContent='Read + unread · action triage';
  }
  function installWeek(){
    if(document.getElementById('patWeek'))return;
    const anchor=document.getElementById('patReality')||document.getElementById('patTimeline');
    if(!anchor)return;
    const el=document.createElement('section');
    el.id='patWeek';el.className='patWeek';
    el.innerHTML='<div class="patSectionHead"><b>Next 7 days</b><span>calendar overview</span></div><div class="weekDays" id="weekDays"></div>';
    anchor.insertAdjacentElement('afterend',el);
  }
  function renderWeek(){
    installWeek();
    normaliseMailQueue();
    const host=document.getElementById('weekDays');if(!host)return;
    normaliseEventDates();
    const today=new Date();today.setHours(0,0,0,0);
    const days=[];
    for(let i=0;i<7;i++){const d=new Date(today);d.setDate(today.getDate()+i);days.push(d)}
    host.innerHTML=days.map((d,i)=>{
      const key=d.toLocaleDateString('en-CA');
      const events=(state.events||[]).filter(e=>eventDate(e)===key).sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
      const name=i===0?'Today':new Intl.DateTimeFormat('en-GB',{weekday:'short'}).format(d);
      const date=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(d);
      const body=events.length?events.map(e=>`<div class="weekEvent"><span>${e.allDay?'All day':e.start&&typeof fmtTime==='function'?safe(fmtTime(e.start)):''}</span><b>${safe(clean(e.title))}</b></div>`).join(''):'<div class="weekEmpty">Clear</div>';
      return `<div class="weekDay ${i===0?'today':''}"><div class="weekDate"><b>${name}</b><span>${date}</span></div><div class="weekEvents">${body}</div></div>`;
    }).join('');
  }
  setTimeout(renderWeek,0);
  document.addEventListener('click',()=>setTimeout(renderWeek,0),true);
  document.addEventListener('change',()=>setTimeout(renderWeek,0),true);
  window.PAT_renderWeek=renderWeek;
})();