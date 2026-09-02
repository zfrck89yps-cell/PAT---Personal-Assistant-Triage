(() => {
  const NIGEL_WEB='https://chatgpt.com/';
  const NIGEL_APP='chatgpt://';
  const MODE_KEY='pat-mode';
  const WEATHER_KEY='pat-weather';
  let patMode=localStorage.getItem(MODE_KEY)||'normal';

  const cleanText=v=>{let s=String(v||'').trim().replace(/\s+/g,' ');if(s.length>6&&s.length%2===0){const h=s.length/2;if(s.slice(0,h)===s.slice(h))s=s.slice(0,h)}return s};
  const linesBetween=(raw,start,end)=>{const a=raw.indexOf(start);if(a<0)return[];const from=a+start.length,b=raw.indexOf(end,from),chunk=(b<0?raw.slice(from):raw.slice(from,b)).trim();return chunk?chunk.split(/\r?\n/).map(cleanText).filter(Boolean):[]};
  const minsForTask=t=>/reply|email|message|pay|order|book|call|confirm/i.test(t.text||'')?10:/research|compare|sort|clean|pack|organise/i.test(t.text||'')?35:(t.priority===1?30:20);
  const localDateFromStart=v=>{if(!v)return todayISO();const d=new Date(v);return isNaN(d)?String(v).slice(0,10):d.toLocaleDateString('en-CA')};

  function openNigel(){let left=false;const mark=()=>left=true;document.addEventListener('visibilitychange',()=>{if(document.hidden)mark()},{once:true});window.addEventListener('pagehide',mark,{once:true});try{location.href=NIGEL_APP}catch(e){}setTimeout(()=>{if(!left&&!document.hidden)location.href=NIGEL_WEB},900)}
  async function copyAndOpen(prompt,label){try{await navigator.clipboard.writeText(prompt);toast(label||'Handed to Nigel')}catch(e){toast('Opening Nigel')}openNigel()}

  function importSimpleSync(){
    const raw=new URLSearchParams(location.search).get('raw');
    if(!raw)return;
    try{
      const titles=linesBetween(raw,'[CALENDAR]','[STARTS]');
      const starts=linesBetween(raw,'[STARTS]','[REMINDERS]');
      const reminders=linesBetween(raw,'[REMINDERS]','[MAIL]');
      const subjects=linesBetween(raw,'[MAIL]','[MAILBOXES]');
      const mailboxes=linesBetween(raw,'[MAILBOXES]','[END]');
      const inboxMail=subjects.map((subject,i)=>({subject:cleanText(subject),mailbox:cleanText(mailboxes[i]||'')})).filter(m=>/inbox/i.test(m.mailbox));
      state.tasks=state.tasks.filter(t=>t.source!=='Apple Reminders');
      importPayload({
        events:titles.map((title,i)=>({id:`simple-cal-${i}-${title}`,title:cleanText(title),start:starts[i]||'',date:localDateFromStart(starts[i]||''),allDay:false,calendar:'Apple Calendar'})),
        reminders:reminders.map((title,i)=>({id:`simple-rem-${i}-${title}`,title:cleanText(title),due:'',done:false,source:'Apple Reminders'}))
      });
      const keep=state.triage.filter(t=>t.source!=='iCloud Mail');
      const syncedMail=inboxMail.map((m,i)=>{
        const id=`simple-mail-${i}-${m.subject}`;
        return {id,externalId:id,title:m.subject,source:'iCloud Mail',sender:'',note:'',date:'',score:scoreMail({subject:m.subject,sender:'',preview:'',unread:false}),unread:false,mailbox:m.mailbox};
      }).sort((a,b)=>(b.score||0)-(a.score||0));
      state.triage=syncedMail.concat(keep);
      state.lastMailSync=Date.now();
      localStorage.setItem('pat-v2',JSON.stringify(state));
      render();
      history.replaceState({},'',location.pathname);
      toast(`PAT synced · ${syncedMail.length} inbox ${syncedMail.length===1?'email':'emails'}`);
    }catch(e){console.warn('PAT sync failed',e);toast('Sync data could not be read')}
  }

  function installUI(){
    document.querySelectorAll('button').forEach(b=>{if((b.textContent||'').trim()==='Ask PAT'||(b.textContent||'').trim()==='Research with ChatGPT')b.textContent='Ask Nigel'});
    const today=document.querySelector('.screen[data-screen="today"]');if(!today)return;
    const brief=today.querySelector('.brief');
    if(brief&&!document.getElementById('patModes')){const e=document.createElement('div');e.id='patModes';e.className='patModes';e.innerHTML='<button data-mode="normal">Normal</button><button data-mode="quick">Quick wins</button><button data-mode="low">Low energy</button><button data-mode="frog">Get shit done</button>';brief.insertAdjacentElement('afterend',e);e.onclick=ev=>{const b=ev.target.closest('[data-mode]');if(!b)return;patMode=b.dataset.mode;localStorage.setItem(MODE_KEY,patMode);renderAssistant();toast(`Mode: ${b.textContent}`)}}
    const signals=today.querySelector('.signalRow');
    if(signals&&!document.getElementById('patNow')){const e=document.createElement('section');e.id='patNow';e.className='nowPanel';e.innerHTML='<div class="tinyLabel">What should I do now?</div><div class="nowMain" id="nowMain"></div><div class="nowMeta" id="nowMeta"></div>';signals.insertAdjacentElement('afterend',e)}
    if(!document.getElementById('patTimeline')){const e=document.createElement('section');e.id='patTimeline';e.className='patSection';e.innerHTML='<div class="patSectionHead"><b>Today</b><span>your day at a glance</span></div><div class="timeline" id="timelineItems"></div>';document.getElementById('patNow')?.insertAdjacentElement('afterend',e)}
    if(!document.getElementById('patReality')){const e=document.createElement('section');e.id='patReality';e.className='realityStrip';e.innerHTML='<div><span>Reality check</span><b id="realityMain"></b></div><div class="realityMeter"><i id="realityFill"></i></div>';document.getElementById('patTimeline')?.insertAdjacentElement('afterend',e)}
    const st=today.querySelector('.sectionTitle');if(st){if(st.querySelector('span')?.textContent!=='Attention')st.querySelector('span').textContent='Attention';if(st.querySelector('i')?.textContent!=='only what matters')st.querySelector('i').textContent='only what matters'}
    const soft=today.querySelector('.card.soft');if(soft&&!document.getElementById('patNudges')){const e=document.createElement('section');e.id='patNudges';e.className='patNudges';e.innerHTML='<div class="patSectionHead"><b>Heads-up</b><span>proactive nudges</span></div><div id="nudgeItems"></div>';soft.insertAdjacentElement('afterend',e)}
    const card=document.getElementById('canSortCard');const label=card?.querySelector('.label');if(label&&!label.querySelector('.nigelHead'))label.innerHTML='<span class="nigelHead"><span class="nigelPulse"></span><span>Nigel actions</span></span>';
    const capture=document.querySelector('.screen[data-screen="capture"] .card');if(capture&&!document.getElementById('autoSortBrain')){const b=document.createElement('button');b.id='autoSortBrain';b.className='secondary wideBtn autoSort';b.textContent='✦ Auto-sort brain dump';capture.querySelector('.captureGrid')?.insertAdjacentElement('afterend',b);b.onclick=autoSortBrain}
    const settings=document.querySelector('.screen[data-screen="settings"] .card');if(settings&&!document.getElementById('weatherConnection')){const r=document.createElement('div');r.id='weatherConnection';r.className='connection';r.innerHTML='<div><strong>Local weather</strong><small>Used only for contextual nudges</small></div><button class="badge" id="weatherButton">Enable</button>';settings.appendChild(r);r.querySelector('button').onclick=enableWeather}
  }

  function rankTasks(tasks){return tasks.map(t=>{let s=0,m=minsForTask(t);if(t.due&&t.due<todayISO())s+=80;if(t.due===todayISO())s+=50;if(t.priority===1)s+=35;if(patMode==='quick')s+=Math.max(0,35-m);if(patMode==='low')s+=Math.max(0,30-m)+(/reply|email|message|pay|order|book|call|confirm/i.test(t.text||'')?25:0);if(patMode==='frog')s+=m;return{t,s,m}}).sort((a,b)=>b.s-a.s)}
  function nextInfo(s){const now=Date.now();return s.todayEvents.map(e=>({e,time:e.start?new Date(e.start).getTime():Infinity})).filter(x=>x.time>now).sort((a,b)=>a.time-b.time)[0]||null}
  function intelligentSummary(){const host=document.getElementById('dailySummary');if(!host)return;const s=dayState(),next=nextInfo(s),parts=[],open=s.open.length,over=s.overdue.length,due=s.due.length,mail=s.strongMail.length;if(next){const m=Math.max(0,Math.floor((next.time-Date.now())/60000));parts.push(m<=90?`${cleanText(next.e.title)} is the next fixed thing, in about ${m} minutes.`:`The next fixed thing is ${cleanText(next.e.title)} at ${fmtTime(next.e.start)}.`)}else parts.push(s.todayEvents.length?'Your fixed commitments are done for today.':'Nothing is tying your evening down, so you’ve got room to choose what actually earns attention.');if(over)parts.push(`${over} ${plural(over,'job')} ${over===1?'has':'have'} slipped overdue; clear one before starting anything new.`);else if(due)parts.push(`${due} ${plural(due,'job')} ${due===1?'is':'are'} due today, but the load looks manageable.`);else if(open)parts.push(`Nothing is due, so the ${open} open ${plural(open,'job')} ${open===1?'is':'are'} optional rather than urgent.`);else parts.push('There’s no task backlog demanding attention.');if(mail){const top=cleanText(s.strongMail[0]?.title);parts.push(mail===1?`One email looks worth checking: ${top}.`:`I found ${mail} emails that may need action; ${top} looks like the best place to start.`)}host.textContent=parts.join(' ')}
  function renderTimeline(){const h=document.getElementById('timelineItems');if(!h)return;const s=dayState(),rows=[];s.todayEvents.forEach(e=>rows.push({kind:'event',sort:e.start||'0000',time:e.start?fmtTime(e.start):'Today',title:cleanText(e.title),meta:e.calendar||'Calendar'}));s.due.slice(0,5).forEach(t=>rows.push({kind:'task',sort:'9999',time:t.due<todayISO()?'Overdue':'Due',title:cleanText(t.text),meta:t.source||'Task'}));rows.sort((a,b)=>String(a.sort).localeCompare(String(b.sort)));h.innerHTML=rows.length?rows.slice(0,8).map(r=>`<div class="timelineItem ${r.kind}"><div class="timelineTime">${esc(r.time)}</div><div><div class="timelineMain">${esc(r.title)}</div><div class="timelineMeta">${esc(r.meta)}</div></div></div>`).join(''):'<div class="timelineEmpty">Nothing fixed in the diary and nothing due today.</div>'}
  function renderNow(){const a=document.getElementById('nowMain'),b=document.getElementById('nowMeta');if(!a||!b)return;const s=dayState(),ranked=rankTasks(s.open),next=nextInfo(s),now=Date.now(),gap=next?Math.max(0,Math.floor((next.time-now)/60000)):180,c=ranked.find(x=>x.m<=Math.max(10,gap-10))||ranked[0];a.textContent=c?cleanText(c.t.text):(next?`Get ready for ${cleanText(next.e.title)}`:'You have breathing room.');b.textContent=c?`About ${c.m} min · ${next?`${gap} min until ${cleanText(next.e.title)}`:'no fixed commitment pressing'}`:(next?`${gap} min until ${cleanText(next.e.title)}`:'Nothing urgent right now')}
  function renderReality(){const a=document.getElementById('realityMain'),f=document.getElementById('realityFill');if(!a||!f)return;const s=dayState(),mins=s.due.reduce((n,t)=>n+minsForTask(t),0),ratio=mins/180;let txt='Light day — plenty of room.';if(ratio>.45)txt='Manageable, but don’t keep adding jobs.';if(ratio>.8)txt='You’re close to capacity.';if(ratio>1.05)txt='This day is unrealistic. Something needs moving.';a.textContent=txt;f.style.width=`${Math.min(100,Math.round(ratio*100))}%`}
  function renderNudges(){const h=document.getElementById('nudgeItems');if(!h)return;const s=dayState(),n=[],next=nextInfo(s);if(s.overdue.length)n.push(`${s.overdue.length} overdue ${plural(s.overdue.length,'job')} — clear one before adding anything else.`);if(next){const m=Math.floor((next.time-Date.now())/60000);if(m>=0&&m<=60)n.push(`${cleanText(next.e.title)} is in ${m} minutes.`)}if(state.whatsapp.length)n.push(`${state.whatsapp.map(w=>cleanText(w.name)).slice(0,2).join(' and ')} ${state.whatsapp.length===1?'has':'have'} unread WhatsApp.`);if(s.strongMail.length)n.push(`${s.strongMail.length} email ${s.strongMail.length===1?'looks':'look'} actionable.`);h.innerHTML=n.length?n.slice(0,4).map(x=>`<div class="nudge"><span></span>${esc(x)}</div>`).join(''):'<div class="nudge quiet"><span></span>Nothing worth interrupting you for.</div>'}
  function renderAssistant(){installUI();document.querySelectorAll('#patModes button').forEach(b=>b.classList.toggle('active',b.dataset.mode===patMode));intelligentSummary();renderTimeline();renderNow();renderReality();renderNudges();const s=dayState();if(s.pick&&document.getElementById('patPick'))document.getElementById('patPick').textContent=cleanText(s.pick.text)}

  function autoSortBrain(){const box=document.getElementById('brainText'),raw=(box?.value||'').trim();if(!raw)return toast('Nothing to sort');const parts=raw.split(/\n|;|,(?=\s*[A-Za-z])/).map(x=>x.trim()).filter(Boolean);parts.forEach(text=>{/research|compare|find me|look for|best |buy /i.test(text)?state.research.unshift({id:crypto.randomUUID(),text,created:Date.now(),source:'Auto-sort'}):state.tasks.unshift({id:crypto.randomUUID(),text,due:/today|tonight|urgent/i.test(text)?todayISO():'',priority:/urgent|must|important/i.test(text)?1:2,done:false,created:Date.now(),source:'Auto-sort'})});box.value='';save();setTimeout(renderAssistant,0);toast(`${parts.length} ${plural(parts.length,'item')} sorted`)}
  function enableWeather(){const b=document.getElementById('weatherButton');if(!navigator.geolocation)return toast('Location is unavailable');b.textContent='…';navigator.geolocation.getCurrentPosition(async p=>{try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current=temperature_2m&daily=precipitation_probability_max&timezone=auto&forecast_days=1`),d=await r.json();localStorage.setItem(WEATHER_KEY,JSON.stringify({temp:d.current?.temperature_2m??0,rain:d.daily?.precipitation_probability_max?.[0]??0,saved:Date.now()}));b.textContent='Connected';b.classList.add('ready');toast('Weather connected')}catch(e){b.textContent='Enable';toast('Weather could not load')}},()=>{b.textContent='Enable';toast('Location permission not granted')})}

  window.researchWithGPT=async id=>{const r=state.research.find(x=>x.id===id);if(r)await copyAndOpen(`You are Nigel, my AI personal assistant. PAT has handed you this job: ${cleanText(r.text)}. Research it now using current web information where relevant. Give me a concise recommendation and do the work rather than telling me how.`,'Research handed to Nigel')};
  document.addEventListener('click',e=>{const btn=e.target.closest('[data-action="brief"]');if(btn){e.preventDefault();e.stopImmediatePropagation();const s=dayState(),tasks=s.open.map(t=>`- ${cleanText(t.text)}`).join('\n')||'- None',ev=s.todayEvents.map(x=>`- ${cleanText(x.title)} ${x.start?fmtTime(x.start):''}`).join('\n')||'- None',mail=s.strongMail.map(x=>`- ${cleanText(x.title)}`).join('\n')||'- None';copyAndOpen(`You are Nigel, my AI personal assistant. PAT mode is ${patMode}. Give me a concise personal briefing: what matters, what can wait, whether the day is realistic, and what you can actively sort now.\n\nCALENDAR\n${ev}\n\nTASKS\n${tasks}\n\nACTIONABLE MAIL\n${mail}`,'Briefing handed to Nigel');return}setTimeout(renderAssistant,0)},true);
  document.addEventListener('change',()=>setTimeout(renderAssistant,0),true);

  importSimpleSync();
  installUI();
  renderAssistant();
})();