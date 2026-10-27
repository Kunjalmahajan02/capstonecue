import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Activity, ArrowUpRight, Bell, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardCheck, Clock3, ExternalLink, FileText, Filter, GitBranch, Globe2, LayoutDashboard, Link2, LockKeyhole, LogOut, Menu, MoreHorizontal, Plus, Rocket, Search, Settings2, ShieldCheck, Sparkles, Target, Users, X, Zap } from 'lucide-react'
import { categoryOrder, demoCriteria, makeStarterCriteria } from './data'
import { supabase, supabaseReady } from './lib/supabase'
import type { AuthUser, Category, CheckRun, Criterion, CriterionStatus, Project } from './types'

type View = 'overview' | 'requirements' | 'launch' | 'settings'
type Data = { project: Project; criteria: Criterion[]; runs: CheckRun[] }
const KEY = 'capstonecue-demo-v1'
const statuses: CriterionStatus[] = ['Not started', 'In progress', 'Ready', 'Needs work']
const colors: Record<Category, string> = { Idea: '#8265ee', MVP: '#5484ef', Launch: '#20a37a', Users: '#ec9a35', Pitch: '#d56aa3', Demo: '#27a5b7' }

function blankData(): Data {
  const project: Project = { id: 'demo-project', owner_id: 'demo-user', name: 'My capstone', idea: '', github_url: null, deployment_url: null, created_at: new Date().toISOString() }
  return { project, criteria: structuredClone(demoCriteria).map((c) => ({ ...c, project_id: project.id, owner_id: project.owner_id, status: 'Not started' as CriterionStatus })), runs: [] }
}
function readData(): Data {
  try { const value = localStorage.getItem(KEY); if (value) { const parsed = JSON.parse(value) as Data; if (parsed && parsed.project && Array.isArray(parsed.criteria) && Array.isArray(parsed.runs)) return parsed } } catch { /* use clean demo */ }
  return blankData()
}
function Brand() { return <div className="brand-mark"><ShieldCheck size={19} strokeWidth={2.6}/></div> }

