import {seed,locations,categories,issueTypes} from './data.js';
import {STATUSES,PRIORITIES,findDuplicates,metrics,linkReport,canTransition,csv,escapeHtml as e} from './domain.js';
import * as dbApi from './supabase.js';
const {supabase,fetchAllData,createReport:apiCreateReport,createCaseFromReport:apiCreateCase,linkReportToCase:apiLinkReport,updateCase:apiUpdateCase,setTechAvailability:apiSetTechAvailability,updateUserProfile:apiUpdateProfile,updateCampusSettings:apiUpdateSettings,addTechnician:apiAddTechnician,addAsset:apiAddAsset,signIn,signUp,signInWithGoogle,signOut,getCurrentUserProfile} = (typeof dbApi!=='undefined'?dbApi:{});

const KEY='fixtrack.workspace.v1';
let db;
try{
  db=JSON.parse(localStorage.getItem(KEY));
  if(!db||db.version!==1)db=seed();
}catch{
  db=seed();
}

let role=sessionStorage.getItem('fixtrack.role')||'admin';
let route=location.pathname,filter='all',query='',categoryFilter='all',view='table',range=7,formStep=1,draft={},mobileMenu=false;
let authTab='signin';
let currentUser=null;

const paths={
  grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  layers:'m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5',
  report:'M8 3h8l4 4v14H4V3z M8 11h8 M8 15h5 M14 3v5h6',
  tool:'M14.7 6.3a5 5 0 0 0-6.4-2L11 7l-4 4-2.7-2.7a5 5 0 0 0 6.4 6.4l6.8 6.8 4-4-6.8-6.8a5 5 0 0 0-0-4.4z',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  building:'M4 21V3h12v18 M16 9h4v12 M8 7h4 M8 11h4 M8 15h4 M2 21h20 M8 21v-3h4v3',
  chart:'M3 3v18h18 M7 16v-4 M12 16V7 M17 16v-7',
  settings:'m9 3-1 3-3 1-2 4 2 2v3l3 2 1 3h6l1-3 3-2v-3l2-2-2-4-3-1-1-3z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  help:'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  search:'m21 21-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  arrow:'M5 12h14 m-5-5 5 5-5 5',
  down:'m6 9 6 6 6-6',
  plus:'M12 5v14 M5 12h14',
  check:'m5 12 4 4L19 6',
  clock:'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  alert:'m12 3 10 18H2z M12 9v5 M12 17h.01',
  chevron:'m9 5 7 7-7 7',
  close:'m6 6 12 12 M6 18 18 6',
  filter:'M4 6h16 M7 12h10 M10 18h4',
  calendar:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16',
  download:'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5',
  pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  link:'m10 13 4-4 M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0 M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
  monitor:'M3 3h18v14H3z M8 21h8 M12 17v4',
  bolt:'m13 2-9 12h7l-1 8 10-13h-8z',
  drop:'M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14z',
  chair:'M6 3h12v9H6z M4 12h16v5H4z M6 17v5 M18 17v5',
  wifi:'M2 8a16 16 0 0 1 20 0 M5 12a11 11 0 0 1 14 0 M8 16a6 6 0 0 1 8 0 M12 20h.01',
  spark:'m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z',
  logout:'M10 4H4v16h6 M10 12h12 m-4-4 4 4-4 4',
  menu:'M4 6h16 M4 12h16 M4 18h16',
  upload:'M12 16V3 m-5 5 5-5 5 5 M4 15v6h16v-6',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  message:'M21 3H3v14h4v5l6-5h8z M7 8h10 M7 12h6',
  shield:'m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6z m-5 10 3 3 5-6',
  refresh:'M20 7v5h-5 M4 17v-5h5 M19 6A8 8 0 0 0 5 7 M5 18a8 8 0 0 0 14-1',
  list:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  mail:'M3 5h18v14H3z m0 0 9 7 9-7',
  user:'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2 M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0'
};

function googleIcon(){
  return `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`;
}

function icon(name,size=20){return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.report}"/></svg>`;}
function btn(label,action,cls='secondary',ico='',extra=''){return `<button class="btn ${cls}" data-action="${action}" ${extra}>${ico?icon(ico,17):''}${label}</button>`;}
function a(label,url,cls='',ico=''){return `<a href="${url}" class="${cls}" data-nav>${ico?icon(ico,18):''}${label}</a>`;}
function loc(id){return locations.find(l=>l.id===id)||locations[0];}
function tech(id){return db.technicians.find(t=>t.id===id||t.uuid===id||t.legacyId===id||t.email===id)||(db.technicians[0]||{name:'Maintenance Staff',initials:'MS',skill:'General',color:'green'});}
function categoryIcon(c){return {'Computer / IT':'monitor',Electrical:'bolt',Plumbing:'drop',Furniture:'chair',Internet:'wifi',Cleaning:'spark'}[c]||'building';}
function color(c){return {'Computer / IT':'blue',Electrical:'orange',Plumbing:'purple',Furniture:'sand',Internet:'blue',Cleaning:'green'}[c]||'green';}
function badge(status){return `<span class="badge status-${e(status)}"><i></i>${STATUSES[status]||e(status)}</span>`;}
function priority(p){return `<span class="priority ${e(p)}"><span class="priority-bars"><i></i><i></i><i></i></span>${e(p.charAt(0).toUpperCase()+p.slice(1))}</span>`;}
function avatar(t,size=''){return `<span class="avatar ${t?.color||'green'} ${size}">${e(t?.initials||t?.name?.split(' ').map(x=>x[0]).join('').slice(0,2)||'NA')}</span>`;}
function time(s){const h=Math.max(0,(Date.now()-new Date(s))/3600000);return h<1?Math.max(1,Math.round(h*60))+'m ago':h<24?Math.floor(h)+'h ago':Math.floor(h/24)+'d ago';}
function date(s){return new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short'});}
function empty(title='Nothing here yet',text='New activity will appear here.',ico='layers'){return `<div class="empty">${icon(ico,38)}<h3>${title}</h3><p>${text}</p></div>`;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));return true;}catch{toast('Browser storage is full. Remove an attachment or export your data.','error');return false;}}

let toastTimer;
function toast(message,type='success'){
  const el=document.querySelector('#toast');
  if(!el)return;
  el.innerHTML=icon(type==='error'?'alert':'check',18)+e(message);
  el.className='show '+type;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.className='',4200);
}

function updateCase(id,fields,action,note){
  const c=db.cases.find(x=>x.id===id);
  if(!c)throw new Error('Case not found');
  if(role==='technician'&&c.assignedTo!=='tech-1'&&c.assignedTo!==currentUser?.id)throw new Error('This job is not assigned to you');
  if(fields.status&&fields.status!==c.status){
    const ownReport=role==='reporter'&&db.reports.some(r=>r.caseId===id&&(r.reporter==='reporter-1'||r.reporter===currentUser?.id));
    const reporterVerification=ownReport&&c.status==='resolved'&&['closed','in_progress'].includes(fields.status);
    if(!reporterVerification&&!canTransition(role,c,fields.status,role==='technician'?(c.assignedTo||'tech-1'):'admin'))throw new Error('That status change is not available for this role');
  }
  Object.assign(c,fields,{updatedAt:new Date().toISOString()});
  db.updates.push({
    id:crypto.randomUUID(),
    caseId:id,
    actor:role==='technician'?(tech(c.assignedTo)?.name||'Technician'):role==='reporter'?(currentUser?.name||db.profile.name):'Maintenance admin',
    action,
    note,
    createdAt:new Date().toISOString()
  });
  save();
}

function navigate(url){
  if(!url.startsWith('/'))return;
  history.pushState({},'',url);
  route=location.pathname;
  filter='all';
  query='';
  categoryFilter='all';
  mobileMenu=false;
  closeModal();
  render();
  window.scrollTo(0,0);
}

const navAdmin=[['Overview','/admin','grid'],['Incoming reports','/admin/reports','report'],['Maintenance cases','/admin/cases','layers'],['Technicians','/admin/technicians','users'],['Locations & assets','/admin/assets','building'],['Reports & analytics','/admin/analytics','chart']];
const navReporter=[['My dashboard','/dashboard','grid'],['Report an issue','/report/new','plus'],['My reports','/my-reports','report'],['Campus issues','/issues','building']];
const navTech=[['My jobs','/technician','tool'],['Repair history','/technician/history','clock'],['Campus issues','/issues','building']];

function active(url){
  if(url==='/admin'||url==='/technician')return route===url;
  return route===url||route.startsWith(url+'/');
}

function shell(content){
  const nav=role==='admin'?navAdmin:role==='technician'?navTech:navReporter;
  const pending=db.reports.filter(r=>!r.caseId).length;
  const title=route==='/profile'?'My profile':route==='/notifications'?'Notifications':route==='/help'?'Help centre':nav.find(n=>active(n[1]))?.[0]||'Case details';
  const displayName=currentUser?.name||db.profile.name||'Campus member';
  const displayRole=role==='admin'?'Maintenance admin':role==='technician'?'Maintenance technician':'Student / staff';

  return `<div class="app-shell ${mobileMenu?'menu-open':''}">
    <aside class="sidebar">
      <a href="/" data-nav class="brand"><span class="brand-mark">F<span>✓</span></span>FixTrack<span class="brand-dot">.</span></a>
      <button class="campus-switch" data-action="workspace">${icon('building',22)}<span><strong>${e(db.settings.campus)}</strong><small>Campus maintenance</small></span>${icon('down',15)}</button>
      <div class="nav-label">${role==='admin'?'WORKSPACE':role==='technician'?'TECHNICIAN PORTAL':'REPORTER PORTAL'}</div>
      <nav>${nav.map(([label,url,ico])=>a(`${label}${url==='/admin/reports'&&pending?`<span class="nav-count">${pending}</span>`:''}`,url,`nav-item ${active(url)?'active':''}`,ico)).join('')}</nav>
      <div class="sidebar-bottom">
        <div class="nav-label">SUPPORT</div>
        ${a('Help centre','/help','nav-item '+(route==='/help'?'active':''),'help')}
        ${a(role==='admin'?'Settings':'My profile',role==='admin'?'/admin/settings':'/profile','nav-item '+(route.endsWith('settings')||route==='/profile'?'active':''),'settings')}
        <div class="sidebar-note">
          <span class="tiny-icon">${icon('spark',17)}</span>
          <strong>One campus. One team.</strong>
          <p>Small fixes make a big difference.</p>
          <a href="/report/new" data-nav>Report something ${icon('arrow',15)}</a>
        </div>
        <button class="profile-button" data-action="workspace">
          ${avatar({name:displayName},'')}
          <span><strong>${e(displayName)}</strong><small>${displayRole}</small></span>
          ${icon('down',15)}
        </button>
      </div>
    </aside>
    <div class="main-shell">
      <header class="topbar">
        <div class="breadcrumb">
          <button class="icon-button mobile-toggle" aria-label="Toggle navigation" data-action="menu">${icon('menu')}</button>
          <span>Workspace</span>${icon('chevron',13)}<strong>${title}</strong>
        </div>
        <div class="top-actions">
          <button class="search-launch" data-action="search">${icon('search',17)}<span>Search anything…</span><kbd>⌘ K</kbd></button>
          <span class="local-label" style="background:#eaf4e6;color:#355f3c;border-color:#cfe3c7"><i style="background:#428250"></i>Connected to Supabase</span>
          <button class="icon-button notification-button" aria-label="Notifications" data-action="notifications">${icon('bell',21)}${unreadCount()?'<i></i>':''}</button>
          <a href="/profile" data-nav aria-label="My profile">${avatar({name:displayName})}</a>
        </div>
      </header>
      <main id="main-content">
        ${content}
        <footer class="app-footer">
          <span>FixTrack <span>·</span> A better campus, together.</span>
          <span>Supabase Cloud Live Data ${icon('shield',13)}</span>
        </footer>
      </main>
    </div>
    <button class="sidebar-scrim" data-action="menu" aria-label="Close navigation"></button>
  </div>`;
}

