(() => {
  const NIGEL_WEB='https://chatgpt.com/';
  const NIGEL_APP='chatgpt://';

  function openNigel(){
    let left=false;
    const markLeft=()=>{left=true};
    document.addEventListener('visibilitychange',()=>{if(document.hidden)markLeft()},{once:true});
    window.addEventListener('pagehide',markLeft,{once:true});
    try{window.location.href=NIGEL_APP}catch(e){}
    setTimeout(()=>{if(!left&&!document.hidden)window.location.href=NIGEL_WEB},900);
  }

  async function copyAndOpen(prompt,label='Handed to Nigel'){
    try{await navigator.clipboard.writeText(prompt);if(typeof toast==='function')toast(label)}catch(e){if(typeof toast==='function')toast('Opening Nigel')}
    openNigel();
  }

  function renameNigelUI(){
    document.querySelectorAll('button').forEach(b=>{
      const t=(b.textContent||'').trim();
      if(t==='Ask PAT') b.textContent='Ask Nigel';
      if(t==='Research with ChatGPT') b.textContent='Ask Nigel';
    });
  }

  renameNigelUI();
  new MutationObserver(renameNigelUI).observe(document.body,{childList:true,subtree:true});

  window.researchWithGPT=async id=>{
    const r=state.research.find(x=>x.id===id);if(!r)return;
    const p=`You are Nigel, my AI personal assistant. PAT has handed you this job: ${r.text}. Research it now using current web information where relevant. Give me a concise shortlist, prices and links where applicable, and a clear recommendation. Do the work rather than telling me how to do it.`;
    await copyAndOpen(p,'Research handed to Nigel');
  };

  document.addEventListener('click',async e=>{
    const btn=e.target.closest('[data-action="brief"]');
    if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    const tasks=state.tasks.filter(t=>!t.done).map(t=>`- ${t.text}${t.due?` (due ${t.due})`:''}${t.source?` [${t.source}]`:''}`).join('\n')||'- None';
    const ev=dayState().todayEvents.map(x=>`- ${x.title} ${x.allDay?'all day':fmtTime(x.start)}`).join('\n')||'- None';
    const triage=state.triage.sort((a,b)=>(b.score||0)-(a.score||0)).map(t=>`- ${t.title} [${t.source||'PAT'}${t.score?`, score ${t.score}`:''}]`).concat(state.whatsapp.map(w=>`- Unread WhatsApp from ${w.name}`)).join('\n')||'- None';
    const research=state.research.map(r=>`- ${r.text}`).join('\n')||'- None';
    const p=`You are Nigel, my AI personal assistant. PAT has collected my current day below. Give me a concise personal briefing, not a list dump. Tell me what the day looks like, what genuinely matters, what can wait, and what you can actively sort for me now.\n\nCALENDAR\n${ev}\n\nTASKS & REMINDERS\n${tasks}\n\nPOSSIBLE ACTIONS / UNREADS\n${triage}\n\nRESEARCH QUEUE\n${research}\n\nIf you can actively research, compare, draft or plan something now, start doing it.`;
    await copyAndOpen(p,'Briefing handed to Nigel');
  },true);
})();