export default function App() {
  const [data, setData] = useState<Data>(() => readData())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [view, setView] = useState<View>('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const [authLoading, setAuthLoading] = useState(supabaseReady)
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Category | 'All'>('All')
  const [editing, setEditing] = useState<Criterion | null>(null)
  const [modal, setModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [linkResult, setLinkResult] = useState<any>(null)
  const [signupCount, setSignupCount] = useState<number | null>(null)
  const project = data.project, criteria = data.criteria, runs = data.runs
  const notify = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3200) }, [])

  const loadWorkspace = useCallback(async (account: AuthUser) => {
    if (!supabase) return
    const { data: found, error } = await supabase.from('projects').select('*').order('created_at').limit(1)
    if (error) { notify('Could not load workspace: ' + error.message); return }
    let active = found?.[0] as Project | undefined
    if (!active) {
      const fresh: Project = { id: crypto.randomUUID(), owner_id: account.id, name: 'My capstone', idea: '', github_url: null, deployment_url: null, created_at: new Date().toISOString() }
      const { data: inserted, error: createError } = await supabase.from('projects').insert(fresh).select().single()
      if (createError) { notify('Could not create workspace: ' + createError.message); return }
      active = inserted as Project
      const { error: seedError } = await supabase.from('criteria').insert(makeStarterCriteria(active.id, account.id))
      if (seedError) notify('Workspace created, but the starter list failed: ' + seedError.message)
    }
    const [c, r] = await Promise.all([
      supabase.from('criteria').select('*').eq('project_id', active.id).order('sort_order'),
      supabase.from('check_runs').select('*').eq('project_id', active.id).order('created_at', { ascending: false }).limit(8),
    ])
    if (c.error) notify('Could not load requirements: ' + c.error.message)
    setData({ project: active, criteria: (c.data as Criterion[] | null) ?? [], runs: (r.data as CheckRun[] | null) ?? [] })
  }, [notify])

  useEffect(() => {
    if (!supabase) return
    let alive = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return
      if (session?.user) { const account = { id: session.user.id, email: session.user.email ?? '' }; setUser(account); void loadWorkspace(account) }
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { const account = { id: session.user.id, email: session.user.email ?? '' }; setUser(account); void loadWorkspace(account) }
      else { setUser(null); setData(readData()) }
    })
    return () => { alive = false; subscription.unsubscribe() }
  }, [loadWorkspace])

  useEffect(() => {
    if (!supabase || !user) { localStorage.setItem(KEY, JSON.stringify(data)) }
  }, [data, user?.id])

  useEffect(() => {
    if (!supabase || !user) return
    const channel = supabase.channel('criteria-' + project.id).on('postgres_changes', { event: '*', schema: 'public', table: 'criteria', filter: 'project_id=eq.' + project.id }, (payload) => {
      if (payload.eventType === 'INSERT') { const c = payload.new as Criterion; setData((d) => d.criteria.some((x) => x.id === c.id) ? d : { ...d, criteria: [...d.criteria, c].sort((a,b) => a.sort_order-b.sort_order) }) }
      if (payload.eventType === 'UPDATE') { const c = payload.new as Criterion; setData((d) => ({ ...d, criteria: d.criteria.map((x) => x.id === c.id ? c : x) })) }
      if (payload.eventType === 'DELETE') { const c = payload.old as Criterion; setData((d) => ({ ...d, criteria: d.criteria.filter((x) => x.id !== c.id) })) }
    }).subscribe()
    return () => { void supabase?.removeChannel(channel) }
  }, [project.id, user?.id])

  useEffect(() => {
    if (!supabase || !user) { setSignupCount(null); return }
    supabase.rpc('get_verified_signup_count').then(({ data: result, error }) => setSignupCount(!error && typeof result === 'number' ? result : null))
  }, [user?.id])

  const ready = criteria.filter((c) => c.status === 'Ready').length
  const progress = criteria.length ? Math.round(ready / criteria.length * 100) : 0
  const inProgress = criteria.filter((c) => c.status === 'In progress').length
  const needsWork = criteria.filter((c) => c.status === 'Needs work').length
  const recent = [...criteria].sort((a,b) => b.updated_at.localeCompare(a.updated_at)).slice(0,4)
  const filtered = useMemo(() => criteria.filter((c) => (filter === 'All' || c.category === filter) && (c.title + ' ' + c.description).toLowerCase().includes(query.toLowerCase())), [criteria, filter, query])

  async function updateProject(patch: Partial<Project>) {
    setData((d) => ({ ...d, project: { ...d.project, ...patch } }))
    if (supabase && user) { const { error } = await supabase.from('projects').update(patch).eq('id', project.id); if (error) notify('Save failed: ' + error.message) }
  }
  async function updateStatus(item: Criterion, status: CriterionStatus) {
    if (status === 'Ready' && !item.evidence_url && item.check_type !== 'github' && item.check_type !== 'deployment') { notify('Add an evidence URL before marking this ready.'); return }
    const updated = { ...item, status, updated_at: new Date().toISOString() }
    setData((d) => ({ ...d, criteria: d.criteria.map((c) => c.id === item.id ? updated : c) }))
    if (supabase && user) { const { error } = await supabase.from('criteria').update({ status, updated_at: updated.updated_at }).eq('id', item.id); if (error) notify('Save failed: ' + error.message) }
  }
  async function saveCriterion(input: Pick<Criterion, 'title'|'description'|'category'|'status'|'evidence_url'>, old?: Criterion) {
    if (input.status === 'Ready' && !input.evidence_url && (!old || (old.check_type !== 'github' && old.check_type !== 'deployment'))) { notify('Add an evidence URL before marking this ready.'); return }
    if (old) {
      const updated = { ...old, ...input, updated_at: new Date().toISOString() }
      setData((d) => ({ ...d, criteria: d.criteria.map((c) => c.id === old.id ? updated : c) }))
      if (supabase && user) { const { error } = await supabase.from('criteria').update({ ...input, updated_at: updated.updated_at }).eq('id', old.id); if (error) notify('Save failed: ' + error.message) }
    } else {
      const item: Criterion = { ...input, id: crypto.randomUUID(), project_id: project.id, owner_id: user?.id ?? 'demo-user', check_type: 'manual', sort_order: criteria.length, updated_at: new Date().toISOString() }
      setData((d) => ({ ...d, criteria: [...d.criteria, item] }))
      if (supabase && user) { const { data: inserted, error } = await supabase.from('criteria').insert(item).select().single(); if (error) { notify('Could not add: ' + error.message); return }; setData((d) => ({ ...d, criteria: d.criteria.map((c) => c.id === item.id ? inserted as Criterion : c) })) }
    }
    setModal(false); setEditing(null); notify(old ? 'Requirement updated' : 'Requirement added')
  }
  async function deleteCriterion(item: Criterion) {
    setData((d) => ({ ...d, criteria: d.criteria.filter((c) => c.id !== item.id) }))
    if (supabase && user) { const { error } = await supabase.from('criteria').delete().eq('id', item.id); if (error) notify('Delete failed: ' + error.message) }
    setModal(false); setEditing(null); notify('Requirement removed')
  }
  async function runChecks() {
    if (!project.github_url || !project.deployment_url) { notify('Add both public links in Settings before running checks.'); return }
    setBusy(true); setLinkResult(null)
    try {
      const response = await fetch('/api/check-links', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({githubUrl:project.github_url,deploymentUrl:project.deployment_url}) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Link check failed')
      setLinkResult(result)
      const list = [result.github,result.deployment].filter(Boolean) as {ok:boolean}[]
      const status: CheckRun['status'] = list.length && list.every((x) => x.ok) ? 'passed' : list.some((x) => x.ok) ? 'partial' : 'failed'
      const run: CheckRun = { id:crypto.randomUUID(), project_id:project.id, owner_id:user?.id ?? 'demo-user', status, summary:status === 'passed' ? 'Public links responded.' : status === 'partial' ? 'One public link needs attention.' : 'Public links need attention.', details:result, created_at:new Date().toISOString() }
      setData((d) => ({ ...d, runs:[run,...d.runs].slice(0,8) }))
      for (const c of criteria.filter((x) => x.check_type === 'github' || x.check_type === 'deployment')) {
        await updateStatus(c, c.check_type === 'github' ? (result.github?.ok ? 'Ready' : 'Needs work') : (result.deployment?.ok ? 'Ready' : 'Needs work'))
      }
      if (supabase && user) { const { error } = await supabase.from('check_runs').insert(run); if (error) notify('Check completed, but history did not save: ' + error.message) }
      notify(status === 'passed' ? 'Both public link checks passed' : 'Checks saved; review the results')
    } catch (error) { notify(error instanceof Error ? error.message : 'Link check failed') }
    finally { setBusy(false) }
  }
  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim(), password = String(form.get('password') || '')
    setAuthLoading(true)
    const result = authMode === 'signup' ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password })
    setAuthLoading(false)
    if (result.error) { notify(result.error.message); return }
    if (authMode === 'signup' && !result.data.session) notify('Check your inbox to confirm your email, then sign in.')
    else notify(authMode === 'signup' ? 'Account created. Your workspace is ready.' : 'Welcome back.')
    setAuthOpen(false)
  }

  return <div className="app-shell">
    <aside className={'sidebar '+(mobileNav?'sidebar-open':'')}><div className="brand-row"><Brand/><span>CapstoneCue</span><button className="icon-button mobile-close" onClick={()=>setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace-select"><div className="workspace-avatar">{(project.name.slice(0,1)||'L').toUpperCase()}</div><div className="workspace-copy"><strong>{project.name}</strong><span>{user?'Private workspace':'Local demo'}</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div><nav className="side-nav"><NavButton active={view==='overview'} label="Overview" icon={<LayoutDashboard size={18}/>} onClick={()=>{setView('overview');setMobileNav(false)}}/><NavButton active={view==='requirements'} label="Requirements" icon={<ClipboardCheck size={18}/>} count={criteria.filter((c)=>c.status!=='Ready').length} onClick={()=>{setView('requirements');setMobileNav(false)}}/><NavButton active={view==='launch'} label="Launch kit" icon={<Rocket size={18}/>} onClick={()=>{setView('launch');setMobileNav(false)}}/></nav>
      <div className="nav-label nav-label-spaced">TOOLS</div><nav className="side-nav"><NavButton active={false} label="Link checks" icon={<Activity size={18}/>} onClick={()=>{setView('overview');setMobileNav(false);window.setTimeout(()=>document.getElementById('link-checks')?.scrollIntoView({behavior:'smooth'}),50)}}/><NavButton active={view==='settings'} label="Settings" icon={<Settings2 size={18}/>} onClick={()=>{setView('settings');setMobileNav(false)}}/></nav>
      <div className="sidebar-bottom"><div className="sidebar-help"><i><CircleHelp size={17}/></i><div><strong>Need a hand?</strong><span>Open the launch kit for a guide</span></div><ChevronRight size={15}/></div><div className="account-row"><div className="account-avatar">{user?.email.slice(0,1).toUpperCase()||'G'}</div><div className="account-copy"><strong>{user?.email||'Guest workspace'}</strong><span>{user?'Signed in':'Demo mode'}</span></div>{user&&<button className="icon-button" title="Sign out" onClick={async()=>{await supabase?.auth.signOut();notify('Signed out')}}><LogOut size={16}/></button>}</div></div>
    </aside>
    {mobileNav&&<button className="mobile-scrim" aria-label="Close menu" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="icon-button menu-trigger" aria-label="Open menu" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{view==='overview'?'Overview':view==='requirements'?'Requirements':view==='launch'?'Launch kit':'Settings'}</strong></div></div><div className="topbar-actions"><div className="top-search"><Search size={15}/><input placeholder="Search requirements..." aria-label="Search requirements" value={query} onChange={(e)=>{setQuery(e.target.value);setView('requirements')}}/><kbd>⌘ K</kbd></div><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18}/><i/></button><button className="top-avatar" onClick={()=>user?setView('settings'):setAuthOpen(true)} aria-label="Account">{user?.email.slice(0,1).toUpperCase()||'G'}</button></div></header>
      {!supabaseReady&&<div className="demo-banner"><i/><strong>Demo workspace</strong><span>Edits save in this browser only. Connect Supabase for accounts and shared data.</span><button onClick={()=>{setAuthMode('signup');setAuthOpen(true)}}>Set up account <ArrowUpRight size={14}/></button></div>}
      {supabaseReady&&!user&&!authLoading&&<div className="demo-banner"><i/><strong>Preview mode</strong><span>Sign in to access your private, database-backed workspace.</span><button onClick={()=>{setAuthMode('signup');setAuthOpen(true)}}>Sign in / sign up <ArrowUpRight size={14}/></button></div>}
      <div className="page-content">
        {view==='overview'&&<Overview project={project} criteria={criteria} recent={recent} runs={runs} progress={progress} ready={ready} inProgress={inProgress} needsWork={needsWork} signupCount={signupCount} linkResult={linkResult} busy={busy} onCheck={runChecks} onNavigate={setView}/>}
        {view==='requirements'&&<Requirements project={project} criteria={filtered} all={criteria} filter={filter} query={query} onFilter={setFilter} onQuery={setQuery} onAdd={()=>{setEditing(null);setModal(true)}} onEdit={(c)=>{setEditing(c);setModal(true)}} onStatus={updateStatus}/>}
        {view==='launch'&&<LaunchKit progress={progress} signupCount={signupCount}/>}
        {view==='settings'&&<Settings project={project} user={user} onSave={updateProject} onAuth={()=>{setAuthMode('signup');setAuthOpen(true)}}/>}
      </div><footer className="page-footer"><span>© 2026 CapstoneCue</span><span><i className={'footer-status '+(supabaseReady?'':'footer-status-warn')}/>{supabaseReady?'Supabase env configured':'Demo mode · database not connected'}</span><a href="/pitch.html" target="_blank" rel="noreferrer">Pitch deck <ExternalLink size={12}/></a></footer>
    </main>
    {modal&&<CriterionModal item={editing} onClose={()=>{setModal(false);setEditing(null)}} onSave={saveCriterion} onDelete={deleteCriterion}/>}
    {authOpen&&<AuthModal mode={authMode} loading={authLoading} onMode={setAuthMode} onClose={()=>setAuthOpen(false)} onSubmit={handleAuth}/>}
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

function NavButton({active,label,icon,count,onClick}:{active:boolean;label:string;icon:ReactNode;count?:number;onClick:()=>void}) {
  return <button className={'nav-item '+(active?'nav-active':'')} onClick={onClick}>{icon}<span>{label}</span>{count!==undefined&&count>0&&<em>{count}</em>}</button>
}
function PanelHeading({title,subtitle,action}:{title:string;subtitle:string;action?:ReactNode}) { return <div className="panel-heading"><div><h3>{title}</h3><p>{subtitle}</p></div>{action}</div> }
function Empty({icon,title,detail}:{icon:ReactNode;title:string;detail:string}) { return <div className="empty-state"><i>{icon}</i><strong>{title}</strong><span>{detail}</span></div> }
function Stat({icon,title,value,detail,tone,trend}:{icon:ReactNode;title:string;value:string;detail:string;tone:string;trend:string}) { return <article className="stat-card"><div className="stat-top"><i className={'stat-icon stat-'+tone}>{icon}</i><MoreHorizontal size={16}/></div><div className="stat-title">{title}</div><div className="stat-value">{value}<span>{detail}</span></div><div className="stat-trend"><i className={'trend-'+tone}><ArrowUpRight size={12}/></i>{trend}</div></article> }

function Overview({project,criteria,recent,runs,progress,ready,inProgress,needsWork,signupCount,linkResult,busy,onCheck,onNavigate}:{project:Project;criteria:Criterion[];recent:Criterion[];runs:CheckRun[];progress:number;ready:number;inProgress:number;needsWork:number;signupCount:number|null;linkResult:any;busy:boolean;onCheck:()=>void;onNavigate:(v:View)=>void}) {
  const stages=categoryOrder.map((category)=>({category,total:criteria.filter((c)=>c.category===category).length,ready:criteria.filter((c)=>c.category===category&&c.status==='Ready').length}))
  return <>
    <section className="welcome-row"><div><div className="eyebrow"><i/> YOUR CAPSTONE COMMAND CENTER</div><h1>Good to see you, builder <span>✦</span></h1><p>See what’s ready, what needs proof, and what to do next.</p></div><button className="button button-primary" onClick={()=>onNavigate('requirements')}><Plus size={16}/> Add requirement</button></section>
    <section className="hero-card"><div className="hero-copy"><span className="hero-kicker"><Sparkles size={13}/> YOUR LAUNCH AT A GLANCE</span><h2>{project.name}</h2><p>{project.idea||'Add a short description of the customer problem you are solving.'}</p><button className="hero-edit" onClick={()=>onNavigate('settings')}><FileText size={14}/> Edit project details <ArrowUpRight size={13}/></button></div><div className="hero-progress"><div className="progress-ring" style={{background:'conic-gradient(#aebcff '+progress+'%, rgba(255,255,255,.16) 0)'}}><div><strong>{progress}%</strong><span>READY</span></div></div><div><strong>{ready} of {criteria.length}</strong><span>requirements ready</span><div className="hero-track"><i style={{width:progress+'%'}}/></div><button onClick={()=>onNavigate('requirements')}>Review checklist <ArrowUpRight size={13}/></button></div></div><i className="hero-orb orb-one"/><i className="hero-orb orb-two"/></section>
    <section className="stats-grid"><Stat icon={<CheckCircle2 size={17}/>} title="Ready to submit" value={String(ready)} detail={'of '+criteria.length+' requirements'} tone="green" trend="Support with evidence"/><Stat icon={<Activity size={17}/>} title="In progress" value={String(inProgress)} detail="requirements underway" tone="blue" trend="Choose one next step"/><Stat icon={<Target size={17}/>} title="Needs attention" value={String(needsWork)} detail="items need a closer look" tone="orange" trend={needsWork?'Review evidence':'Nothing flagged'}/><Stat icon={<Users size={17}/>} title="Real signups" value={signupCount===null?'—':String(signupCount)} detail={signupCount===null?'Connect Supabase for count':'confirmed app accounts'} tone="purple" trend={signupCount===null?'Not connected':'Confirmed email only'}/></section>
    <section className="content-grid"><div className="panel"><PanelHeading title="Launch readiness" subtitle="Requirement progress by stage" action={<button className="text-action" onClick={()=>onNavigate('requirements')}>View checklist <ArrowUpRight size={13}/></button>}/><div className="stage-chart">{stages.map((s)=><div className="stage-row" key={s.category}><div><i style={{background:colors[s.category]}}/>{s.category}<small>{s.category==='Idea'?'Problem and validation':s.category==='MVP'?'Core product workflow':s.category==='Launch'?'Production readiness':s.category==='Users'?'Real user traction':s.category==='Pitch'?'Story and panel prep':'Live walkthrough'}</small></div><div className="stage-bar"><i style={{width:(s.total?s.ready/s.total*100:0)+'%',background:colors[s.category]}}/></div><b>{s.ready}/{s.total}</b></div>)}</div><div className="chart-foot"><span><i/>Ready</span><span><i/>Remaining</span><b>{progress}% overall</b></div></div>
    <div className="panel"><PanelHeading title="Recent activity" subtitle="Latest checklist changes"/><div className="activity-list">{recent.map((c,i)=><div className="activity-item" key={c.id}><i className={'activity-icon '+c.status.toLowerCase().replace(' ','-')}>{c.status==='Ready'?<Check size={14}/>:<Clock3 size={14}/>}</i><div><strong>{c.status==='Ready'?'Marked ready':c.status==='Needs work'?'Needs attention':'Work in progress'}</strong><span>{c.title}</span></div><time>{i===0?'Now':i+'h'}</time></div>)}{!recent.length&&<Empty icon={<Activity size={18}/>} title="Nothing to show yet" detail="Add a requirement to begin."/ >}</div><button className="activity-link" onClick={()=>onNavigate('requirements')}>See requirements <ArrowUpRight size={13}/></button></div></section>
    <section className="content-grid lower-grid"><div className="panel"><PanelHeading title="Next best steps" subtitle="Small moves that unblock your launch" action={<span className="suggestion-pill"><Sparkles size={12}/> SUGGESTED</span>}/><div className="step-list"><Step number="01" title="Validate the customer problem" detail="Talk to 3–5 builders before claiming a market gap." tag="Idea" onClick={()=>onNavigate('launch')}/><Step number="02" title="Add public project URLs" detail="Run checks after GitHub and Vercel are live." tag="Launch" onClick={()=>onNavigate('settings')}/><Step number="03" title="Prepare the 6-slide pitch" detail="The story outline and demo script are in your launch kit." tag="Pitch" onClick={()=>onNavigate('launch')}/></div></div>
    <div className="panel" id="link-checks"><PanelHeading title="Public link checks" subtitle="Check GitHub and Vercel reachability" action={<span className="live-chip"><i/> CHECKER</span>}/><LinkRow icon={<GitBranch size={16}/>} label="GitHub repository" value={project.github_url} result={linkResult?.github}/><LinkRow icon={<Globe2 size={16}/>} label="Live deployment" value={project.deployment_url} result={linkResult?.deployment}/><button className="button button-dark full-button" onClick={onCheck} disabled={busy}><Zap size={15}/>{busy?'Checking public links…':'Run link checks'}{!busy&&<ArrowUpRight size={14}/>}</button><small className="check-note"><LockKeyhole size={13}/> Checker fetches only public GitHub and Vercel links.</small>{runs[0]&&<div className="last-run"><b className={'run-pill run-'+runs[0].status}>{runs[0].status}</b>Last run {new Date(runs[0].created_at).toLocaleString()}</div>}</div></section>
    <section className="cta-strip"><BookOpen size={21}/><div><strong>Demo day prep, in one place</strong><span>Shape a clear pitch, time your walkthrough, prepare for the panel.</span></div><button className="button button-light" onClick={()=>onNavigate('launch')}>Open launch kit <ArrowUpRight size={14}/></button></section>
  </>
}
function Step({number,title,detail,tag,onClick}:{number:string;title:string;detail:string;tag:string;onClick:()=>void}) { return <button className="next-step" onClick={onClick}><span>{number}</span><div><b>{title}</b><small>{detail}</small></div><em>{tag}</em><ChevronRight size={15}/></button> }
function LinkRow({icon,label,value,result}:{icon:ReactNode;label:string;value:string|null;result?:{ok:boolean;message:string}}) { return <div className="link-row"><i>{icon}</i><div><b>{label}</b><span>{value||'Add URL in Settings'}</span>{result?.message&&<small className={result.ok?'message-ok':'message-error'}>{result.message}</small>}</div><em className={result?(result.ok?'link-ok':'link-error'):''}>{result?(result.ok?<Check size={12}/>:<X size={12}/>):<i/>}</em></div> }

function Requirements({project,criteria,all,filter,query,onFilter,onQuery,onAdd,onEdit,onStatus}:{project:Project;criteria:Criterion[];all:Criterion[];filter:Category|'All';query:string;onFilter:(v:Category|'All')=>void;onQuery:(v:string)=>void;onAdd:()=>void;onEdit:(c:Criterion)=>void;onStatus:(c:Criterion,s:CriterionStatus)=>void}) {
  const [expanded,setExpanded]=useState('')
  const ready=all.filter((c)=>c.status==='Ready').length, pct=all.length?Math.round(ready/all.length*100):0
  return <><section className="page-heading-row"><div><div className="eyebrow"><i/> BUILD WITH PROOF</div><h1>Project requirements</h1><p>Track each capstone requirement and attach evidence reviewers can verify.</p></div><button className="button button-primary" onClick={onAdd}><Plus size={16}/> New requirement</button></section>
    <section className="workspace-summary"><ClipboardCheck size={21}/><div><small>ACTIVE PROJECT</small><b>{project.name}</b><span>{ready} of {all.length} ready</span></div><div className="summary-meter"><div><i style={{width:pct+'%'}}/></div><strong>{pct}%</strong></div><ChevronRight size={17}/></section>
    <section className="panel requirement-panel"><div className="req-toolbar"><div><h3>Checklist</h3><p>Use evidence links a reviewer can open without an account.</p></div><div className="req-controls"><label><Search size={14}/><input placeholder="Search requirements" value={query} onChange={(e)=>onQuery(e.target.value)}/></label><label><Filter size={14}/><select value={filter} onChange={(e)=>onFilter(e.target.value as Category|'All')}><option>All</option>{categoryOrder.map((x)=><option key={x}>{x}</option>)}</select></label></div></div>
      <div>{criteria.map((c)=><article className="requirement-row" key={c.id}><button className={'req-check '+(c.status==='Ready'?'checked':'')} aria-label="Toggle ready" onClick={()=>onStatus(c,c.status==='Ready'?'In progress':'Ready')}>{c.status==='Ready'&&<Check size={13}/>}</button><button className="req-main" onClick={()=>setExpanded(expanded===c.id?'':c.id)}><span><b>{c.title}</b><i className="category-chip">{c.category}</i></span><small>{c.description}</small>{expanded===c.id&&<div className="req-details"><span><b>EVIDENCE</b>{c.evidence_url?<a href={c.evidence_url} target="_blank" rel="noreferrer">{c.evidence_url} <ExternalLink size={12}/></a>:'No evidence added'}</span><span><b>UPDATED</b>{new Date(c.updated_at).toLocaleDateString()}</span></div>}</button><span className={'status-label status-'+c.status.toLowerCase().replace(' ','-')}>{c.status}</span><select aria-label="Requirement status" value={c.status} onChange={(e)=>onStatus(c,e.target.value as CriterionStatus)}>{statuses.map((s)=><option key={s}>{s}</option>)}</select><button className="icon-button" aria-label="Edit requirement" onClick={()=>onEdit(c)}><MoreHorizontal size={17}/></button></article>)}{!criteria.length&&<Empty icon={<Search size={18}/>} title="No matching requirements" detail="Try another search, or add a requirement."/>}</div><div className="req-foot">Showing <b>{criteria.length}</b> of {all.length} requirements <span><ShieldCheck size={14}/> Private workspace</span></div>
    </section><div className="hint-strip"><Sparkles size={16}/><div><b>Proof beats progress claims.</b><span>Add public evidence before marking a requirement ready.</span></div></div></>
}

function CriterionModal({item,onClose,onSave,onDelete}:{item:Criterion|null;onClose:()=>void;onSave:(input:Pick<Criterion,'title'|'description'|'category'|'status'|'evidence_url'>,old?:Criterion)=>void;onDelete:(c:Criterion)=>void}) {
  const [category,setCategory]=useState<Category>(item?.category??'Idea'),[status,setStatus]=useState<CriterionStatus>(item?.status??'Not started'),[evidence,setEvidence]=useState(item?.evidence_url??'')
  return <div className="modal-scrim" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose()}}><div className="modal-card" role="dialog" aria-modal="true"><div className="modal-head"><div><small>PROJECT CHECKLIST</small><h2>{item?'Edit requirement':'Add a requirement'}</h2></div><button className="icon-button" onClick={onClose}><X size={18}/></button></div><form onSubmit={(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);onSave({title:String(f.get('title')).trim(),description:String(f.get('description')).trim(),category,status,evidence_url:evidence.trim()||null},item||undefined)}}><label>Requirement name<input name="title" required maxLength={90} defaultValue={item?.title} placeholder="e.g. Collect five user interviews"/></label><label>What does done look like?<textarea name="description" required rows={3} maxLength={360} defaultValue={item?.description} placeholder="Describe the evidence that proves this is ready."/></label><div className="form-two"><label>Stage<select value={category} onChange={(e)=>setCategory(e.target.value as Category)}>{categoryOrder.map((x)=><option key={x}>{x}</option>)}</select></label><label>Status<select value={status} onChange={(e)=>setStatus(e.target.value as CriterionStatus)}>{statuses.map((x)=><option key={x}>{x}</option>)}</select></label></div><label>Evidence URL <small>Optional</small><input type="url" value={evidence} onChange={(e)=>setEvidence(e.target.value)} placeholder="https://..."/></label><div className="modal-actions">{item&&<button type="button" className="button button-danger" onClick={()=>onDelete(item)}>Delete</button>}<button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary">{item?'Save changes':'Add requirement'} <ArrowUpRight size={14}/></button></div></form></div></div>
}

