const KEY='pat-v1';
let state=JSON.parse(localStorage.getItem(KEY)||'{"tasks":[],"brain":[]}');
const $=id=>document.getElementById(id);
const save=()=>{localStorage.setItem(KEY,JSON.stringify(state));render();};
const esc=s=>(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const todayISO=()=>new Date().toISOString().slice(0,10);

$('todayDate').textContent=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
$('dueDate').value=todayISO();

function addTask(text,due,priority=2){
  text=text.trim(); if(!text)return;
  state.tasks.unshift({id:crypto.randomUUID(),text,due:due||'',priority:Number(priority),done:false,created:Date.now()}); save();
}

function taskHtml(t){
  const overdue=t.due && t.due<todayISO() && !t.done;
  const meta=[t.due?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(t.due+'T12:00:00')):'',t.priority===1?'High priority':'',overdue?'Overdue':''].filter(Boolean).join(' · ');
  return `<div class="task ${t.done?'done':''}"><input class="check" type="checkbox" ${t.done?'checked':''} onchange="toggleTask('${t.id}')"><div><div class="task-title">${esc(t.text)}</div>${meta?`<div class="meta">${esc(meta)}</div>`:''}</div><button class="delete" onclick="deleteTask('${t.id}')">×</button></div>`;
}

window.toggleTask=id=>{const t=state.tasks.find(x=>x.id===id); if(t){t.done=!t.done;save();}};
window.deleteTask=id=>{state.tasks=state.tasks.filter(x=>x.id!==id);save();};

function render(){
  const open=state.tasks.filter(t=>!t.done);
  $('openCount').textContent=`${open.length} open`;
  const todays=[...open].filter(t=>!t.due||t.due<=todayISO()).sort((a,b)=>a.priority-b.priority||String(a.due).localeCompare(String(b.due)));
  $('todayTasks').innerHTML=todays.length?todays.slice(0,5).map(taskHtml).join(''):'<div class="empty">Nothing screaming for attention. Suspicious.</div>';
  $('allTasks').innerHTML=state.tasks.length?[...state.tasks].sort((a,b)=>Number(a.done)-Number(b.done)||a.priority-b.priority).map(taskHtml).join(''):'<div class="empty">No tasks yet.</div>';
  $('brainItems').innerHTML=state.brain.slice(0,5).map(n=>`<div class="brain">${esc(n.text)}<div class="meta">${new Date(n.created).toLocaleString('en-GB')}</div></div>`).join('');
}

$('addTask').onclick=()=>{addTask($('taskText').value,$('dueDate').value,$('priority').value);$('taskText').value='';};
$('taskText').addEventListener('keydown',e=>{if(e.key==='Enter')$('addTask').click();});
$('saveBrain').onclick=()=>{const text=$('brainText').value.trim();if(!text)return;state.brain.unshift({id:crypto.randomUUID(),text,created:Date.now()});$('brainText').value='';save();};
$('brainToTask').onclick=()=>{addTask($('brainText').value,todayISO(),2);$('brainText').value='';};

function openTaskText(){return state.tasks.filter(t=>!t.done).map(t=>`- ${t.text}${t.due?` (due ${t.due})`:''}${t.priority===1?' [HIGH]':''}`).join('\n');}
$('copyTasks').onclick=async()=>{await navigator.clipboard.writeText(openTaskText()||'No open tasks'); alert('Open tasks copied.');};
$('aiHandoff').onclick=async()=>{
  const prompt=`Act as my practical personal assistant. Here are my current open tasks:\n\n${openTaskText()||'- None'}\n\nDo three things:\n1. Decide what is realistically worth doing today.\n2. Flag anything that needs research, buying, booking or a drafted message.\n3. For anything you can actively help with now, start doing that work rather than just telling me to do it.\n\nKeep it concise and prioritised.`;
  await navigator.clipboard.writeText(prompt);
  window.location.href='https://chatgpt.com/';
};
$('exportData').onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pat-backup.json';a.click();URL.revokeObjectURL(a.href);
};

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
render();
