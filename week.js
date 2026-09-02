(() => {
  const safe=s=>String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const clean=s=>String(s||'').trim().replace(/\s+/g,' ');
  const pad=n=>String(n).padStart(2,'0');
  const parseLocalDate=v=>{
    if(!v)return'';
    const raw=clean(v);
    const normal=raw.replace(/\bat\b/gi,' ').replace(/,/g,' ').replace(/\s+/g,' ').trim();
    let d=new Date(normal);
    if(!isNaN(d))return d.toLocaleDateString('en-CA');
    let m=normal.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
    if(m){let y=m[3];if(y.length===2)y=`20${y}`;return `${y}-${pad(m[2])}-${pad(m[1])}`}
    const months={jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12};
    m=normal.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/i);
    if(m){const mo=months[m[2].toLowerCase()];if(mo)return `${m[3]}-${pad(mo)}-${pad(m[1])}`}
    m=normal.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    return m?`${m[1]}-${pad(m[2])}-${pad(m[3])}`:'';
  };
  const eventDate=e=>parseLocalDate(e.start)||e.date||'';

  function normaliseEventDates(){
    let changed=false;
    state.events=(state.events||[]).map(e=>{
      const d=eventDate(e);
      if(d&&e.date!==d){changed=true;return{...e,date:d}}
      return e;
    });
    if(changed){
      localStorage.setItem('pat-v2',JSON.stringify(state));
      if(typeof render==='function')render();
    }
    return changed;
  }

  function refreshTodayTimeline(){
    const host=document.getElementById('timelineItems');if(!host)return;
    const key=new Date().toLocaleDateString('en-CA');
    const events=(state.events||[]).filter(e=>eventDate(e)===key).sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
    const due=(state.tasks||[]).filter(t=>!t.done&&t.due&&t.due<=key).slice(0,5);
    const rows=[];
    events.forEach(e=>rows.push({kind:'event',sort:e.start||'0000',time:e.start&&typeof fmtTime==='function'?fmtTime(e.start):'Today',title:clean(e.title),meta:e.calendar||'Calendar'}));
    due.forEach(t=>rows.push({kind:'task',sort:'9999',time:t.due<key?'Overdue':'Due',title:clean(t.text),meta:t.source||'Task'}));
    rows.sort((a,b)=>String(a.sort).localeCompare(String(b.sort)));
    host.innerHTML=rows.length?rows.slice(0,8).map(r=>`<div class="timelineItem ${r.kind}"><div class="timelineTime">${safe(r.time)}</div><div><div class="timelineMain">${safe(r.title)}</div><div class="timelineMeta">${safe(r.meta)}</div></div></div>`).join(''):'<div class="timelineEmpty">Nothing fixed in the diary and nothing due today.</div>';
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
    normaliseEventDates();
    refreshTodayTimeline();
    const host=document.getElementById('weekDays');if(!host)return;
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