function LaunchKit({progress,signupCount}:{progress:number;signupCount:number|null}) {
  const [tab,setTab]=useState('Pitch deck'),[copied,setCopied]=useState(false),[postCopied,setPostCopied]=useState(false)
  const tabs=['Pitch deck','3-minute demo','Panel prep','Get users']
  async function copyDemo(){try{await navigator.clipboard.writeText('0:00 Problem and audience\\n0:25 Workspace\\n1:05 Live checks\\n1:50 Persistence\\n2:20 User evidence\\n2:45 Close');setCopied(true);window.setTimeout(()=>setCopied(false),1500)}catch{}}
  async function copyCommunityPost(){try{await navigator.clipboard.writeText("I'm testing CapstoneCue, a free workspace for capstone demo-day prep. It keeps reviewer evidence together, checks public GitHub and Vercel links, and helps rehearse a three-minute demo. If you're presenting a capstone soon, could you try it and tell me what is useful or confusing? [add the live URL]");setPostCopied(true);window.setTimeout(()=>setPostCopied(false),1800)}catch{setPostCopied(false)}}
  return <><section className="page-heading-row"><div><div className="eyebrow"><i/> DEMO DAY PREPARATION</div><h1>Launch kit</h1><p>Turn your work into a clear story. Replace prompts with real evidence.</p></div><a className="button button-primary" href="/pitch.html" target="_blank" rel="noreferrer"><FileText size={16}/> Open 6-slide pitch</a></section><div className="launch-kit-grid"><aside className="panel kit-nav"><small>YOUR MATERIALS</small>{tabs.map((x)=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}<ChevronRight size={14}/></button>)}<div className="kit-progress"><small>PROJECT READINESS <b>{progress}%</b></small><div className="mini-progress"><i style={{width:progress+'%'}}/></div><span>Checklist items marked ready</span></div></aside><section className="panel kit-content">
    {tab==='Pitch deck'&&<><div className="kit-title"><FileText/><div><h2>6-slide pitch draft</h2><p>Complete outline. Replace prompts with research and project evidence.</p></div><a href="/pitch.html" target="_blank" rel="noreferrer">Present <ArrowUpRight size={14}/></a></div><div className="slide-outline">{[['01','The problem','Who has this problem? How often does it happen?'],['02','Current alternatives','What do people do today? Where does that fall short?'],['03','The product','Demonstrate one workflow that solves the problem.'],['04','What we learned','Real interviews, tests, and changes. Do not invent demand.'],['05','Business and launch plan','Who pays, how they discover you, and the next test.'],['06','Results and next ask','Verified signups, product proof, gaps, and the help you need.']].map((r)=><div key={r[0]}><b>{r[0]}</b><span><strong>{r[1]}</strong><small>{r[2]}</small></span><CheckCircle2 size={15}/></div>)}</div><div className="kit-callout"><Sparkles size={16}/> Market claims and traction must come from your research. This outline does not contain fabricated validation.</div></>}
    {tab==='3-minute demo'&&<><div className="kit-title"><Clock3/><div><h2>Three-minute live demo</h2><p>A short path showing the working product, not just slides.</p></div><button onClick={()=>void copyDemo()}>{copied?'Copied':'Copy run sheet'}</button></div><RehearsalTimer/><div className="timeline">{[['0:00','Problem','Name the capstone problem and the person affected.'],['0:25','Workspace','Show the checklist and how evidence is attached.'],['1:05','Live check','Run GitHub and Vercel checks; show an honest gap.'],['1:50','Persistence','Change a requirement, refresh, and show it saved.'],['2:20','User evidence','Show confirmed signups or feedback. If zero, state next test.'],['2:45','Close','State one milestone and ask for specific panel help.']].map((r)=><div key={r[0]}><b>{r[0]}</b><i/><span><strong>{r[1]}</strong><small>{r[2]}</small></span></div>)}</div><div className="kit-callout"><LockKeyhole size={15}/> Keep email addresses and environment keys off the demo screen.</div></>}
    {tab==='Panel prep'&&<><div className="kit-title"><Users/><div><h2>Industry panel prep</h2><p>Answer with evidence, and state what is still unknown.</p></div></div><div className="qa-list">{[['How do you know this is a real problem?','Show interview notes or feedback. Say who you spoke to and how it changed the product.'],['What makes this different from existing tools?','Name alternatives, compare one workflow, and explain what users said. Never claim there are no competitors.'],['How will you reach ten users?','Name the channel, audience, message, and weekly target. Separate signups from clicks and conversations.'],['How do you protect data?','Explain authentication, row-level security, stored data, and workspace deletion.'],['What will you build next?','Pick the riskiest assumption and set one measurable milestone with a date.']].map((r)=><details key={r[0]}><summary>{r[0]}<ChevronDown size={15}/></summary><p>{r[1]}</p></details>)}</div></>}
    {tab==='Get users'&&<><div className="kit-title"><Rocket/><div><h2>First users launch plan</h2><p>A measurable plan that reports actual signups, not assumptions.</p></div></div><div className="launch-goal"><small>CONFIRMED CAPSTONECUE ACCOUNTS</small><strong>{signupCount===null?'Not connected':signupCount+' / 10'}</strong><div className="mini-progress"><i style={{width:(signupCount===null?0:Math.min(100,signupCount*10))+'%'}}/></div><span>Email-confirmed accounts only. No seed or demo users are counted.</span></div><div className="launch-week"><small>WEEK 1 · LEARN</small><b>Interview 3–5 students building capstones.</b><p>Ask how they track submission evidence today. Offer a short setup session; record actual signups separately from conversations.</p></div><div className="launch-week"><small>WEEK 2 · TEST ONE CHANNEL</small><b>Share a trackable public demo in one student-builder community.</b><p>Follow community rules. Record visits, registrations, and replies. You said you cannot invite ten people directly, so distribution still needs a channel.</p></div><div className="launch-week"><small>COMMUNITY POST · EDIT BEFORE SHARING</small><p>I'm testing CapstoneCue, a free workspace for capstone demo-day prep. It keeps reviewer evidence together, checks public GitHub and Vercel links, and helps rehearse a three-minute demo. If you're presenting a capstone soon, could you try it and tell me what is useful or confusing? [add the live URL]</p><button type="button" className="button button-quiet" onClick={()=>void copyCommunityPost()}>{postCopied?'Copied':'Copy community post'}</button></div></>}
    </section></div></>
}