function heading(eyebrow,title,subtitle,actions=''){return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;}
function stats(items){return `<div class="stats-grid">${items.map(([label,value,ico,sub,tone])=>`<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon ${tone||'green'}">${icon(ico,18)}</span></div><div class="stat-value">${String(value).padStart(2,'0')}<span class="mini-spark ${tone||'green'}">${[12,20,15,26,20,30,24,35].map((h,i)=>`<i style="height:${h}px;opacity:${0.3+i/12}"></i>`).join('')}</span></div><div class="stat-sub">${sub}</div></div>`).join('')}</div>`;}
function statItems(cases=db.cases,reports=db.reports){const m=metrics(cases,reports);return [['Open cases',m.open,'layers','<span class="small-dot green-dot"></span> Across all campus locations','blue'],['Urgent attention',m.urgent,'alert',`${m.urgent?'Prioritize critical & high issues':'No urgent cases right now'}`,'orange'],['In progress',m.progress,'tool','Our team is on it','purple'],['Repairs completed',m.resolved,'check','Resolved or verified & closed','green']];}
function campusArt(){return `<svg class="campus-art" viewBox="0 0 400 180" fill="none" aria-hidden="true"><path d="M5 159h385" stroke="#aac5b9"/><path d="M60 156V80l60-30 60 30v76" fill="#f4f8e9" stroke="#608a77"/><path d="M42 81l78-42 79 42M120 38V15l28 5-28 10" stroke="#608a77" stroke-width="2"/><path d="M180 157V99h133v58" fill="#bdd5bd" stroke="#608a77"/><path d="M193 98V70h106v28" fill="#ecf3dc" stroke="#608a77"/><path d="M212 70V54h68v16" fill="#d9e5c9" stroke="#608a77"/>${[80,115,150].map(x=>`<path d="M${x} 92h13v22h-13z" fill="#b2cdba"/>`).join('')}${[202,237,272].map(x=>`<path d="M${x} 116h19v22h-19z" fill="#f3f5de" stroke="#7ca18b"/>`).join('')}<path d="M108 157v-31a13 13 0 0 1 26 0v31" fill="#86aa92"/><path d="M33 155v-36m-10 7 10 9 11-18 M342 156v-55" stroke="#608a77" stroke-width="2"/><ellipse cx="342" cy="97" rx="20" ry="31" fill="#b5cda7"/><ellipse cx="28" cy="112" rx="17" ry="24" fill="#c7d9b6"/><circle cx="218" cy="27" r="14" fill="#e7dba4"/><path d="m319 35 5-4 5 4m-40-10 5-4 5 4" stroke="#8fa896"/><path d="m359 149 4-5 4 5m-317 3 3-7 4 7" stroke="#608a77"/></svg>`;}
function welcome(){const m=metrics(db.cases,db.reports);return `<div class="welcome-banner"><div><span class="banner-label"><span class="small-dot green-dot"></span> LET’S KEEP CAMPUS RUNNING</span><h2>A little care. A better campus.</h2><p>${m.open?`You have <strong>${m.open} open cases</strong> to keep moving. Here’s the bigger picture.`:'Every reported issue has been closed. Thank you for keeping campus running.'}</p><div class="banner-bottom"><span>${icon('shield',15)} Report. Repair. Resolve.</span><a data-nav href="/admin/cases">View maintenance queue ${icon('arrow',16)}</a></div></div>${campusArt()}</div>`;}
function periodSelect(){return `<label class="period-select">${icon('calendar',16)}<select id="period" aria-label="Activity period"><option value="7" ${range===7?'selected':''}>Last 7 days</option><option value="30" ${range===30?'selected':''}>Last 30 days</option></select></label>`;}
function trendChart(){const count=7,bucket=range/count,day=86400000;const values=Array.from({length:count},(_,i)=>{let end=Date.now()-(count-1-i)*bucket*day,start=end-bucket*day;return{label:new Date(end).toLocaleDateString('en-IN',range===7?{weekday:'short'}:{day:'numeric',month:'short'}),reported:db.reports.filter(r=>new Date(r.createdAt)>=start&&new Date(r.createdAt)<end).length,completed:db.cases.filter(c=>['resolved','closed'].includes(c.status)&&new Date(c.updatedAt)>=start&&new Date(c.updatedAt)<end).length};});const max=Math.max(4,...values.map(v=>v.reported),...values.map(v=>v.completed));return `<div class="chart-summary"><strong>${db.reports.filter(r=>new Date(r.createdAt)>=Date.now()-range*day).length}<small>reports received</small></strong><div class="legend"><span><i class="dark"></i>Reported</span><span><i class="light"></i>Completed</span></div></div><div class="bar-chart"><div class="y-axis"><span>${max}</span><span>${Math.round(max/2)}</span><span>0</span></div><div class="chart-plot">${values.map(v=>`<div class="chart-col"><div class="bars"><div class="bar reported" style="height:${Math.max(2,v.reported/max*100)}%" title="${e(v.label)}: ${v.reported} reports"><span>${v.reported}</span></div><div class="bar completed" style="height:${Math.max(2,v.completed/max*100)}%" title="${v.completed} completed"><span>${v.completed}</span></div></div><span class="x-label">${v.label}</span></div>`).join('')}</div></div>`;}
function workload(){return `<div class="workload-list">${db.technicians.slice(0,3).map(t=>{let jobs=db.cases.filter(c=>c.assignedTo===t.id&&!['closed','resolved'].includes(c.status)).length;return `<a data-nav href="/admin/technicians" class="workload-row">${avatar(t)}<div><strong>${e(t.name)}</strong><small>${e(t.skill)}</small></div><span>${jobs} active</span><div class="workload-track"><i style="width:${Math.min(100,jobs/4*100)}%"></i></div></a>`;}).join('')}</div>`;}
function dashboard(){const pending=db.reports.filter(r=>!r.caseId),dupes=pending.filter(r=>findDuplicates(r,db.cases).length);return heading('CAMPUS OPERATIONS','Maintenance overview','A healthier campus starts with the little things.',`${periodSelect()}${a('Report an issue','/report/new','btn primary','plus')}`)+welcome()+stats(statItems())+`<div class="dashboard-middle"><section class="panel activity-panel"><div class="panel-heading"><div><h2>Maintenance activity</h2><p>Every report is a step towards a better campus.</p></div><span class="subtle-tag">${range} days</span></div>${trendChart()}</section><section class="panel attention-panel"><div class="panel-heading"><h2>Needs your attention</h2><span class="count-circle">${pending.length+metrics(db.cases,db.reports).verification}</span></div><a data-nav href="/admin/reports" class="attention-item"><span class="attention-icon orange">${icon('link')}</span><span><strong>${dupes.length} possible duplicate${dupes.length===1?'':'s'}</strong><small>Review reports that may share a case</small></span>${icon('chevron',17)}</a><a data-nav href="/admin/cases?status=resolved" class="attention-item"><span class="attention-icon green">${icon('shield')}</span><span><strong>${metrics(db.cases,db.reports).verification} repair awaiting verification</strong><small>Confirm the fix. Close the loop.</small></span>${icon('chevron',17)}</a><div class="team-heading"><h3>Team workload</h3>${a('View team','/admin/technicians','','arrow')}</div>${workload()}</section></div><section class="panel"><div class="panel-heading"><div><h2>Maintenance queue <span class="heading-count">${metrics(db.cases,db.reports).open}</span></h2><p>The right attention, where it’s needed most.</p></div>${a('View all cases','/admin/cases','text-link','arrow')}</div>${caseTable(db.cases.filter(c=>c.status!=='closed').sort((a,b)=>PRIORITIES.indexOf(a.priority)-PRIORITIES.indexOf(b.priority)).slice(0,5))}</section>`;}
function caseUrl(c){return role==='technician'?'/technician/jobs/'+c.id:role==='reporter'?'/issues/'+c.id:'/admin/cases/'+c.id;}
function isOverdue(c){return !c.assignedTo&&!['resolved','closed'].includes(c.status)&&(Date.now()-new Date(c.createdAt))/3600000>db.settings.sla;}
function caseTable(cases,privateView=false){if(!cases.length)return empty('No matching cases','Try a different search or filter.');return `<div class="table-scroll"><table class="case-table"><thead><tr><th>Case & issue</th><th>Location</th><th>Priority</th><th>Status</th>${!privateView?'<th>Assigned to</th>':''}<th>Updated</th><th></th></tr></thead><tbody>${cases.map(c=>`<tr><td><div class="case-cell"><span class="category-icon ${color(c.category)}">${icon(categoryIcon(c.category),19)}</span><span><a data-nav href="${caseUrl(c)}" class="case-title">${e(c.title)}</a><small>${e(c.id)} <span>·</span> ${e(c.category)} ${isOverdue(c)?'<span class="overdue-label">Overdue</span>':''} ${db.reports.filter(r=>r.caseId===c.id).length>1?`<span class="linked-mini">${icon('link',11)} ${db.reports.filter(r=>r.caseId===c.id).length}</span>`:''}</small></span></div></td><td><span class="table-room">${e(loc(c.location).room)}</span><small>${e(loc(c.location).building)}</small></td><td>${priority(c.priority)}</td><td>${badge(c.status)}</td>${!privateView?`<td>${c.assignedTo?`<span class="assignee">${avatar(tech(c.assignedTo),'small')}<span>${e(tech(c.assignedTo)?.name?.split(' ')[0]||'Staff')}</span></span>`:'<span class="unassigned">Unassigned</span>'}</td>`:''}<td class="muted nowrap">${time(c.updatedAt)}</td><td><a data-nav href="${caseUrl(c)}" aria-label="Open ${e(c.id)}" class="row-arrow">${icon('chevron',17)}</a></td></tr>`).join('')}</tbody></table></div>`;}
function caseCards(cases){return cases.length?`<div class="case-card-grid">${cases.map(c=>`<a data-nav href="${caseUrl(c)}" class="panel case-card"><div class="flex-between"><span class="category-icon ${color(c.category)}">${icon(categoryIcon(c.category),22)}</span>${priority(c.priority)}</div><small class="case-number">${c.id} · ${e(c.category)}</small><h3>${e(c.title)}</h3><p>${icon('pin',14)} ${e(loc(c.location).room)}</p><div class="card-divider"></div><div class="flex-between">${badge(c.status)}<span class="muted">${time(c.updatedAt)}</span></div></a>`).join('')}</div>`:empty('No matching cases','Try another filter.');}
function filteredCases(cases){return cases.filter(c=>(filter==='all'||(filter==='urgent'?['critical','high'].includes(c.priority)&&c.status!=='closed':filter==='open'?c.status!=='closed':c.status===filter))&&(categoryFilter==='all'||categoryFilter===c.category)&&(`${c.id} ${c.title} ${c.asset} ${loc(c.location).room} ${loc(c.location).building}`.toLowerCase().includes(query.toLowerCase())));}
function filterBar(tabs,placeholder='Search cases, assets or locations…'){return `<div class="filter-toolbar"><div class="tabs" role="tablist" aria-label="Filter by status">${tabs.map(([key,label,count])=>`<button role="tab" aria-selected="${filter===key}" class="tab ${filter===key?'selected':''}" data-action="filter" data-value="${key}">${label}${count!==undefined?`<span>${count}</span>`:''}</button>`).join('')}</div><div class="table-controls"><label class="input-search">${icon('search',17)}<input id="table-search" placeholder="${placeholder}" value="${e(query)}" aria-label="Search records"></label><label class="select-filter">${icon('filter',16)}<select id="category-filter" aria-label="Filter category"><option value="all">All categories</option>${categories.map(c=>`<option ${categoryFilter===c?'selected':''}>${e(c)}</option>`).join('')}</select></label><div class="view-switch"><button class="icon-button ${view==='table'?'selected':''}" data-action="view" data-value="table" aria-label="Table view">${icon('list',17)}</button><button class="icon-button ${view==='grid'?'selected':''}" data-action="view" data-value="grid" aria-label="Grid view">${icon('grid',16)}</button></div></div></div>`;}
function casesPage(){if(new URLSearchParams(location.search).get('status')&&filter==='all')filter=new URLSearchParams(location.search).get('status');const cases=filteredCases(db.cases);return heading('MAINTENANCE','Every issue. One clear picture.','Manage the work that keeps your campus moving.',btn('Export CSV','export-cases','secondary','download')+a('Report an issue','/report/new','btn primary','plus'))+stats(statItems())+`<section class="panel cases-panel">${filterBar([['all','All cases',db.cases.length],['open','Open'],['in_progress','In progress'],['resolved','To verify'],['closed','Closed']])}<div id="case-results">${view==='table'?caseTable(cases):caseCards(cases)}</div><div class="table-footer"><span>Showing ${cases.length} of ${db.cases.length} maintenance cases</span><span>Reports stay linked throughout the repair lifecycle</span></div></section>`;}
function reportsPage(){const incoming=db.reports.filter(r=>!r.caseId);let shown=db.reports.filter(r=>(filter==='all'||filter==='new'&&!r.caseId||filter==='linked'&&r.caseId)&&(`${r.id} ${r.title} ${r.asset}`.toLowerCase().includes(query.toLowerCase()))&&(categoryFilter==='all'||r.category===categoryFilter));return heading('REPORT TRIAGE','Give every report a next step.','Review incoming issues, catch duplicates, and create the right repair job.',btn('Export reports','export-reports','secondary','download'))+`<div class="triage-banner">${icon('link',23)}<div><strong>${incoming.filter(r=>findDuplicates(r,db.cases).length).length} potential duplicate found</strong><p>Review the match before linking. Original reports are always preserved.</p></div><span class="subtle-tag">Human review required</span></div><section class="panel">${filterBar([['all','All reports',db.reports.length],['new','Needs triage',incoming.length],['linked','Linked to case']], 'Search reports…')}<div id="report-results">${reportRows(shown)}</div></section>`;}
function reportRows(reports,mine=false){if(!reports.length)return empty(mine?'No reports yet':'All caught up','New reports will appear here.','report');return `<div class="report-list">${reports.map(r=>{const c=db.cases.find(c=>c.id===r.caseId),matches=!r.caseId?findDuplicates(r,db.cases):[];return `<div class="report-row"><span class="category-icon ${color(r.category)}">${icon(categoryIcon(r.category),22)}</span><div class="report-content"><div class="flex-between"><a data-nav href="${mine?'/my-reports/':'/admin/reports/'}${r.id}" class="case-title">${e(r.title)}</a><small>${time(r.createdAt)}</small></div><p>${e(r.description)}</p><div class="report-meta"><span>${r.id}</span><span>${icon('pin',13)} ${e(loc(r.location).room)}</span>${r.asset?`<span>${e(r.asset)}</span>`:''}${c?badge(c.status):badge('new')}</div></div><div class="report-row-action">${matches.length?`<span class="match-label">${icon('link',13)} ${matches[0].confidence}</span>`:''}${a(c?'View report':'Review report',(mine?'/my-reports/':'/admin/reports/')+r.id,'btn '+(matches.length?'soft':'secondary'),'arrow')}</div></div>`;}).join('')}</div>`;}
function timeline(id){const updates=db.updates.filter(u=>u.caseId===id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));return `<div class="timeline">${updates.map((u,i)=>`<div class="timeline-item"><span class="timeline-dot ${i===0?'latest':''}">${icon(i===0?'check':'clock',13)}</span><div><div class="flex-between"><h4>${e(u.action)}</h4><small>${time(u.createdAt)}</small></div><p>${e(u.note)}</p><small>${e(u.actor)} · ${new Date(u.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small></div></div>`).join('')}</div>`;}

function detailPage(id){
  const c=db.cases.find(x=>x.id===id);
  if(!c)return notFound();
  const reporterMode=role==='reporter',techMode=role==='technician';
  const linked=db.reports.filter(r=>r.caseId===id);
  const canVerify=!techMode&&c.status==='resolved'&&(!reporterMode||linked.some(r=>r.reporter==='reporter-1'||r.reporter===currentUser?.id));
  return `${a('Back to '+(techMode?'my jobs':reporterMode?'campus issues':'maintenance cases'),techMode?'/technician':reporterMode?'/issues':'/admin/cases','back-link','arrow')}${heading(`${c.id} <span class="heading-separator">/</span> ${e(c.category)}`,e(c.title),`${e(loc(c.location).building)} · ${e(loc(c.location).room)}`,badge(c.status))}<div class="detail-layout"><div><section class="panel detail-panel"><div class="panel-heading"><h2>Issue overview</h2>${priority(c.priority)}</div><p class="description">${e(c.description)}</p><div class="detail-fields"><div><small>LOCATION</small><strong>${icon('pin',16)} ${e(loc(c.location).room)}</strong><p>${e(loc(c.location).building)} · ${e(loc(c.location).floor)}</p></div><div><small>ASSET</small><strong>${icon(categoryIcon(c.category),16)} ${e(c.asset||'No specific asset')}</strong><p>${e(c.issueType)}</p></div><div><small>REPORTED ON</small><strong>${date(c.createdAt)}</strong><p>${linked.length} linked report${linked.length===1?'':'s'}</p></div></div>${c.repairNote?`<div class="repair-note">${icon('check',20)}<div><strong>Technician’s completion note</strong><p>${e(c.repairNote)}</p></div></div>`:''}</section><section class="panel"><div class="panel-heading"><h2>Activity timeline</h2><span class="subtle-tag">Full audit history</span></div>${timeline(c.id)}<form id="comment-form" class="comment-form"><input name="note" required maxlength="1000" placeholder="Add a progress note or update…" aria-label="Activity note"><button type="submit" class="btn secondary" data-id="${c.id}">${icon('message',17)}Add note</button><input name="caseId" type="hidden" value="${c.id}"></form></section>${!techMode&&!reporterMode?`<section class="panel"><div class="panel-heading"><h2>Linked reports <span class="heading-count">${linked.length}</span></h2><span class="muted">One repair. Everyone updated.</span></div>${reportRows(linked)}</section>`:''}</div><aside class="detail-aside"><section class="panel padded"><h2>Case management</h2><div class="field"><label>Case status</label>${badge(c.status)}</div><div class="field"><label>Assigned technician</label>${c.assignedTo?`<div class="assigned-card">${avatar(tech(c.assignedTo))}<span><strong>${e(tech(c.assignedTo)?.name||'Staff')}</strong><small>${e(tech(c.assignedTo)?.skill||'Maintenance')}</small></span></div>`:'<p class="muted">Waiting for assignment</p>'}</div>${role==='admin'&&!['closed','resolved'].includes(c.status)?`<div class="field"><label for="case-assignee">Assign to</label><select id="case-assignee"><option value="">Select technician</option>${db.technicians.filter(t=>t.available).map(t=>`<option value="${t.id}" ${t.id===c.assignedTo?'selected':''}>${e(t.name)} · ${e(t.skill)}</option>`).join('')}</select></div><div class="field"><label for="case-priority">Priority</label><select id="case-priority">${PRIORITIES.map(p=>`<option value="${p}" ${p===c.priority?'selected':''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`).join('')}</select></div>${btn('Save assignment','assign','primary full','check',`data-id="${c.id}"`)}`:''}${c.status==='assigned'&&(role==='admin'||techMode&&(c.assignedTo==='tech-1'||c.assignedTo===currentUser?.id))?btn('Start repair','start-job','primary full','tool',`data-id="${c.id}"`):''}${c.status==='in_progress'&&(role==='admin'||techMode&&(c.assignedTo==='tech-1'||c.assignedTo===currentUser?.id))?btn('Mark repair complete','resolve','primary full','check',`data-id="${c.id}"`):''}${canVerify?`<div class="verification-callout"><strong>Ready for a final check</strong><p>Confirm the repair works before closing this case.</p></div>${btn('Verify & close case','verify','primary full','shield',`data-id="${c.id}"`)}${btn('Issue persists · Reopen','reopen','secondary full','refresh',`data-id="${c.id}"`)}`:''}${c.status==='closed'?`<div class="closed-note">${icon('shield',22)}<strong>Repair verified</strong><p>This case is closed. Report a new issue if the asset fails again.</p></div>`:''}</section><section class="panel padded"><h3>Repair journey</h3><div class="journey">${['new','triaged','assigned','in_progress','resolved','closed'].map((s,i)=>`<div class="${Object.keys(STATUSES).indexOf(c.status)>=i?'done':''}"><span>${Object.keys(STATUSES).indexOf(c.status)>=i?icon('check',12):i+1}</span>${STATUSES[s]}</div>`).join('')}</div></section>${c.priority==='critical'?`<div class="safety-card">${icon('alert',21)}<strong>Safety comes first</strong><p>${e(db.settings.emergency)}</p></div>`:''}</aside></div>`;
}

function reportDetail(id){
  const r=db.reports.find(r=>r.id===id);
  if(!r||(role==='reporter'&&r.reporter!=='reporter-1'&&r.reporter!==currentUser?.id))return notFound();
  const c=db.cases.find(c=>c.id===r.caseId),matches=findDuplicates(r,db.cases);
  return a('Back to reports',role==='admin'?'/admin/reports':'/my-reports','back-link','arrow')+heading(`${r.id} / ISSUE REPORT`,e(r.title),`${e(loc(r.location).building)} · ${e(loc(r.location).room)}`,badge(c?.status||'new'))+`<div class="detail-layout"><div><section class="panel padded"><h2>Report details</h2><p class="description">${e(r.description)}</p><div class="detail-fields"><div><small>CATEGORY</small><strong>${e(r.category)}</strong></div><div><small>ASSET / ISSUE TYPE</small><strong>${e(r.asset||'Not specified')}</strong><p>${e(r.issueType)}</p></div><div><small>SUBMITTED</small><strong>${date(r.createdAt)}</strong><p>${e(r.reporterName)}</p></div></div>${r.photo?`<img class="evidence-image" src="${e(r.photo)}" alt="Uploaded issue evidence">`:''}${r.safety?'<div class="safety-inline">Safety concern flagged. '+e(db.settings.emergency)+'</div>':''}</section>${c?`<section class="panel padded"><h2>Linked maintenance case</h2><p>This report is linked to <strong>${c.id}</strong>. Updates are shared with every linked reporter.</p>${a('View repair progress',role==='reporter'?'/issues/'+c.id:'/admin/cases/'+c.id,'btn primary','arrow')}</section><section class="panel"><div class="panel-heading"><h2>Repair timeline</h2></div>${timeline(c.id)}</section>`:role==='admin'?`<section class="panel padded"><h2>Duplicate review</h2><p>Match the asset and the type of fault before linking.</p>${matches.length?matches.map(m=>`<div class="duplicate-card"><div class="flex-between"><span class="match-label">${icon('link',14)}${m.confidence}</span>${badge(m.status)}</div><h3>${e(m.title)}</h3><p>${m.id} · ${e(m.reason)}</p>${btn('Link to this case','link-report','primary','link',`data-report="${r.id}" data-case="${m.id}"`)}</div>`).join(''):empty('No duplicate match','This report can become a separate maintenance case.','shield')}</section>`:`<section class="panel padded"><h2>Your report is in the queue</h2><p>The maintenance admin will review and assign it. You can follow the progress here.</p></section>`}</div><aside><section class="panel padded"><h2>${c?'Report status':'Next step'}</h2>${c?`<p>Linked to ${c.id}</p>${badge(c.status)}`:role==='admin'?`<p>Create a separate case if this report describes a different problem.</p><div class="field"><label for="new-case-priority">Initial priority</label><select id="new-case-priority">${PRIORITIES.map(p=>`<option value="${p}" ${p===(r.safety?'high':'medium')?'selected':''}>${p}</option>`).join('')}</select></div>${btn('Create new case','create-case','primary full','plus',`data-id="${r.id}"`)}`:badge('new')}</section></aside></div>`;
}

function newReport(){const steps=['Location','Issue details','Review & submit'];const building=draft.building||'';const rooms=locations.filter(l=>l.building===building);const types=issueTypes[draft.category||'Computer / IT'];const matches=draft.title?findDuplicates(draft,db.cases):[];return heading('REPORT AN ISSUE','Small report. Real difference.','Tell us what needs attention. We’ll take it from here.')+`<div class="report-form-layout"><section class="panel form-panel"><div class="form-steps">${steps.map((s,i)=>`<div class="form-step ${i+1===formStep?'current':i+1<formStep?'complete':''}"><span>${i+1<formStep?icon('check',15):i+1}</span><strong>${s}</strong></div>`).join('')}</div><form id="issue-form" novalidate><div class="form-body">${formStep===1?`<div class="form-section-number">STEP 01 / 03</div><h2>Where’s the issue?</h2><p>A precise location helps our team get there faster.</p><div class="field"><label for="building">Building <em>*</em></label><select id="building" name="building" required><option value="">Choose a building</option>${[...new Set(locations.map(l=>l.building))].map(b=>`<option ${building===b?'selected':''}>${e(b)}</option>`).join('')}</select></div><div class="field"><label for="location">Room / area <em>*</em></label><select id="location" name="location" required ${!building?'disabled':''}><option value="">Choose a room or area</option>${rooms.map(l=>`<option value="${l.id}" ${draft.location===l.id?'selected':''}>${e(l.room)} · ${e(l.floor)}</option>`).join('')}</select></div><div class="field"><label for="asset">Asset ID <span>Optional</span></label><input id="asset" name="asset" placeholder="e.g. PC-14, FAN-06, PRJ-04" value="${e(draft.asset||'')}" maxlength="60" list="asset-options"><datalist id="asset-options">${db.assets.filter(a=>!draft.location||a.location===draft.location).map(a=>`<option value="${a.id}">${e(a.name)}</option>`).join('')}</datalist><small>Look for the sticker on the equipment.</small></div>`:formStep===2?`<div class="form-section-number">STEP 02 / 03</div><h2>What needs fixing?</h2><p>A few details now can save a lot of time later.</p><div class="form-two-col"><div class="field"><label for="category">Category <em>*</em></label><select name="category" id="category">${categories.map(c=>`<option ${c===(draft.category||'Computer / IT')?'selected':''}>${e(c)}</option>`).join('')}</select></div><div class="field"><label for="issueType">Issue type <em>*</em></label><select name="issueType" id="issueType">${types.map(t=>`<option ${draft.issueType===t?'selected':''}>${e(t)}</option>`).join('')}</select></div></div><div class="field"><label for="title">Issue title <em>*</em></label><input id="title" name="title" required minlength="5" maxlength="120" placeholder="e.g. PC-14 screen stays black" value="${e(draft.title||'')}"></div><div class="field"><label for="description">Description <em>*</em></label><textarea id="description" name="description" required minlength="10" maxlength="2000" rows="4" placeholder="What happened? When did you first notice it?">${e(draft.description||'')}</textarea><small>At least 10 characters. Avoid including personal information.</small></div><div class="field"><label for="photo">Add a photo <span>Optional · PNG, JPEG or WebP · max 1 MB</span></label><label class="upload-zone" for="photo">${draft.photo?`<img src="${draft.photo}" alt="Photo preview">`:`${icon('upload',26)}<strong>Click to upload a photo</strong><small>A clear photo helps us understand the problem.</small>`}<input id="photo" type="file" accept="image/png,image/jpeg,image/webp"></label>${draft.photo?btn('Remove photo','remove-photo','text-button'):''}</div><label class="safety-checkbox"><input type="checkbox" name="safety" ${draft.safety?'checked':''}><span>${icon('alert',19)}<strong>This may be a safety hazard</strong><small>Examples: exposed wiring, sparks or major flooding.</small></span></label>`:`<div class="form-section-number">STEP 03 / 03</div><h2>Ready to send?</h2><p>Give these details a quick check.</p><div class="review-report"><span class="category-icon ${color(draft.category)}">${icon(categoryIcon(draft.category),24)}</span><h3>${e(draft.title)}</h3><p>${e(draft.description)}</p><dl><dt>Location</dt><dd>${e(loc(draft.location).building)} · ${e(loc(draft.location).room)}</dd><dt>Asset</dt><dd>${e(draft.asset||'Not specified')}</dd><dt>Category</dt><dd>${e(draft.category)} · ${e(draft.issueType)}</dd><dt>Safety concern</dt><dd>${draft.safety?'Yes · requires attention':'No'}</dd></dl>${draft.photo?`<img class="evidence-image" src="${draft.photo}" alt="Issue photo">`:''}</div>${matches.length?`<div class="duplicate-notice">${icon('link',22)}<div><strong>A similar issue has already been reported</strong><p>${e(matches[0].title)} · ${matches[0].id}</p><small>Your report will still be saved. An admin will review whether to link it.</small></div></div>`:''}<label class="consent"><input type="checkbox" name="confirm" required> I’ve checked the details and they accurately describe the issue.</label>`}</div><div class="form-actions">${formStep>1?btn('Back','form-back','secondary','arrow'):a('Cancel',role==='admin'?'/admin':'/dashboard','btn secondary')}<span class="muted">${formStep} of 3 steps</span><button class="btn primary" type="submit">${formStep===3?'Submit report':'Continue'}${icon(formStep===3?'check':'arrow',17)}</button></div></form></section><aside class="form-aside"><div class="form-illustration">${campusArt()}<h3>A campus that cares.</h3><p>From a flickering light to a broken computer, every report helps.</p></div><div class="tips"><h3>Make your report count</h3>${[['pin','Be specific about the location'],['monitor','Include an asset ID if you can'],['report','Describe the fault, not just the symptom'],['eye','Keep photos clear and relevant']].map(([ico,t])=>`<div>${icon(ico,18)}<span>${t}</span></div>`).join('')}</div><div class="safety-card">${icon('alert',21)}<strong>Immediate danger?</strong><p>${e(db.settings.emergency)} Don’t wait for this form to be reviewed.</p></div><div class="local-explanation">${icon('shield',17)} Connected to Supabase live database. Reports sync across campus.</div></aside></div>`;}

function reporterDashboard(){
  const reports=db.reports.filter(r=>r.reporter==='reporter-1'||r.reporter===currentUser?.id);
  const cases=db.cases.filter(c=>reports.some(r=>r.caseId===c.id));
  const m=metrics(cases,reports);
  const firstName=(currentUser?.name||db.profile.name||'Student').split(' ')[0];
  return heading('YOUR CAMPUS, YOUR VOICE',`Good ${new Date().getHours()<12?'morning':'afternoon'}, ${e(firstName)}.`,'Thanks for looking out for your campus.',a('Report an issue','/report/new','btn primary','plus'))+`<div class="reporter-hero"><div><span class="banner-label">NOTICE SOMETHING THAT NEEDS CARE?</span><h2>Let’s make it better,<br>together.</h2><p>Report an issue in a few simple steps.<br>Follow every update, right through to the fix.</p>${a('Report a new issue','/report/new','btn primary','plus')}${a('Explore campus issues','/issues','text-link','arrow')}</div>${campusArt()}</div>`+stats([['My reports',reports.length,'report','Your contribution to a better campus','blue'],['In progress',m.progress,'tool','Repairs currently underway','purple'],['Awaiting verification',m.verification,'shield','Your confirmation closes the loop','orange'],['Repairs completed',m.resolved,'check','Fixed with your help','green']])+`<section class="panel"><div class="panel-heading"><div><h2>Your recent reports</h2><p>A clear view of what’s happening next.</p></div>${a('View all reports','/my-reports','text-link','arrow')}</div>${reportRows(reports.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4),true)}</section>`;
}

function myReports(){
  const reports=db.reports.filter(r=>r.reporter==='reporter-1'||r.reporter===currentUser?.id);
  const shown=reports.filter(r=>{
    const c=db.cases.find(c=>c.id===r.caseId);
    return (filter==='all'||filter==='open'&&c?.status!=='closed'||filter==='closed'&&c?.status==='closed')&&(`${r.id} ${r.title}`.toLowerCase().includes(query.toLowerCase()))&&(categoryFilter==='all'||r.category===categoryFilter);
  });
  return heading('MY REPORTS','Your reports, from start to fixed.','Track progress, follow updates, and verify completed repairs.',a('Report an issue','/report/new','btn primary','plus'))+`<section class="panel">${filterBar([['all','All reports',reports.length],['open','Open'],['closed','Closed']],'Search your reports…')}<div id="report-results">${reportRows(shown,true)}</div></section>`;
}

function campusIssues(){const shown=filteredCases(db.cases);return heading('CAMPUS PULSE','A shared view of a better campus.','See what’s being repaired across campus. Reporter details stay private.',a('Report an issue','/report/new','btn primary','plus'))+`<section class="panel">${filterBar([['all','All issues',db.cases.length],['open','Open'],['in_progress','In progress'],['closed','Closed']])}<div id="case-results">${view==='grid'?caseCards(shown):caseTable(shown,true)}</div></section>`;}

function technicianPage(history=false){
  const techId=currentUser?.id||'tech-1';
  const jobs=db.cases.filter(c=>(c.assignedTo==='tech-1'||c.assignedTo===techId)&&(['closed','resolved'].includes(c.status)===history));
  const shown=jobs.filter(c=>(filter==='all'||c.status===filter)&&(`${c.title} ${c.id}`.toLowerCase().includes(query.toLowerCase()))&&(categoryFilter==='all'||c.category===categoryFilter));
  const techName=currentUser?.name||'Arjun';
  return heading('TECHNICIAN WORKSPACE',history?'Good work leaves a trail.':'Your next fix starts here.',history?'A record of your completed repairs and verification status.':`Hi ${e(techName)}. Here’s what needs your expertise today.`,history?btn('Export history','export-jobs','secondary','download'):a('View repair history','/technician/history','btn secondary','clock'))+(!history?stats([['Assigned to me',jobs.length,'tool','Your active work orders','blue'],['Ready to start',jobs.filter(c=>c.status==='assigned').length,'clock','Pick up your next repair','orange'],['In progress',jobs.filter(c=>c.status==='in_progress').length,'refresh','Jobs you’re working on','purple'],['Repairs completed',db.cases.filter(c=>(c.assignedTo==='tech-1'||c.assignedTo===techId)&&['closed','resolved'].includes(c.status)).length,'check','Thank you for making a difference','green']]):'')+`<section class="panel">${filterBar(history?[['all','All completed',jobs.length],['resolved','Awaiting verification'],['closed','Verified & closed']]:[['all','All my jobs',jobs.length],['assigned','Assigned'],['in_progress','In progress']])}<div class="jobs-grid">${shown.length?shown.map(c=>`<article class="job-card"><div class="flex-between">${priority(c.priority)}${badge(c.status)}</div><small>${c.id} · ${e(c.category)}</small><h2>${e(c.title)}</h2><p>${icon('pin',15)} ${e(loc(c.location).room)} · ${e(loc(c.location).building)}</p><p class="job-description">${e(c.repairNote||c.description)}</p><div class="flex-between"><span class="muted">Updated ${time(c.updatedAt)}</span>${a(history?'View repair':'Open work order','/technician/jobs/'+c.id,'btn '+(c.priority==='high'?'primary':'secondary'),'arrow')}</div></article>`).join(''):empty('No jobs in this view','Assigned work orders appear here.','tool')}</div></section>`;
}

function techniciansPage(){return heading('YOUR MAINTENANCE TEAM','The people behind every fix.','Match the right expertise to the right repair.',btn('Add team member','add-tech','primary','plus'))+`<div class="team-grid">${db.technicians.map(t=>{const active=db.cases.filter(c=>(c.assignedTo===t.id||c.assignedTo===t.legacyId)&&!['resolved','closed'].includes(c.status));const completed=db.cases.filter(c=>(c.assignedTo===t.id||c.assignedTo===t.legacyId)&&['resolved','closed'].includes(c.status)).length;return `<article class="panel team-card"><div class="flex-between"><span class="subtle-tag">${e(t.skill)}</span><button class="availability ${t.available?'available':''}" data-action="availability" data-id="${t.id}" aria-label="Change availability of ${e(t.name)}"><i></i>${t.available?'Available':'Off duty'}</button></div>${avatar(t,'large')}<h2>${e(t.name)}</h2><p>${e(t.email)}</p><div class="team-stats"><div><strong>${active.length}</strong><small>Active jobs</small></div><div><strong>${completed}</strong><small>Completed</small></div></div><div class="workload-label"><span>Current workload</span><strong>${active.length}/4 jobs</strong></div><div class="progress-track"><i style="width:${Math.min(active.length/4*100,100)}%"></i></div>${btn('View assigned work','tech-jobs','secondary full','tool',`data-id="${t.id}"`)}</article>`;}).join('')}</div><div class="info-strip">${icon('help',19)} Availability and workload support assignment decisions. Admins confirm every assignment.</div>`;}

function assetsPage(){const shown=db.assets.filter(a=>(categoryFilter==='all'||a.category===categoryFilter)&&(`${a.name} ${a.id} ${loc(a.location).building}`.toLowerCase().includes(query.toLowerCase())));return heading('CAMPUS DIRECTORY','Know your campus. Care for it.','Locations, equipment, and the repair history behind each asset.',btn('Add an asset','add-asset','primary','plus'))+`<div class="location-overview">${[...new Set(locations.map(l=>l.building))].map((b,i)=>`<div class="location-card"><span class="category-icon ${['green','blue','purple','sand','orange'][i%5]}">${icon('building',23)}</span><strong>${e(b)}</strong><small>${locations.filter(l=>l.building===b).length} areas · ${db.assets.filter(a=>loc(a.location).building===b).length} assets</small></div>`).join('')}</div><section class="panel"><div class="panel-heading"><div><h2>Asset directory <span class="heading-count">${db.assets.length}</span></h2><p>Identify repeat faults before they become bigger problems.</p></div></div>${filterBar([['all','All equipment']], 'Search asset ID, name or building…')}<div id="asset-results">${assetTable(shown)}</div></section>`;}

function assetTable(assets){return assets.length?`<div class="table-scroll"><table><thead><tr><th>Asset</th><th>Location</th><th>Category</th><th>Repair records</th><th>Open issues</th><th></th></tr></thead><tbody>${assets.map(a=>{let records=db.cases.filter(c=>c.asset===a.id),open=records.filter(c=>c.status!=='closed');return `<tr><td><div class="case-cell"><span class="category-icon ${color(a.category)}">${icon(categoryIcon(a.category),21)}</span><span><strong>${e(a.name)}</strong><small>${e(a.id)}</small></span></div></td><td>${e(loc(a.location).room)}<small>${e(loc(a.location).building)}</small></td><td>${e(a.category)}</td><td>${records.length} ${records.length>1?'<span class="repeat-tag">Repeat fault</span>':''}</td><td>${open.length?`<span class="badge status-assigned">${open.length} active</span>`:'<span class="muted">No open issues</span>'}</td><td>${btn('History','asset-history','text-button','arrow',`data-id="${e(a.id)}"`)}</td></tr>`;}).join('')}</tbody></table></div>`:empty('No assets found','Try another search.','monitor');}

function analyticsPage(){const byCat=categories.map(c=>({name:c,count:db.cases.filter(x=>x.category===c).length})).filter(x=>x.count);const done=db.cases.filter(c=>['resolved','closed'].includes(c.status));const avg=done.length?Math.round(done.reduce((s,c)=>s+(new Date(c.updatedAt)-new Date(c.createdAt))/3600000,0)/done.length):0;const repeated=db.assets.filter(a=>db.cases.filter(c=>c.asset===a.id).length>1);return heading('REPORTS & ANALYTICS','Better insight. Better maintenance.','Understand what’s working, and where your campus needs more care.',periodSelect()+btn('Export analytics','export-analytics','secondary','download'))+stats([['Reports received',db.reports.length,'report',`${db.cases.length} distinct maintenance cases`,'blue'],['Average repair time',avg,'clock','Hours · completed repairs only','purple'],['Repairs completed',done.length,'check',`${Math.round(done.length/db.cases.length*100)}% of all maintenance cases`,'green'],['Repeat-fault assets',repeated.length,'refresh','Assets with more than one case','orange']])+`<div class="analytics-grid"><section class="panel"><div class="panel-heading"><div><h2>Reports & repairs over time</h2><p>Activity in the last ${range} days</p></div></div>${trendChart()}</section><section class="panel"><div class="panel-heading"><div><h2>Issues by category</h2><p>Where the work is happening</p></div></div><div class="category-bars">${byCat.map(c=>`<div><span>${icon(categoryIcon(c.name),17)}${e(c.name)}<strong>${c.count}</strong></span><div><i style="width:${c.count/db.cases.length*100}%"></i></div></div>`).join('')}</div></section></div><section class="panel"><div class="panel-heading"><div><h2>Team performance</h2><p>Measured from recorded repairs, not estimates.</p></div></div><div class="table-scroll"><table><thead><tr><th>Technician</th><th>Specialization</th><th>Active jobs</th><th>Completed repairs</th><th>Verified & closed</th></tr></thead><tbody>${db.technicians.map(t=>`<tr><td><span class="assignee">${avatar(t)}<strong>${e(t.name)}</strong></span></td><td>${e(t.skill)}</td><td>${db.cases.filter(c=>c.assignedTo===t.id&&!['closed','resolved'].includes(c.status)).length}</td><td>${db.cases.filter(c=>c.assignedTo===t.id&&['closed','resolved'].includes(c.status)).length}</td><td>${db.cases.filter(c=>c.assignedTo===t.id&&c.status==='closed').length}</td></tr>`).join('')}</tbody></table></div></section><section class="panel padded recurring-panel"><span class="category-icon orange">${icon('refresh',24)}</span><div><h2>Recurring failure watch</h2><p>${repeated.length?repeated.map(a=>e(a.id)+' · '+e(a.name)).join(', '):'No asset currently has multiple maintenance cases. New incidents on the same asset will appear here.'}</p></div></section>`;}

function settingsPage(){return heading('WORKSPACE SETTINGS','Make FixTrack your campus’s own.','Manage the details and policies that guide your maintenance team.')+`<div class="settings-layout"><nav class="settings-nav"><a href="#campus-settings">${icon('building',17)}Campus details</a><a href="#notifications-settings">${icon('bell',17)}Notifications</a><a href="#workflow-settings">${icon('tool',17)}Workflow</a><a href="#data-settings">${icon('shield',17)}Local data</a></nav><div><form id="settings-form"><section id="campus-settings" class="panel padded"><div class="section-intro"><h2>Campus details</h2><p>The name that appears across your workspace.</p></div><div class="field"><label for="campus-name">Campus name</label><input id="campus-name" name="campus" required maxlength="80" value="${e(db.settings.campus)}"></div><div class="field"><label for="emergency-instructions">Emergency instructions</label><textarea id="emergency-instructions" name="emergency" required rows="3" maxlength="500">${e(db.settings.emergency)}</textarea><small>Include a verified campus contact before going live.</small></div></section><section id="notifications-settings" class="panel padded"><h2>Notification preferences</h2><p>Control the notifications shown in this local workspace.</p><label class="toggle-row"><span><strong>In-app notifications</strong><small>Report updates, assignments and completed repairs.</small></span><input type="checkbox" name="inAppNotifications" ${db.settings.inAppNotifications?'checked':''}><span class="toggle"></span></label><div class="toggle-row disabled"><span><strong>Email notifications</strong><small>Available after the online email service is connected.</small></span><span class="subtle-tag">Not connected</span></div></section><section id="workflow-settings" class="panel padded"><h2>Workflow policies</h2><p>Set expectations while keeping people in the loop.</p><div class="field"><label for="sla">Target first response time (hours)</label><input id="sla" name="sla" type="number" min="1" max="168" required value="${db.settings.sla}"><small>Cases older than this without assignment are highlighted as overdue.</small></div><div class="policy-row">${icon('shield',19)}<div><strong>Manual verification required</strong><p>Completed repairs must be verified before a case is closed.</p></div><span class="subtle-tag">Always on</span></div><div class="policy-row">${icon('link',19)}<div><strong>Review duplicate suggestions</strong><p>Reports are linked only after an admin confirms the match.</p></div><span class="subtle-tag">Always on</span></div></section><div class="settings-save"><button class="btn primary" type="submit">${icon('check',17)}Save changes</button></div></form><section id="data-settings" class="panel padded"><h2>Your local workspace</h2><p>All changes are saved in this browser and synced to Supabase.</p><div class="button-row">${btn('Export workspace backup','backup','secondary','download')}${btn('Reset demo data','reset','danger-soft','refresh')}</div></section></div></div>`;}

function profilePage(){
  const profileName=currentUser?.name||db.profile.name||'Campus Member';
  const profileEmail=currentUser?.email||db.profile.email||'admin@fixtrack.campus';
  const profileDept=currentUser?.department||db.profile.department||'Campus Operations';
  const profilePhone=currentUser?.phone||db.profile.phone||'';

  return heading('YOUR ACCOUNT','A little about you.','Keep your campus profile up to date.')+`<div class="profile-layout"><section class="panel profile-summary">${avatar({name:profileName},'large')}<h2>${e(profileName)}</h2><p>${e(profileEmail)}</p><span class="subtle-tag">${role==='admin'?'Maintenance admin':role==='technician'?'Technician':'Student / staff'}</span><div class="card-divider"></div><span class="local-label" style="background:#eaf4e6;color:#355f3c;border-color:#cfe3c7"><i style="background:#428250"></i>Supabase Cloud Account</span><p class="profile-disclaimer">Authenticated with Supabase. Role permissions and audits are tied to this profile.</p>${btn('Switch workspace role','workspace','secondary full','users')}${btn('Sign out of account','logout','danger-soft full signout-btn','logout','style="margin-top:12px"')}</section><form id="profile-form" class="panel padded"><h2>Personal information</h2><p>Profile data is securely synced to Supabase.</p><div class="field"><label for="profile-name">Full name</label><input id="profile-name" name="name" value="${e(profileName)}" required maxlength="80"></div><div class="field"><label for="profile-email">Email address</label><input id="profile-email" type="email" name="email" value="${e(profileEmail)}" required maxlength="120" readonly style="background:#f7f9f3"></div><div class="form-two-col"><div class="field"><label for="department">Department</label><input id="department" name="department" value="${e(profileDept)}" maxlength="100"></div><div class="field"><label for="phone">Phone <span>Optional</span></label><input id="phone" name="phone" type="tel" value="${e(profilePhone)}" maxlength="25"></div></div><button class="btn primary" type="submit">${icon('check',17)}Save profile</button></form></div>`;
}

function notificationItems(){let updates=db.updates.filter(u=>role==='admin'||role==='technician'&&db.cases.some(c=>c.id===u.caseId&&(c.assignedTo==='tech-1'||c.assignedTo===currentUser?.id))||role==='reporter'&&db.reports.some(r=>r.caseId===u.caseId&&(r.reporter==='reporter-1'||r.reporter===currentUser?.id)));return updates.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,20);}
function unreadCount(){return db.settings.inAppNotifications?notificationItems().filter(u=>!db.readNotifications.includes(u.id)).length:0;}
function notificationsPage(){const updates=db.settings.inAppNotifications?notificationItems():[];return heading('STAY IN THE LOOP','Your campus updates.','Every assignment, repair and verification, in one place.',btn('Mark all as read','read-all','secondary','check'))+`<section class="panel notification-list">${updates.length?updates.map(u=>`<a data-nav href="${role==='technician'?'/technician/jobs/':role==='reporter'?'/issues/':'/admin/cases/'}${u.caseId}" class="notification-row ${db.readNotifications.includes(u.id)?'read':'unread'}"><span class="attention-icon green">${icon(u.action.includes('completed')?'check':'tool',20)}</span><div><strong>${e(u.action)}</strong><p>${e(u.note)}</p><small>${u.caseId} · ${e(u.actor)} · ${time(u.createdAt)}</small></div>${!db.readNotifications.includes(u.id)?'<i class="small-dot green-dot"></i>':''}</a>`).join(''):empty('You’re all caught up','Enable in-app notifications in settings to see updates.','bell')}</section>`;}

function helpPage(){const questions=[['How do I report an issue?','Choose “Report an issue”, select the building and room, then describe the problem. Include the asset ID from the equipment sticker when possible.'],['Why are reports and cases different?','A report is your individual submission. A case is the repair job. Several reports about the same fault can be linked to one case without losing any original report.'],['How does duplicate detection work?','The same asset and issue type produce a strong suggestion. Without an asset ID, location, category, issue type and similar wording are considered. A human admin confirms every link. Different faults on one asset remain separate.'],['What is the difference between resolved and closed?','A technician marks a repair complete. It then awaits verification. An admin or a linked reporter confirms that the fix works before the case is closed.'],['What if a repair did not fix the issue?','Open the repair details while it is awaiting verification, choose “Issue persists · Reopen”, and describe what is still wrong. The case returns to in progress.'],['Where is my data saved?','Data is connected and synced directly to Supabase PostgreSQL database in real time. Changes made on any device reflect everywhere.'],['Can I sign in with Google?','Yes! FixTrack supports Google/Gmail sign in via Supabase Auth as well as campus email and password login.']];return heading('HELP CENTRE','A little guidance goes a long way.','Everything you need to keep maintenance moving.')+`<div class="help-intro"><span class="category-icon green">${icon('help',32)}</span><div><h2>How can we help?</h2><p>Start with the answers below, or report something that needs a fix.</p></div>${a('Report an issue','/report/new','btn primary','plus')}</div><section class="panel faq-list">${questions.map(([q,ans])=>`<details><summary>${q}${icon('plus',18)}</summary><p>${ans}</p></details>`).join('')}</section><div class="safety-inline">${icon('alert',20)}<div><strong>For immediate hazards</strong><p>${e(db.settings.emergency)} A maintenance report is not an emergency dispatch.</p></div></div>`;}

function loginPage(){
  return `<div class="login-page">
    <a data-nav href="/" class="brand"><span class="brand-mark">F<span>✓</span></span>FixTrack<span class="brand-dot">.</span></a>
    <div class="login-layout">
      <div class="login-story">
        <span class="eyebrow">CARE FOR THE PLACE YOU CALL CAMPUS.</span>
        <h1>Better spaces.<br>Brighter days.</h1>
        <p>One place to report a problem, follow the repair,<br>and see the difference you’ve made.</p>
        ${campusArt()}
        <div class="login-promise">${icon('shield',22)}<span>Connected to Supabase PostgreSQL & Auth.<br><strong>Every report heard. Every repair accounted for.</strong></span></div>
      </div>
      <section class="login-card">
        <span class="subtle-tag" style="background:#eaf4e6;color:#355f3c;border-color:#cfe3c7"><i class="small-dot green-dot" style="margin-right:4px"></i>SUPABASE AUTH</span>
        <h2>Welcome to FixTrack.</h2>
        <p>Sign in with your campus account or Gmail to enter.</p>

        <button type="button" class="google-btn" data-action="google-login">
          ${googleIcon()}
          <span>Continue with Google / Gmail</span>
        </button>

        <div class="auth-divider"><span>or with campus email</span></div>

        <div class="auth-tabs">
          <button type="button" class="auth-tab ${authTab==='signin'?'active':''}" data-action="switch-auth-tab" data-tab="signin">Sign In</button>
          <button type="button" class="auth-tab ${authTab==='signup'?'active':''}" data-action="switch-auth-tab" data-tab="signup">Create Account</button>
        </div>

        <div id="auth-error" class="auth-error-msg"></div>

        ${authTab==='signin'?`
        <form id="login-form">
          <div class="field" style="margin:12px 0">
            <label for="login-email">Campus Email</label>
            <input id="login-email" name="email" type="email" required placeholder="admin@fixtrack.campus" autocomplete="email" value="${e(currentUser?.email||'admin@fixtrack.campus')}">
          </div>
          <div class="field" style="margin:12px 0 18px">
            <label for="login-password">Password</label>
            <input id="login-password" name="password" type="password" required placeholder="••••••••" autocomplete="current-password" value="FixTrack@2026">
          </div>
          <button class="btn primary full" type="submit">
            ${icon('check',17)} Sign In to Workspace
          </button>
        </form>
        `:`
        <form id="signup-form">
          <div class="field" style="margin:10px 0">
            <label for="signup-name">Full Name</label>
            <input id="signup-name" name="name" required placeholder="e.g. Rahul Sharma" maxlength="80">
          </div>
          <div class="field" style="margin:10px 0">
            <label for="signup-email">Campus Email</label>
            <input id="signup-email" name="email" type="email" required placeholder="student@campus.edu">
          </div>
          <div class="field" style="margin:10px 0">
            <label for="signup-password">Password</label>
            <input id="signup-password" name="password" type="password" required minlength="6" placeholder="At least 6 characters">
          </div>
          <div class="field" style="margin:10px 0 18px">
            <label for="signup-role">Campus Role</label>
            <select id="signup-role" name="role">
              <option value="reporter">Student / Teaching Staff (Reporter)</option>
              <option value="technician">Maintenance Technician</option>
              <option value="admin">Maintenance Admin</option>
            </select>
          </div>
          <button class="btn primary full" type="submit">
            ${icon('plus',17)} Create Campus Account
          </button>
        </form>
        `}

        <div class="demo-accounts">
          <div class="demo-accounts-title">
            <span>QUICK TEST ACCOUNTS (REAL SUPABASE DATA)</span>
            <span class="subtle-tag" style="font-size:8px">1-Click</span>
          </div>
          <div class="demo-role-grid">
            <button type="button" class="demo-pill" data-action="quick-login" data-email="admin@fixtrack.campus">
              <strong>Admin</strong>
              <small>admin@fixtrack.campus</small>
            </button>
            <button type="button" class="demo-pill" data-action="quick-login" data-email="arjun.tech@fixtrack.campus">
              <strong>Technician</strong>
              <small>arjun.tech@fixtrack.campus</small>
            </button>
            <button type="button" class="demo-pill" data-action="quick-login" data-email="student@fixtrack.campus">
              <strong>Student</strong>
              <small>student@fixtrack.campus</small>
            </button>
          </div>
          <small style="display:block;margin-top:7px;color:#8ba079;font-size:8.5px;text-align:center">Password for test accounts: <code>FixTrack@2026</code></small>
        </div>

        <div class="role-choices" style="margin-top:16px">
          ${[['reporter','Student / staff','Report an issue and follow its progress.','user'],['technician','Maintenance technician','Find your jobs and record your repairs.','tool'],['admin','Maintenance admin','Triage, assign, verify and keep things moving.','shield']].map(([r,title,desc,ico])=>`<button class="role-choice ${role===r?'chosen':''}" data-action="login-role" data-role="${r}"><span class="category-icon ${r==='admin'?'green':r==='technician'?'orange':'blue'}">${icon(ico,22)}</span><span><strong>${title}</strong><small>${desc}</small></span><i>${role===r?icon('check',13):''}</i></button>`).join('')}
        </div>
        ${btn('Enter workspace','enter-workspace','primary full','arrow')}

        <div class="login-note">
          ${icon('shield',16)}
          <p>Connected to Supabase PostgreSQL database. Live incident tracking and role enforcement active.</p>
        </div>
      </section>
    </div>
    <footer>FixTrack · Report. Repair. Resolve.</footer>
  </div>`;
}

function landingPage(){return `<div class="landing"><header class="landing-nav"><a data-nav href="/" class="brand"><span class="brand-mark">F<span>✓</span></span>FixTrack<span class="brand-dot">.</span></a><nav><a href="#how-it-works">How it works</a><a href="#built-for-everyone">For your campus</a><a href="/help" data-nav>Help centre</a></nav>${a('Open workspace','/login','btn primary','arrow')}</header><section class="landing-hero"><div class="hero-kicker"><span class="small-dot green-dot"></span> A LITTLE CARE GOES A LONG WAY</div><h1>A better campus.<br><span>One fix at a time.</span></h1><p>The flickering light. The leaky tap. The computer that won’t start.<br>Give every campus issue a clear path from reported to resolved.</p><div class="hero-buttons">${a('Explore FixTrack','/login','btn primary','arrow')}${a('See the admin dashboard','/admin','btn secondary','grid')}</div><div class="hero-proof"><span>${icon('check',15)}One shared repair case</span><span>${icon('check',15)}Real accountability</span><span>${icon('check',15)}Every reporter updated</span></div><div class="landing-preview"><div class="preview-top"><span class="window-dots"><i></i><i></i><i></i></span><span>YOUR CAMPUS, CONNECTED</span><span>${icon('shield',15)}FixTrack workspace</span></div><div class="preview-content"><div class="preview-copy"><span class="banner-label">FROM SOMETHING’S WRONG TO ALL SORTED.</span><h2>Less chasing.<br>More fixing.</h2><p>Four reports about one faulty monitor?<br>That’s one repair job, with everyone in the loop.</p><div class="preview-case"><span class="category-icon blue">${icon('monitor',24)}</span><span><strong>PC-14 monitor not displaying</strong><small>Computer Lab 1 · 4 linked reports</small></span>${badge('in_progress')}</div></div>${campusArt()}</div></div></section><section id="how-it-works" class="landing-section"><div class="eyebrow">SIMPLE BY DESIGN</div><h2>A clear path. Every time.</h2><div class="process-grid">${[['01','Report what’s wrong','Add a location, describe the issue, and share a photo if it helps.','report'],['02','Connect the dots','Related reports become one case. The right technician gets the job.','link'],['03','Fix it. Check it. Close it.','Follow the updates and verify the repair before closing the loop.','shield']].map(([n,t,d,ico])=>`<article><span class="process-num">${n}</span><span class="category-icon green">${icon(ico,26)}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div></section><section id="built-for-everyone" class="landing-section role-section"><div><div class="eyebrow">ONE CAMPUS. ONE TEAM.</div><h2>Everyone has a part<br>in making it better.</h2><p>Three focused workspaces.<br>One connected maintenance journey.</p></div><div>${[['reporter','Students & staff','A voice for every issue. A view of every update.','user'],['technician','Maintenance technicians','Clear jobs, useful context, and simple progress updates.','tool'],['admin','Campus administrators','The full picture, from duplicate reports to verified repairs.','shield']].map(([r,t,d,ico])=>`<button data-action="open-role" data-role="${r}" class="landing-role"><span class="category-icon green">${icon(ico,22)}</span><span><h3>${t}</h3><p>${d}</p></span>${icon('arrow',22)}</button>`).join('')}</div></section><div class="landing-cta"><span class="eyebrow">BUILT FOR THE EVERYDAY. READY TO MAKE A DIFFERENCE.</span><h2>Your campus deserves a little care.</h2>${a('Take a look around','/login','btn primary','arrow')}<p>Supabase Connected · Real Incident Data</p></div><footer class="landing-footer"><a href="/" data-nav class="brand">FixTrack<span class="brand-dot">.</span></a><span>Report. Repair. Resolve.</span><a data-nav href="/help">Help centre</a><span>A better campus, together.</span></footer></div>`;}
function notFound(){return `<div class="not-found"><span>404</span><h1>This page is off the map.</h1><p>The page or record could not be found in this workspace.</p>${a('Back to workspace',role==='admin'?'/admin':role==='technician'?'/technician':'/dashboard','btn primary','arrow')}</div>`;}

function render(){
  route=location.pathname;
  if(route.startsWith('/admin'))role='admin';
  else if(route.startsWith('/technician'))role='technician';
  else if(['/dashboard','/my-reports'].some(p=>route.startsWith(p)))role='reporter';
  sessionStorage.setItem('fixtrack.role',role);
  document.title=(route==='/'?'A better campus, together':route.startsWith('/admin')?'Campus maintenance':route.startsWith('/technician')?'Technician workspace':route==='/login'?'Welcome':'Your campus')+' · FixTrack';

  let content;
  if(route==='/')content=landingPage();
  else if(route==='/login')content=loginPage();
  else{
    let page=route==='/admin'?dashboard():
      route==='/admin/cases'?casesPage():
      route.startsWith('/admin/cases/')?detailPage(route.split('/').pop()):
      route==='/admin/reports'?reportsPage():
      route.startsWith('/admin/reports/')?reportDetail(route.split('/').pop()):
      route==='/admin/technicians'?techniciansPage():
      route==='/admin/assets'?assetsPage():
      route==='/admin/analytics'?analyticsPage():
      route==='/admin/settings'?settingsPage():
      route==='/dashboard'?reporterDashboard():
      route==='/report/new'?newReport():
      route==='/my-reports'?myReports():
      route.startsWith('/my-reports/')?reportDetail(route.split('/').pop()):
      route==='/issues'?campusIssues():
      route.startsWith('/issues/')?detailPage(route.split('/').pop()):
      route==='/technician'?technicianPage():
      route==='/technician/history'?technicianPage(true):
      route.startsWith('/technician/jobs/')?detailPage(route.split('/').pop()):
      route==='/profile'?profilePage():
      route==='/notifications'?notificationsPage():
      route==='/help'?helpPage():
      notFound();
    content=shell(page);
  }
  document.querySelector('#app').innerHTML=content;
  bindInputs();
}

function closeModal(){document.querySelector('#overlay-root').innerHTML='';document.body.classList.remove('modal-open');}
let previousFocus;
function modal(title,body,size=''){previousFocus=document.activeElement;document.querySelector('#overlay-root').innerHTML=`<div class="modal-backdrop"><section role="dialog" aria-modal="true" aria-label="${e(title)}" class="modal ${size}"><div class="modal-heading"><h2>${title}</h2><button data-action="close-modal" class="icon-button" aria-label="Close dialog">${icon('close')}</button></div>${body}</section></div>`;document.body.classList.add('modal-open');setTimeout(()=>document.querySelector('.modal input,.modal select,.modal button')?.focus(),20);}

function workspaceModal(){
  modal('Choose your workspace',`<div class="modal-body"><p>Explore the same repair journey from three perspectives. This switches demo views, not account permissions.</p><div class="role-choices">${[['admin','Maintenance admin','Triage reports, assign jobs and verify repairs.','shield'],['reporter','Student / staff','Report issues and track your own submissions.','user'],['technician','Maintenance technician','View assigned jobs and record completed repairs.','tool']].map(([r,t,d,ico])=>`<button class="role-choice ${role===r?'chosen':''}" data-action="open-role" data-role="${r}"><span class="category-icon green">${icon(ico,22)}</span><span><strong>${t}</strong><small>${d}</small></span>${icon('arrow',18)}</button>`).join('')}</div>${currentUser?`<div style="margin-top:18px">${btn('Sign out of account','logout','danger-soft full signout-btn','logout')}</div>`:''}</div>`);
}

function captureDraft(){const f=document.querySelector('#issue-form');if(!f)return;const vals=Object.fromEntries(new FormData(f));Object.assign(draft,vals);if(formStep===2)draft.safety=f.elements.safety.checked;}

function bindInputs(){
  document.querySelector('#period')?.addEventListener('change',ev=>{range=Number(ev.target.value);render();});
  document.querySelector('#table-search')?.addEventListener('input',ev=>{query=ev.target.value;refreshResults();});
  document.querySelector('#category-filter')?.addEventListener('change',ev=>{categoryFilter=ev.target.value;render();});
  document.querySelector('#building')?.addEventListener('change',ev=>{captureDraft();draft.building=ev.target.value;draft.location='';render();});
  document.querySelector('#category')?.addEventListener('change',ev=>{captureDraft();draft.category=ev.target.value;draft.issueType=issueTypes[draft.category][0];render();});
  document.querySelector('#photo')?.addEventListener('change',async ev=>{
    const file=ev.target.files[0];
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1024*1024){toast('Choose a PNG, JPEG or WebP image under 1 MB.','error');return;}
    captureDraft();
    const reader=new FileReader();
    reader.onload=()=>{draft.photo=reader.result;render();};
    reader.onerror=()=>toast('Unable to read that photo.','error');
    reader.readAsDataURL(file);
  });
}

function refreshResults(){
  if(route==='/admin/assets'){
    document.querySelector('#asset-results').innerHTML=assetTable(db.assets.filter(a=>(categoryFilter==='all'||a.category===categoryFilter)&&(`${a.name} ${a.id} ${loc(a.location).building}`.toLowerCase().includes(query.toLowerCase()))));
    return;
  }
  let el=document.querySelector('#case-results');
  if(el){
    const cases=filteredCases(db.cases);
    el.innerHTML=view==='grid'?caseCards(cases):caseTable(cases,route==='/issues');
    return;
  }
  if(document.querySelector('#report-results')){
    let reports=route==='/my-reports'?db.reports.filter(r=>r.reporter==='reporter-1'||r.reporter===currentUser?.id):db.reports;
    reports=reports.filter(r=>(`${r.id} ${r.title} ${r.asset}`.toLowerCase().includes(query.toLowerCase()))&&(categoryFilter==='all'||r.category===categoryFilter)&&(filter==='all'||filter==='new'&&!r.caseId||filter==='linked'&&r.caseId||filter==='open'&&db.cases.find(c=>c.id===r.caseId)?.status!=='closed'||filter==='closed'&&db.cases.find(c=>c.id===r.caseId)?.status==='closed'));
    document.querySelector('#report-results').innerHTML=reportRows(reports,route==='/my-reports');
    return;
  }
  if(route.startsWith('/technician')){
    const sel=document.querySelector('#table-search'),pos=sel.selectionStart;
    render();
    document.querySelector('#table-search').focus();
    document.querySelector('#table-search').setSelectionRange(pos,pos);
  }
}

function download(name,contents,type='text/csv;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([contents],{type})),link=document.createElement('a');
  link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('Export downloaded.');
}

function exportCases(cases=db.cases){
  download('fixtrack-cases.csv',csv([['Case','Title','Category','Building','Room','Asset','Priority','Status','Technician','Created'],...cases.map(c=>[c.id,c.title,c.category,loc(c.location).building,loc(c.location).room,c.asset,c.priority,STATUSES[c.status],tech(c.assignedTo)?.name||'',c.createdAt])]));
}

async function syncWithSupabase(){
  if(typeof fetchAllData!=='function')return;
  try{
    const live=await fetchAllData();
    if(live&&live.cases&&live.cases.length){
      db.cases=live.cases;
      db.reports=live.reports;
      db.updates=live.updates;
      db.technicians=live.technicians;
      db.assets=live.assets;
      db.locations=live.locations;
      db.settings=live.settings;
      save();
    }
  }catch(err){
    console.warn('Sync note:', err.message);
  }
}

async function checkUserSession(){
  if(typeof getCurrentUserProfile!=='function')return;
  try{
    const profile=await getCurrentUserProfile();
    if(profile){
      currentUser=profile;
      db.profile=profile;
      role=profile.role||role;
      sessionStorage.setItem('fixtrack.role',role);
      save();
    }
  }catch(err){
    console.warn('Session note:', err.message);
  }
}

const actions={
  menu(){mobileMenu=!mobileMenu;render();},
  workspace:workspaceModal,
  'close-modal'(){closeModal();previousFocus?.focus();},
  notifications(){navigate('/notifications');},
  'login-role'(el){role=el.dataset.role;render();},
  'enter-workspace'(){navigate(role==='admin'?'/admin':role==='technician'?'/technician':'/dashboard');},
  'open-role'(el){role=el.dataset.role;sessionStorage.setItem('fixtrack.role',role);navigate(role==='admin'?'/admin':role==='technician'?'/technician':'/dashboard');},
  'switch-auth-tab'(el){authTab=el.dataset.tab;render();},
  filter(el){filter=el.dataset.value;history.replaceState({},'',location.pathname);render();},
  view(el){view=el.dataset.value;render();},
  'form-back'(){captureDraft();formStep--;render();},
  'remove-photo'(){captureDraft();delete draft.photo;render();},
  'export-cases'(){exportCases(filteredCases(db.cases));},
  'export-jobs'(){exportCases(db.cases.filter(c=>c.assignedTo==='tech-1'&&['resolved','closed'].includes(c.status)));},
  'export-reports'(){download('fixtrack-reports.csv',csv([['Report','Title','Location','Asset','Category','Case','Submitted'],...db.reports.map(r=>[r.id,r.title,loc(r.location).room,r.asset,r.category,r.caseId||'Needs triage',r.createdAt])]));},
  'export-analytics'(){download('fixtrack-analytics.csv',csv([['Metric','Value'],['Total reports',db.reports.length],['Distinct cases',db.cases.length],['Open cases',metrics(db.cases,db.reports).open],['Repairs completed',metrics(db.cases,db.reports).resolved],...categories.map(c=>[c,db.cases.filter(x=>x.category===c).length])]));},
  backup(){download('fixtrack-workspace.json',JSON.stringify(db,null,2),'application/json');},
  'read-all'(){db.readNotifications=notificationItems().map(u=>u.id);save();render();toast('All notifications marked as read.');},

  async 'google-login'(){
    toast('Redirecting to Google / Gmail sign in...');
    if(typeof signInWithGoogle==='function'){
      try{
        await signInWithGoogle();
      }catch(err){
        toast(err.message,'error');
      }
    }
  },

  async 'quick-login'(el){
    const email=el.dataset.email;
    toast('Signing in to Supabase...');
    if(typeof signIn==='function'){
      try{
        await signIn(email,'FixTrack@2026');
        await checkUserSession();
        await syncWithSupabase();
        render();
        toast('Logged in as '+(currentUser?.name||email));
        navigate(role==='admin'?'/admin':role==='technician'?'/technician':'/dashboard');
      }catch(err){
        toast(err.message,'error');
      }
    }else{
      navigate(email.includes('admin')?'/admin':email.includes('tech')?'/technician':'/dashboard');
    }
  },

  async logout(){
    if(typeof signOut==='function'){
      try{await signOut();}catch(e){}
    }
    currentUser=null;
    db.profile={name:'Student',email:'student@fixtrack.campus',role:'reporter',department:'Campus'};
    role='reporter';
    sessionStorage.removeItem('fixtrack.role');
    closeModal();
    navigate('/login');
    toast('Signed out successfully.');
  },

  assign(el){
    const id=el.dataset.id,c=db.cases.find(c=>c.id===id),assignee=document.querySelector('#case-assignee').value,p=document.querySelector('#case-priority').value;
    if(!assignee){toast('Select a technician first.','error');return;}
    updateCase(id,{assignedTo:assignee,priority:p,status:['new','triaged'].includes(c.status)?'assigned':c.status},'Assignment updated',tech(assignee).name+' assigned. Priority: '+p+'.');
    if(typeof apiUpdateCase==='function'){
      apiUpdateCase(id,{assignedTo:assignee,priority:p,status:['new','triaged'].includes(c.status)?'assigned':c.status},'Assignment updated',tech(assignee).name+' assigned. Priority: '+p+'.',currentUser||db.profile).catch(console.warn);
    }
    render();toast('Assignment saved.');
  },

  'start-job'(el){
    updateCase(el.dataset.id,{status:'in_progress'},'Repair in progress','The technician started work on this repair.');
    if(typeof apiUpdateCase==='function'){
      apiUpdateCase(el.dataset.id,{status:'in_progress'},'Repair in progress','The technician started work on this repair.',currentUser||db.profile).catch(console.warn);
    }
    render();toast('Repair started.');
  },

  resolve(el){
    modal('Record the completed repair',`<form id="resolve-form" class="modal-body"><input name="caseId" type="hidden" value="${el.dataset.id}"><p>Tell the reviewer what was fixed and how you tested it. The case will await verification.</p><div class="field"><label for="repair-note">Repair note <em>*</em></label><textarea name="note" id="repair-note" rows="5" minlength="10" maxlength="2000" required placeholder="e.g. Replaced the faulty HDMI cable and tested the display."></textarea></div><button class="btn primary full" type="submit">${icon('check',17)}Mark repair complete</button></form>`);
  },

  verify(el){
    modal('Verify this repair',`<div class="modal-body"><div class="confirm-icon">${icon('shield',30)}</div><h3>Does everything work as expected?</h3><p>Confirm only after checking the repair. This closes the case and updates every linked report.</p>${btn('Yes, verify & close','confirm-verify','primary full','check',`data-id="${el.dataset.id}"`)}</div>`);
  },

  'confirm-verify'(el){
    updateCase(el.dataset.id,{status:'closed'},'Repair verified and closed','The repair was checked and confirmed to be working.');
    if(typeof apiUpdateCase==='function'){
      apiUpdateCase(el.dataset.id,{status:'closed'},'Repair verified and closed','The repair was checked and confirmed to be working.',currentUser||db.profile).catch(console.warn);
    }
    closeModal();render();toast('Repair verified. Every linked report is updated.');
  },

  reopen(el){
    modal('Reopen this repair',`<form id="reopen-form" class="modal-body"><input name="caseId" type="hidden" value="${el.dataset.id}"><p>Describe what is still wrong so the technician knows what to check.</p><div class="field"><label for="reopen-note">What still needs attention?</label><textarea name="note" id="reopen-note" rows="4" minlength="10" maxlength="2000" required></textarea></div><button class="btn primary full" type="submit">${icon('refresh',17)}Reopen case</button></form>`);
  },

  'link-report'(el){
    const r=db.reports.find(r=>r.id===el.dataset.report),c=db.cases.find(c=>c.id===el.dataset.case);
    modal('Confirm duplicate report',`<div class="modal-body"><span class="match-label">${icon('link',16)}${e(r.asset||loc(r.location).room)} · ${e(r.issueType)}</span><h3>${e(r.title)}</h3><p>Link this report to <strong>${c.id} · ${e(c.title)}</strong>?</p><p>The original report will be kept. Its reporter will follow the existing case’s progress.</p>${btn('Confirm & link report','confirm-link','primary full','link',`data-report="${r.id}" data-case="${c.id}"`)}</div>`);
  },

  'confirm-link'(el){
    try{
      linkReport(db,el.dataset.report,el.dataset.case);
      updateCase(el.dataset.case,{},'Duplicate report linked',el.dataset.report+' was reviewed and linked to this maintenance case.');
      if(typeof apiLinkReport==='function'){
        apiLinkReport(el.dataset.report,el.dataset.case,currentUser||db.profile).catch(console.warn);
      }
      closeModal();render();toast('Report linked. Original submission preserved.');
    }catch(err){toast(err.message,'error');}
  },

  'create-case'(el){
    const r=db.reports.find(r=>r.id===el.dataset.id);
    if(r.caseId){toast('This report is already linked.','error');return;}
    const id='FIX-'+String(Math.max(0,...db.cases.map(c=>Number(c.id.split('-')[1])))+1).padStart(3,'0');
    const p=document.querySelector('#new-case-priority')?.value||'medium';
    db.cases.push({id,title:r.title,description:r.description,location:r.location,asset:r.asset,category:r.category,issueType:r.issueType,priority:p,status:'triaged',assignedTo:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    linkReport(db,r.id,id);
    updateCase(id,{},'Maintenance case created','Created from '+r.id+'. Ready for technician assignment.');
    if(typeof apiCreateCase==='function'){
      apiCreateCase(r.id,p,currentUser||db.profile).catch(console.warn);
    }
    navigate('/admin/cases/'+id);
    toast('New maintenance case created.');
  },

  availability(el){
    const t=tech(el.dataset.id);
    t.available=!t.available;
    save();
    if(typeof apiSetTechAvailability==='function'){
      apiSetTechAvailability(t.id,t.available).catch(console.warn);
    }
    render();toast(t.name+' is now '+(t.available?'available.':'off duty.'));
  },

  'tech-jobs'(el){
    const t=tech(el.dataset.id),jobs=db.cases.filter(c=>c.assignedTo===t.id||c.assignedTo===t.legacyId);
    modal(e(t.name)+' · assigned work',`<div class="modal-body">${caseTable(jobs)}</div>`,'wide');
  },

  'asset-history'(el){
    const asset=db.assets.find(a=>a.id===el.dataset.id);
    modal(e(asset.id)+' · repair history',`<div class="modal-body"><p>${e(asset.name)} · ${e(loc(asset.location).room)}</p>${caseTable(db.cases.filter(c=>c.asset===asset.id))}</div>`,'wide');
  },

  'add-tech'(){
    modal('Add a team member',`<form id="tech-form" class="modal-body"><p>Add a campus technician record.</p><div class="field"><label for="tech-name">Full name</label><input id="tech-name" name="name" required maxlength="80"></div><div class="field"><label for="tech-email">Email address</label><input id="tech-email" name="email" type="email" required maxlength="120"></div><div class="field"><label for="tech-skill">Specialization</label><select id="tech-skill" name="skill">${categories.map(c=>`<option>${e(c)}</option>`).join('')}</select></div><button type="submit" class="btn primary full">Add technician</button></form>`);
  },

  'add-asset'(){
    modal('Add campus equipment',`<form id="asset-form" class="modal-body"><div class="field"><label for="asset-id">Asset ID</label><input name="id" id="asset-id" required maxlength="40" placeholder="e.g. PC-15"></div><div class="field"><label for="asset-name">Equipment name</label><input name="name" id="asset-name" required maxlength="120"></div><div class="field"><label for="asset-category">Category</label><select name="category" id="asset-category">${categories.map(c=>`<option>${e(c)}</option>`).join('')}</select></div><div class="field"><label for="asset-location">Location</label><select name="location" id="asset-location">${locations.map(l=>`<option value="${l.id}">${e(l.building)} · ${e(l.room)}</option>`).join('')}</select></div><button class="btn primary full" type="submit">Add asset</button></form>`);
  },

  reset(){
    modal('Reset the local workspace?',`<div class="modal-body"><p>This removes reports, repairs, and settings added in this browser and restores the sample workspace. Export a backup first if you need your changes.</p><div class="button-row">${btn('Export backup','backup','secondary','download')}${btn('Reset demo data','confirm-reset','danger','refresh')}</div></div>`);
  },

  'confirm-reset'(){
    db=seed();save();closeModal();render();toast('Sample workspace restored.');
  },

  search(){
    modal('Find something on campus',`<div class="modal-body"><label class="global-search-input">${icon('search',21)}<input id="global-search" placeholder="Search issues, assets, pages…" autocomplete="off"></label><div id="global-results"><p class="muted">Type a case ID, room, issue title or page name.</p></div></div>`);
    document.querySelector('#global-search').addEventListener('input',ev=>{
      let q=ev.target.value.toLowerCase().trim();
      let links=[...(role==='admin'?navAdmin:role==='technician'?navTech:navReporter).map(([title,url])=>({title,url,detail:'Page'})),...db.cases.filter(c=>role!=='technician'||c.assignedTo==='tech-1'||c.assignedTo===currentUser?.id).map(c=>({title:c.title,url:caseUrl(c),detail:c.id+' · '+loc(c.location).room}))].filter(x=>(x.title+' '+x.detail).toLowerCase().includes(q));
      document.querySelector('#global-results').innerHTML=q?(links.slice(0,10).map(x=>`<a href="${x.url}" data-nav class="global-result"><span><strong>${e(x.title)}</strong><small>${e(x.detail)}</small></span>${icon('arrow',17)}</a>`).join('')||empty('No results','Try a different search.','search')):'<p class="muted">Type to search.</p>';
    });
    document.querySelector('#global-search').focus();
  }
};

document.addEventListener('click',ev=>{
  const link=ev.target.closest('a[data-nav]');
  if(link&&!ev.ctrlKey&&!ev.metaKey&&!ev.shiftKey&&ev.button===0){
    ev.preventDefault();
    navigate(link.getAttribute('href'));
    return;
  }
  const el=ev.target.closest('[data-action]');
  if(el){
    ev.preventDefault();
    actions[el.dataset.action]?.(el);
  }
  if(ev.target.classList.contains('modal-backdrop'))closeModal();
});

document.addEventListener('submit',async ev=>{
  ev.preventDefault();
  const f=ev.target;
  if(!f.checkValidity()){f.reportValidity();return;}
  const v=Object.fromEntries(new FormData(f));

  if(f.id==='login-form'){
    const {email,password}=v;
    toast('Signing in to Supabase...');
    if(typeof signIn==='function'){
      try{
        await signIn(email,password);
        await checkUserSession();
        await syncWithSupabase();
        render();
        toast('Welcome back, '+(currentUser?.name||email));
        navigate(role==='admin'?'/admin':role==='technician'?'/technician':'/dashboard');
      }catch(err){
        const errEl=document.querySelector('#auth-error');
        if(errEl){errEl.textContent=err.message;errEl.className='auth-error-msg show';}
        toast(err.message,'error');
      }
    }
    return;
  }

  if(f.id==='signup-form'){
    const {name,email,password,role:newRole}=v;
    toast('Creating Supabase account...');
    if(typeof signUp==='function'){
      try{
        await signUp(email,password,{name,role:newRole});
        await checkUserSession();
        await syncWithSupabase();
        render();
        toast('Account created! Welcome, '+name);
        navigate(role==='admin'?'/admin':role==='technician'?'/technician':'/dashboard');
      }catch(err){
        const errEl=document.querySelector('#auth-error');
        if(errEl){errEl.textContent=err.message;errEl.className='auth-error-msg show';}
        toast(err.message,'error');
      }
    }
    return;
  }

  if(f.id==='issue-form'){
    captureDraft();
    if(formStep===1&&!draft.location){toast('Choose a building and room.','error');return;}
    if(formStep===2&&(draft.title.trim().length<5||draft.description.trim().length<10)){toast('Add a clear title and description.','error');return;}
    if(formStep<3){formStep++;render();return;}

    const id='RPT-'+String(Math.max(0,...db.reports.map(r=>Number(r.id.split('-')[1])))+1).padStart(3,'0');
    const reporterId=currentUser?.id||'reporter-1';
    const reporterName=currentUser?.name||db.profile.name;
    const newRep={
      id,
      title:draft.title.trim(),
      description:draft.description.trim(),
      category:draft.category,
      issueType:draft.issueType,
      asset:draft.asset?.trim().toUpperCase()||'',
      location:draft.location,
      photo:draft.photo||null,
      safety:!!draft.safety,
      reporter:reporterId,
      reporterName:reporterName,
      caseId:null,
      triaged:false,
      createdAt:new Date().toISOString()
    };
    db.reports.push(newRep);
    if(!save()){db.reports.pop();return;}

    if(typeof apiCreateReport==='function'){
      apiCreateReport(newRep,currentUser||db.profile).catch(console.warn);
    }

    draft={};
    formStep=1;
    modal('Your report is in good hands.',`<div class="modal-body success-modal"><div class="confirm-icon">${icon('check',32)}</div><span class="subtle-tag">${id}</span><h3>Thanks for looking out for campus.</h3><p>Your report is saved and synced to Supabase. The admin can now review it, check for duplicates and arrange a repair.</p>${a('View my report','/my-reports/'+id,'btn primary full','arrow')}</div>`);
    return;
  }

  if(f.id==='comment-form'){
    if(v.note.trim().length<2){toast('Write a note first.','error');return;}
    updateCase(v.caseId,{},'Progress note added',v.note.trim());
    if(typeof apiUpdateCase==='function'){
      apiUpdateCase(v.caseId,{},'Progress note added',v.note.trim(),currentUser||db.profile).catch(console.warn);
    }
    render();toast('Note added to timeline.');
  }

  if(f.id==='resolve-form'){
    updateCase(v.caseId,{status:'resolved',repairNote:v.note.trim()},'Repair completed · awaiting verification',v.note.trim());
    if(typeof apiUpdateCase==='function'){
      apiUpdateCase(v.caseId,{status:'resolved',repairNote:v.note.trim()},'Repair completed · awaiting verification',v.note.trim(),currentUser||db.profile).catch(console.warn);
    }
    closeModal();render();toast('Repair recorded. Verification is now required.');
  }

  if(f.id==='reopen-form'){
    updateCase(v.caseId,{status:'in_progress'},'Repair reopened',v.note.trim());
    if(typeof apiUpdateCase==='function'){
      apiUpdateCase(v.caseId,{status:'in_progress'},'Repair reopened',v.note.trim(),currentUser||db.profile).catch(console.warn);
    }
    closeModal();render();toast('Case reopened for further repair.');
  }

  if(f.id==='settings-form'){
    Object.assign(db.settings,v,{sla:Number(v.sla),inAppNotifications:f.elements.inAppNotifications.checked});
    save();
    if(typeof apiUpdateSettings==='function'){
      apiUpdateSettings(db.settings).catch(console.warn);
    }
    render();toast('Workspace settings saved.');
  }

  if(f.id==='profile-form'){
    Object.assign(db.profile,v);
    save();
    if(typeof apiUpdateProfile==='function'&&currentUser?.id){
      apiUpdateProfile(currentUser.id,v).catch(console.warn);
    }
    render();toast('Profile saved.');
  }

  if(f.id==='tech-form'){
    if(db.technicians.some(t=>t.email.toLowerCase()===v.email.toLowerCase())){toast('A technician with that email already exists.','error');return;}
    const newT={...v,id:'tech-'+crypto.randomUUID(),initials:v.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(),color:'purple',available:true};
    db.technicians.push(newT);
    save();
    if(typeof apiAddTechnician==='function'){
      apiAddTechnician(v).catch(console.warn);
    }
    closeModal();render();toast('Technician added to campus team.');
  }

  if(f.id==='asset-form'){
    v.id=v.id.trim().toUpperCase();
    if(db.assets.some(a=>a.id===v.id)){toast('This asset ID already exists.','error');return;}
    db.assets.push({...v,health:100});
    save();
    if(typeof apiAddAsset==='function'){
      apiAddAsset(v).catch(console.warn);
    }
    closeModal();render();toast('Asset added.');
  }
});

window.addEventListener('popstate',()=>{filter='all';query='';categoryFilter='all';closeModal();render();});

document.addEventListener('keydown',ev=>{
  if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();actions.search();}
  if(ev.key==='Escape'){closeModal();previousFocus?.focus();}
  if(ev.key==='Tab'&&document.querySelector('.modal')){
    let els=[...document.querySelectorAll('.modal button,.modal a,.modal input,.modal select,.modal textarea')].filter(el=>!el.disabled&&el.type!=='hidden');
    if(ev.shiftKey&&document.activeElement===els[0]){ev.preventDefault();els.at(-1)?.focus();}
    else if(!ev.shiftKey&&document.activeElement===els.at(-1)){ev.preventDefault();els[0]?.focus();}
  }
});

// Setup realtime changes if supabase is loaded
if(typeof supabase!=='undefined'&&supabase?.channel){
  try{
    supabase
      .channel('public:fixtrack_realtime')
      .on('postgres_changes',{event:'*',schema:'public',table:'maintenance_cases'},async()=>{await syncWithSupabase();render();})
      .on('postgres_changes',{event:'*',schema:'public',table:'issue_reports'},async()=>{await syncWithSupabase();render();})
      .on('postgres_changes',{event:'*',schema:'public',table:'case_updates'},async()=>{await syncWithSupabase();render();})
      .subscribe();
  }catch(err){
    console.warn('Realtime channel warning:',err);
  }
}

// Initial session check and live sync
save();
render();
checkUserSession().then(()=>syncWithSupabase()).then(()=>render()).catch(console.warn);