function RehearsalTimer() {
  const [seconds, setSeconds] = useState(180)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running])
  useEffect(() => { if (seconds === 0) setRunning(false) }, [seconds])
  const elapsed = 180 - seconds
  const phases = [{ start: 0, name: 'Problem and audience' }, { start: 25, name: 'Show the workspace' }, { start: 65, name: 'Run live checks' }, { start: 110, name: 'Prove persistence' }, { start: 140, name: 'Share user evidence' }, { start: 165, name: 'Close with your ask' }]
  const phase = [...phases].reverse().find((item) => elapsed >= item.start) ?? phases[0]
  const time = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
  return <div className="rehearsal-box"><div><small>LIVE REHEARSAL TIMER</small><output aria-live="polite">{time}</output><span>{seconds === 0 ? 'Time is up. Reset and run it again.' : 'Now: ' + phase.name}</span><div className="rehearsal-track"><i style={{ width: (elapsed / 180 * 100) + '%' }} /></div></div><div className="rehearsal-controls"><button className="button button-primary" onClick={() => { if (seconds === 0) setSeconds(180); setRunning((value) => !value) }}>{running ? 'Pause' : seconds === 180 ? 'Start 3 minutes' : seconds === 0 ? 'Run again' : 'Resume'}</button><button className="button button-quiet" onClick={() => { setRunning(false); setSeconds(180) }}>Reset</button></div></div>
}
function Settings({project,user,onSave,onAuth}:{project:Project;user:AuthUser|null;onSave:(patch:Partial<Project>)=>Promise<void>;onAuth:()=>void}) {
  const [draft,setDraft]=useState(project),[saved,setSaved]=useState(false)
  useEffect(()=>setDraft(project),[project.id])
  function patch(p:Partial<Project>){setDraft((x)=>({...x,...p}));setSaved(false)}
  return <><section className="page-heading-row"><div><div className="eyebrow"><i/> PREFERENCES</div><h1>Workspace settings</h1><p>Project details and the public links used for launch checks.</p></div></section><form className="settings-layout" onSubmit={async(e)=>{e.preventDefault();await onSave({name:draft.name.trim(),idea:draft.idea.trim(),github_url:draft.github_url?.trim()||null,deployment_url:draft.deployment_url?.trim()||null});setSaved(true)}}>
    <section className="panel settings-panel"><h3><Target size={18}/> Project profile</h3><p>The basics shown in your overview and pitch outline.</p><label>Project name<input required maxLength={80} value={draft.name} onChange={(e)=>patch({name:e.target.value})}/></label><label>Problem and product summary<textarea rows={4} maxLength={600} value={draft.idea} onChange={(e)=>patch({idea:e.target.value})} placeholder="Who has what problem, and what are you building?"/></label><small>Support market or traction claims with evidence.</small></section>
    <section className="panel settings-panel"><h3><Link2 size={18}/> Public project URLs</h3><p>Only public links can be checked from outside your account.</p><label>GitHub repository URL<input type="url" value={draft.github_url||''} onChange={(e)=>patch({github_url:e.target.value||null})} placeholder="https://github.com/owner/repository"/></label><label>Live Vercel deployment URL<input type="url" value={draft.deployment_url||''} onChange={(e)=>patch({deployment_url:e.target.value||null})} placeholder="https://project.vercel.app"/></label><small><LockKeyhole size={14}/> Checker accepts GitHub repositories and Vercel deployments.</small></section>
    <section className="panel settings-panel"><h3><LockKeyhole size={18}/> Account & storage</h3><p>{user?'Signed in as '+user.email:'This browser is using an isolated demo workspace.'}</p>{supabaseReady?<small className="connection-ok">Supabase environment configured</small>:<><small className="connection-warn">Supabase is not configured · edits stay in this browser.</small><p>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel. Never expose a service-role key in the browser.</p><button type="button" className="button button-quiet" onClick={onAuth}>Account setup</button></>}</section>
    <div className="settings-save"><span>{saved?'✓ Saved':'Changes save when you click Save settings.'}</span><button className="button button-primary">Save settings <Check size={14}/></button></div>
  </form></>
}

function AuthModal({mode,loading,onMode,onClose,onSubmit}:{mode:'signin'|'signup';loading:boolean;onMode:(v:'signin'|'signup')=>void;onClose:()=>void;onSubmit:(e:FormEvent<HTMLFormElement>)=>void}) {
  return <div className="modal-scrim" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose()}}><div className="modal-card auth-card" role="dialog" aria-modal="true"><div className="auth-brand"><Brand/>CapstoneCue</div><button className="icon-button auth-close" onClick={onClose}><X size={18}/></button><div className="auth-heading"><Sparkles/><h2>{mode==='signup'?'Build with proof.':'Welcome back.'}</h2><p>{mode==='signup'?'Create your private capstone workspace.':'Sign in to your workspace.'}</p></div>{!supabaseReady&&<div className="auth-unavailable"><LockKeyhole size={14}/>Configure Supabase before creating real accounts.</div>}<form onSubmit={onSubmit}><label>Email address<input type="email" name="email" autoComplete="email" required placeholder="you@example.com"/></label><label>Password<input type="password" name="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={8} required placeholder="At least 8 characters"/></label><button className="button button-primary auth-submit" disabled={loading||!supabaseReady}>{loading?'Please wait…':mode==='signup'?'Create free account':'Sign in'} <ArrowUpRight size={15}/></button></form><p className="auth-switch">{mode==='signup'?'Already have an account?':'New to CapstoneCue?'} <button onClick={()=>onMode(mode==='signup'?'signin':'signup')}>{mode==='signup'?'Sign in':'Create account'}</button></p><small className="auth-privacy"><LockKeyhole size={12}/> Private workspace with row-level security.</small></div></div>
}









