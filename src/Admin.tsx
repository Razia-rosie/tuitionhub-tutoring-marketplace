import { Back, Crumbs } from './Rooms'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, ClipboardCheck, Clock, FileText, Home, Inbox, LayoutDashboard, Lock,
  MapPin, MoreVertical, Search, Settings, ShieldCheck, Video, XCircle, ZoomIn, ZoomOut, UserCheck, ArrowLeft, Users,
} from 'lucide-react'
import {
  Alert, Avatar, Button, Card, Empty, Field, Input, Modal, Pill, Role, ROLE_LABEL, Select, Stat, Status, StatusBadge, Tabs, Textarea,
  Timeline, Toggle, useApp,
} from './ui'
import { Shell } from './Shell'
import { Applicant, listApplicants, setAccountStatus } from './api'

type App = { id: string; ref?: string; name: string; role: Role; date: string; status: Status; email: string; phone: string; loc: string }

const fromApplicant = (a: Applicant): App => ({
  id: a.id, ref: `TH-${a.role.slice(0, 3).toUpperCase()}-${a.id.slice(0, 6).toUpperCase()}`, name: a.display_name || a.email, role: a.role,
  date: a.created_at.slice(0, 10), status: a.account_status, email: a.email, phone: a.phone || '—', loc: '—',
})
const SEED: App[] = [
  { id: 'TH-TUT-2931', name: 'Rahim Uddin', role: 'tutor', date: '2026-10-24', status: 'pending', email: 'rahim.uddin@example.com', phone: '+880 1712-XXXXXX', loc: 'Dhaka, Mirpur' },
  { id: 'TH-CEN-3184', name: 'Agrabad Academic Care', role: 'center', date: '2026-10-23', status: 'scheduled', email: 'office@agrabadcare.example', phone: '+880 1811-XXXXXX', loc: 'Chattogram, Agrabad' },
  { id: 'TH-GUA-2210', name: 'Shirin Akter', role: 'guardian', date: '2026-10-22', status: 'approved', email: 'shirin.akter@example.com', phone: '+880 1713-XXXXXX', loc: 'Dhaka, Mirpur' },
  { id: 'TH-STU-0417', name: 'Nabil Hasan', role: 'student', date: '2026-10-22', status: 'completed', email: 'nabil.hasan', phone: '—', loc: 'Dhaka, Mirpur' },
  { id: 'TH-TUT-2927', name: 'Tasnim Jahan', role: 'tutor', date: '2026-10-21', status: 'pending', email: 'tasnim.j@example.com', phone: '+880 1915-XXXXXX', loc: 'Dhaka, Uttara' },
  { id: 'TH-TUT-2915', name: 'Mahmudul Karim', role: 'tutor', date: '2026-10-20', status: 'correction', email: 'mahmud.k@example.com', phone: '+880 1611-XXXXXX', loc: 'Sylhet, Zindabazar' },
  { id: 'TH-CEN-3170', name: 'Nasirabad Study Circle', role: 'center', date: '2026-10-19', status: 'rejected', email: 'hello@nasirabad.example', phone: '+880 1814-XXXXXX', loc: 'Chattogram, Nasirabad' },
  { id: 'TH-GUA-2198', name: 'Kamal Hossain', role: 'guardian', date: '2026-10-18', status: 'invited', email: 'kamal.h@example.com', phone: '+880 1716-XXXXXX', loc: 'Rajshahi, Boalia' },
  { id: 'TH-TUT-2890', name: 'Sadia Rahman', role: 'tutor', date: '2026-10-17', status: 'approved', email: 'sadia.r@example.com', phone: '+880 1717-XXXXXX', loc: 'Khulna, Sonadanga' },
  { id: 'TH-STU-0409', name: 'Ayesha Hasan', role: 'student', date: '2026-10-16', status: 'scheduled', email: 'ayesha.hasan', phone: '—', loc: 'Dhaka, Mirpur' },
  { id: 'TH-CEN-3155', name: 'Sylhet Scholars Hub', role: 'center', date: '2026-10-15', status: 'pending', email: 'info@sylhetscholars.example', phone: '+880 1712-XXXXXX', loc: 'Sylhet, Ambarkhana' },
  { id: 'TH-GUA-2170', name: 'Rina Begum', role: 'guardian', date: '2026-10-14', status: 'documents', email: 'rina.b@example.com', phone: '+880 1819-XXXXXX', loc: 'Barishal, Sadar' },
]
type Iv = { id: number; app: string; name: string; role: Role; type: 'Online' | 'In-person'; date: string; time: string; status: 'Scheduled' | 'Completed' | 'No-show' | 'Rescheduled' }
const IV: Iv[] = [
  { id: 1, app: 'TH-CEN-3184', name: 'Agrabad Academic Care', role: 'center', type: 'In-person', date: '2 Nov 2026', time: '11:00 AM', status: 'Scheduled' },
  { id: 2, app: 'TH-STU-0409', name: 'Ayesha Hasan', role: 'student', type: 'Online', date: '3 Nov 2026', time: '4:30 PM', status: 'Scheduled' },
  { id: 3, app: 'TH-STU-0417', name: 'Nabil Hasan', role: 'student', type: 'Online', date: '20 Oct 2026', time: '10:00 AM', status: 'Completed' },
  { id: 4, app: 'TH-GUA-2210', name: 'Shirin Akter', role: 'guardian', type: 'Online', date: '15 Oct 2026', time: '3:00 PM', status: 'Completed' },
  { id: 5, app: 'TH-TUT-2890', name: 'Sadia Rahman', role: 'tutor', type: 'In-person', date: '12 Oct 2026', time: '12:00 PM', status: 'No-show' },
]
const ivTone = { Scheduled: 'blue', Completed: 'green', 'No-show': 'red', Rescheduled: 'amber' } as const

export function Admin() {
  const { toast, go, setRole, setStatus, user } = useApp()
  // A real admin session works on Supabase data; the prototype navigator keeps the demo seed.
  const live = user?.role === 'admin'
  const [view, setView] = useState('dashboard')
  const [apps, setApps] = useState<App[]>(live ? [] : SEED)
  const [loadErr, setLoadErr] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    setLoadErr('')
    try { setApps((await listApplicants()).map(fromApplicant)) }
    catch (error) { setLoadErr(error instanceof Error ? error.message : 'Unable to load applications.') }
  }, [])
  useEffect(() => { if (live) void load() }, [live, load])
  const [ivs, setIvs] = useState<Iv[]>(live ? [] : IV)
  const [sel, setSel] = useState<App | null>(null)
  const [modal, setModal] = useState<null | { kind: 'correct' | 'schedule' | 'approve' | 'reject'; app: App }>(null)

  /** Returns false (and toasts) when the server rejects the change, so callers keep their modal open. */
  const update = async (id: string, status: Status, note?: string) => {
    if (live) {
      setBusy(true)
      try { await setAccountStatus(id, status, note) }
      catch (error) { toast(error instanceof Error ? error.message : 'Unable to update this application.', 'error'); return false }
      finally { setBusy(false) }
    } else {
      const target = apps.find((x) => x.id === id)
      if (target) { setRole(target.role); setStatus(status) }
    }
    setApps((a) => a.map((x) => (x.id === id ? { ...x, status } : x)))
    return true
  }
  const act = (kind: 'correct' | 'schedule' | 'approve' | 'reject' | 'view' | 'docs', app: App) => {
    if (kind === 'view') { setSel(app); setView('detail'); return }
    if (kind === 'docs') { setSel(app); setView('detail'); return }
    setModal({ kind, app })
  }
  const nav = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'applications', label: 'Applications', icon: ClipboardList }, { id: 'interviews', label: 'Interviews', icon: Calendar }, { id: 'settings', label: 'Account Settings', icon: Settings }]
  const cnt = (f: (a: App) => boolean) => apps.filter(f).length

  return (
    <Shell nav={nav} active={view === 'detail' ? 'applications' : view} onNav={setView} name={user?.display_name || "Admin Rahman"} roleLabel="TuitionHub Administrator" tone="navy">
      {view === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl sm:text-3xl">Admin dashboard</h1><p className="text-sm text-mute">{live ? 'Live data from Supabase' : 'Verification overview · demo data'}</p></div>{live && <Button size="sm" variant="secondary" onClick={load}>Refresh</Button>}</div>
          {loadErr && <Alert kind="error" title="Couldn’t load applications">{loadErr}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Stat icon={Inbox} label="Total pending applications" value={cnt((a) => a.status === 'pending')} tone="amber" />
            <Stat icon={FileText} label="Documents requested" value={cnt((a) => a.status === 'documents')} tone="blue" />
            <Stat icon={Calendar} label="Interviews scheduled" value={ivs.filter((i) => i.status === 'Scheduled').length} tone="indigo" />
            <Stat icon={Clock} label="Awaiting final decision" value={cnt((a) => a.status === 'completed')} tone="teal" />
            <Stat icon={CheckCircle2} label="Approved" value={cnt((a) => a.status === 'approved')} tone="green" />
            <Stat icon={XCircle} label="Rejected" value={cnt((a) => a.status === 'rejected')} tone="red" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card pad={false}><div className="flex items-center justify-between p-5"><h2 className="text-lg">Recently reviewed applications</h2><Button size="sm" variant="ghost" onClick={() => setView('applications')}>View all</Button></div>
              <div className="divide-y divide-line">{apps.filter((a) => ['approved', 'rejected', 'correction', 'completed'].includes(a.status)).slice(0, 5).map((a) => (
                <button key={a.id} onClick={() => act('view', a)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50"><Avatar name={a.name} size={36} /><div className="flex-1"><p className="text-sm font-semibold text-navy">{a.name}</p><p className="text-xs text-mute">{ROLE_LABEL[a.role]}</p></div><StatusBadge status={a.status} /></button>))}</div></Card>
            <div className="space-y-4">
              <Card className="space-y-3"><h2 className="text-lg">Quick links</h2><Button className="w-full" onClick={() => { setView('applications') }}><Inbox size={16} />Open pending queue</Button><Button variant="secondary" className="w-full" onClick={() => setView('interviews')}><Calendar size={16} />Upcoming interviews</Button></Card>
              <Card><h3 className="text-base">Next interview</h3>{(() => { const n = ivs.find((i) => i.status === 'Scheduled'); return n ? <><p className="mt-2 text-sm font-semibold text-navy">{n.name}</p><p className="text-sm text-mute">{n.date} · {n.time} · {n.type}</p></> : <p className="mt-2 text-sm text-mute">No interviews scheduled.</p> })()}</Card>
            </div>
          </div>
        </div>
      )}
      {view === 'applications' && <AppTable apps={apps} act={act} />}
      {view === 'detail' && sel && !live && <div className="mb-4 flex justify-end"><Button size="sm" variant="secondary" onClick={() => go('pending')}>Preview what the applicant sees</Button></div>}
      {view === 'detail' && sel && <Detail app={apps.find((a) => a.id === sel.id)!} act={act} back={() => setView('applications')} home={() => setView('dashboard')} ivs={ivs} />}
      {view === 'interviews' && <Interviews ivs={ivs} setIvs={setIvs} />}
      {view === 'settings' && (
        <div className="max-w-2xl space-y-5"><h1 className="text-2xl sm:text-3xl">Account settings</h1><Card className="space-y-4"><Field label="Name"><Input defaultValue={user?.display_name || 'Admin Rahman'} /></Field><Field label="Email"><Input disabled defaultValue={user?.email ?? 'admin@tuitionhub.example'} /></Field><div className="flex items-center justify-between text-sm"><span>Require re-authentication for approvals</span><Toggle on label="Require re-auth" onChange={() => {}} /></div></Card></div>
      )}

      <Correct m={modal} close={() => setModal(null)} done={async (a, msg) => { if (await update(a.id, 'correction', msg)) { setModal(null); toast(`Correction request sent to ${a.name}.`, 'success') } }} />
      <Schedule m={modal} close={() => setModal(null)} done={async (a, iv) => { if (!(await update(a.id, 'scheduled', `${iv.type} interview · ${iv.date}, ${iv.time}`))) return; setIvs((x) => [{ ...iv, id: Date.now(), app: a.id, name: a.name, role: a.role }, ...x]); setModal(null); toast(`${iv.type} interview scheduled for ${a.name}.`, 'success') }} />
      <Modal open={modal?.kind === 'approve'} onClose={() => setModal(null)} title="Approve this application?"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button loading={busy} onClick={async () => { const a = modal!.app; if (await update(a.id, 'approved')) { toast(`${a.name} approved. They can now complete their profile.`, 'success'); setModal(null) } }}>Approve</Button></>}>
        {modal && <div className="space-y-3 text-sm"><div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><Avatar name={modal.app.name} /><div><p className="font-bold text-navy">{modal.app.name}</p><p className="text-mute">{ROLE_LABEL[modal.app.role]} · {modal.app.ref ?? modal.app.id}</p></div></div>
          <Alert kind="info">Approval unlocks onboarding only. Operational access still needs a 100% complete profile.</Alert></div>}
      </Modal>
      <Reject m={modal} close={() => setModal(null)} done={async (a, reason) => { if (await update(a.id, 'rejected', reason)) { setModal(null); toast(`${a.name} rejected. The applicant will see your reason.`, 'warning') } }} />
    </Shell>
  )
}

function Row({ a, act }: { a: App; act: (k: any, a: App) => void }) {
  const [o, setO] = useState(false)
  const items: [string, string][] = [['view', 'View details'], ['docs', 'Review documents'], ['correct', 'Request correction'], ['schedule', 'Schedule interview'], ['approve', 'Approve'], ['reject', 'Reject']]
  return (
    <div className="relative">
      <button aria-label={`Actions for ${a.name}`} onClick={() => setO(!o)} className="rounded-lg p-2 hover:bg-black/5"><MoreVertical size={18} /></button>
      {o && <>
        <div className="fixed inset-0 z-10" onClick={() => setO(false)} />
        <div role="menu" className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-line bg-white p-1.5 shadow-soft">
          {items.map(([k, l]) => <button key={k} role="menuitem" onClick={() => { setO(false); act(k, a) }} className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${k === 'reject' ? 'text-red-700' : ''}`}>{l}</button>)}
        </div></>}
    </div>
  )
}

function AppTable({ apps, act }: { apps: App[]; act: (k: any, a: App) => void }) {
  const [q, setQ] = useState(''); const [role, setRole] = useState(''); const [st, setSt] = useState(''); const [date, setDate] = useState('')
  const [sort, setSort] = useState<'name' | 'date'>('date'); const [asc, setAsc] = useState(false); const [page, setPage] = useState(1)
  const rows = useMemo(() => {
    const r = apps.filter((a) => (!q || (a.name + a.email).toLowerCase().includes(q.toLowerCase())) && (!role || ROLE_LABEL[a.role] === role) && (!st || a.status === st) && (!date || a.date >= date))
    return r.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : a.date.localeCompare(b.date)) * (asc ? 1 : -1))
  }, [apps, q, role, st, date, sort, asc])
  const per = 6, pages = Math.max(1, Math.ceil(rows.length / per)), cur = Math.min(page, pages), view = rows.slice((cur - 1) * per, cur * per)
  const th = (k: 'name' | 'date', l: string) => <button onClick={() => { sort === k ? setAsc(!asc) : (setSort(k), setAsc(true)) }} className="flex items-center gap-1 font-semibold">{l}<span className="text-xs">{sort === k ? (asc ? '▲' : '▼') : '↕'}</span></button>
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div className="space-y-5"><h1 className="text-2xl sm:text-3xl">Applications</h1>
      <Card className="grid gap-3 md:grid-cols-4"><div className="relative md:col-span-1"><Search size={16} className="absolute left-3 top-3.5 text-mute" /><Input className="pl-9" placeholder="Search name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} /></div>
        <Select placeholder="All roles" options={Object.values(ROLE_LABEL)} value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} aria-label="Role" />
        <select className="h-11 rounded-[10px] border border-slate-300 bg-white px-3 text-[15px]" value={st} onChange={(e) => { setSt(e.target.value); setPage(1) }} aria-label="Status"><option value="">All statuses</option>{['pending', 'documents', 'correction', 'invited', 'scheduled', 'completed', 'approved', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1) }} aria-label="Submitted since" /></Card>
      <Card pad={false} className="lg:overflow-visible">
        {rows.length === 0 ? <Empty title="No applications found" text="Try adjusting the filters or clearing your search." action={<Button variant="secondary" onClick={() => { setQ(''); setRole(''); setSt(''); setDate('') }}>Clear filters</Button>} /> : (<>
          <div className="hidden overflow-visible md:block"><table className="w-full text-left text-sm"><thead className="border-b border-line bg-slate-50 text-xs uppercase tracking-wider text-mute"><tr><th className="px-5 py-3">{th('name', 'Applicant')}</th><th>Role</th><th>{th('date', 'Submitted')}</th><th>Status</th><th>Contact</th><th className="w-12" /></tr></thead>
            <tbody className="divide-y divide-line">{view.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/70"><td className="px-5 py-3"><button className="flex items-center gap-3 text-left" onClick={() => act('view', a)}><Avatar name={a.name} size={34} /><span><span className="block font-semibold text-navy">{a.name}</span><span className="text-xs text-mute">{a.ref ?? a.id}</span></span></button></td><td>{ROLE_LABEL[a.role]}</td><td>{fmt(a.date)}</td><td><StatusBadge status={a.status} /></td><td className="text-xs text-mute">{a.email}<br />{a.phone}</td><td className="pr-3"><Row a={a} act={act} /></td></tr>))}</tbody></table></div>
          <div className="divide-y divide-line md:hidden">{view.map((a) => (
            <div key={a.id} className="space-y-2 p-4"><div className="flex items-start justify-between"><button className="flex items-center gap-3 text-left" onClick={() => act('view', a)}><Avatar name={a.name} size={38} /><span><span className="block font-semibold text-navy">{a.name}</span><span className="text-xs text-mute">{ROLE_LABEL[a.role]} · {fmt(a.date)}</span></span></button><Row a={a} act={act} /></div><StatusBadge status={a.status} /><p className="text-xs text-mute">{a.email} · {a.phone}</p></div>))}</div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-mute"><span>{rows.length} results</span><div className="flex items-center gap-2"><Button size="sm" variant="secondary" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft size={16} /></Button><span>Page {cur} of {pages}</span><Button size="sm" variant="secondary" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight size={16} /></Button></div></div></>)}
      </Card></div>
  )
}

function Detail({ app, act, back, home, ivs }: { app: App; act: (k: any, a: App) => void; back: () => void; home: () => void; ivs: Iv[] }) {
  const { toast } = useApp()
  const [tab, setTab] = useState('Information')
  const [note, setNote] = useState('Documents look consistent with the submitted details. Confirm area on interview.')
  const [zoom, setZoom] = useState<string | null>(null); const [z, setZ] = useState(1)
  const docs = app.role === 'center' ? ['Trade license', 'Representative NID front', 'Representative NID back', 'Signboard photo'] : app.role === 'guardian' ? ['NID front', 'NID back', 'Child birth certificate'] : app.role === 'student' ? ['Birth certificate', 'School ID card (no-NID alternative)'] : ['NID front', 'NID back', 'Academic certificate']
  const my = ivs.filter((i) => i.app === app.id)
  return (
    <div className="space-y-5">
      <div><Back onClick={back} label="All applications" /><Crumbs items={[['Admin Dashboard', home], ['Applications', back], [app.name]]} /></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-4"><Avatar name={app.name} size={56} /><div><h1 className="text-2xl">{app.name}</h1><p className="text-sm text-mute">{ROLE_LABEL[app.role]} · {app.ref ?? app.id}</p></div></div><StatusBadge status={app.status} big /></div>
      <Card pad={false}><div className="px-4"><Tabs tabs={['Information', 'Photographs', 'Timeline', 'Interviews', 'Admin notes']} value={tab} onChange={setTab} /></div>
        <div className="p-5 sm:p-6">
          {tab === 'Information' && <dl className="grid gap-4 text-sm sm:grid-cols-2">{[['Name', app.name], ['Email', app.email], ['Phone', app.phone], ['Location', app.loc], ['ID number', '•••• •••• 4821'], ['Submitted', app.date]].map(([a, b]) => <div key={a}><dt className="text-xs text-mute">{a}</dt><dd className="font-semibold text-navy">{b}</dd></div>)}{app.role === 'student' && <div className="sm:col-span-2"><Alert kind="warning" title="No-NID alternative">Guardian-declared: student has no NID. Review the school ID card photo.</Alert></div>}</dl>}
          {tab === 'Photographs' && <div className="space-y-4"><div className="flex items-center gap-2 text-sm font-semibold text-teal-800"><Lock size={15} />Private: visible to authorized admins only</div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{docs.map((d) => <button key={d} onClick={() => { setZoom(d); setZ(1) }} className="overflow-hidden rounded-xl border border-line text-left transition hover:shadow-soft"><div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-[10px] font-bold tracking-widest text-slate-400">SAMPLE · NOT REAL</div><p className="flex items-center justify-between p-2 text-xs font-medium text-navy"><span className="truncate">{d}</span><ZoomIn size={14} /></p></button>)}</div></div>}
          {tab === 'Timeline' && <Timeline items={[{ title: 'Application submitted', sub: app.date, state: 'done' }, { title: 'Documents received', sub: 'All required photos uploaded', state: 'done' }, { title: 'Admin review', state: app.status === 'pending' ? 'current' : 'done' }, { title: 'Interview', state: ['scheduled', 'completed', 'approved'].includes(app.status) ? 'done' : 'todo' }, { title: 'Decision', sub: app.status, state: ['approved', 'rejected'].includes(app.status) ? 'done' : 'todo' }]} />}
          {tab === 'Interviews' && (my.length ? <div className="space-y-3">{my.map((i) => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-4 text-sm"><span className="flex items-center gap-2 font-semibold text-navy">{i.type === 'Online' ? <Video size={16} /> : <MapPin size={16} />}{i.type} · {i.date}, {i.time}</span><Pill tone={ivTone[i.status]}>{i.status}</Pill></div>)}</div> : <Empty title="No interviews yet" text="Use “Invite to interview” to schedule one." />)}
          {tab === 'Admin notes' && <div className="space-y-3"><Field label="Internal note (never shown to the applicant)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field><Button onClick={() => toast('Note saved.', 'success')}>Save note</Button></div>}
        </div>
        <div className="flex flex-col gap-2 border-t border-line bg-slate-50 p-4 sm:flex-row sm:flex-wrap sm:justify-end sm:rounded-b-2xl">
          <Button variant="secondary" onClick={() => act('correct', app)}>Request correction</Button><Button variant="secondary" onClick={() => act('schedule', app)}>Invite to interview</Button><Button variant="destructive" onClick={() => act('reject', app)}>Reject</Button><Button onClick={() => act('approve', app)}>Approve</Button></div></Card>
      <Modal open={!!zoom} onClose={() => setZoom(null)} wide title={zoom || ''} footer={<Button onClick={() => setZoom(null)}>Close</Button>}>
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-teal-800"><Lock size={13} />Private: visible to authorized admins only</p>
        <div className="mb-3 flex items-center gap-2"><Button size="sm" variant="secondary" onClick={() => setZ(Math.max(0.6, z - 0.2))} aria-label="Zoom out"><ZoomOut size={15} /></Button><Button size="sm" variant="secondary" onClick={() => setZ(Math.min(2, z + 0.2))} aria-label="Zoom in"><ZoomIn size={15} /></Button><span className="text-xs text-mute">{Math.round(z * 100)}%</span></div>
        <div className="grid h-72 place-items-center overflow-auto rounded-xl bg-slate-100"><div style={{ transform: `scale(${z})` }} className="w-64 rounded-lg border-2 border-dashed border-slate-400 bg-white p-4 text-xs font-bold text-slate-500 transition"><p>SAMPLE – NOT A REAL DOCUMENT</p><div className="my-3 h-2 w-3/4 rounded bg-slate-300" /><div className="mb-3 h-2 w-1/2 rounded bg-slate-300" /><p className="tracking-widest text-slate-400">{zoom}</p></div></div></Modal>
    </div>
  )
}

function Interviews({ ivs, setIvs }: { ivs: Iv[]; setIvs: React.Dispatch<React.SetStateAction<Iv[]>> }) {
  const { toast } = useApp(); const [tab, setTab] = useState('Upcoming')
  const list = ivs.filter((i) => (tab === 'Upcoming' ? i.status === 'Scheduled' || i.status === 'Rescheduled' : i.status === 'Completed' || i.status === 'No-show'))
  const set = (id: number, status: Iv['status']) => { setIvs((x) => x.map((i) => (i.id === id ? { ...i, status } : i))); toast(`Interview marked ${status}.`, 'success') }
  return (
    <div className="space-y-5"><h1 className="text-2xl sm:text-3xl">Interviews</h1><Tabs tabs={['Upcoming', 'Past']} value={tab} onChange={setTab} />
      {list.length === 0 ? <Card><Empty title="Nothing here" text="Interviews you schedule will appear in this list." /></Card> : <div className="grid gap-4 md:grid-cols-2">{list.map((i) => (
        <Card key={i.id} className="space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Avatar name={i.name} size={40} /><div><p className="font-bold text-navy">{i.name}</p><p className="text-xs text-mute">{ROLE_LABEL[i.role]}</p></div></div><Pill tone={ivTone[i.status]}>{i.status}</Pill></div>
          <p className="flex items-center gap-2 text-sm text-ink">{i.type === 'Online' ? <Video size={15} /> : <MapPin size={15} />}{i.type} · {i.date} · {i.time}</p>
          <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => set(i.id, 'Completed')}>Completed</Button><Button size="sm" variant="ghost" onClick={() => set(i.id, 'No-show')}>No-show</Button><Button size="sm" variant="ghost" onClick={() => set(i.id, 'Rescheduled')}>Reschedule</Button><Button size="sm" variant="ghost" onClick={() => { setIvs((x) => x.filter((v) => v.id !== i.id)); toast('Interview cancelled.', 'warning') }}>Cancel</Button></div></Card>))}</div>}
    </div>
  )
}

function Correct({ m, close, done }: { m: any; close: () => void; done: (a: App, msg: string) => void }) {
  const [f, setF] = useState<string[]>([]); const [msg, setMsg] = useState('')
  const opts = ['NID photo — front', 'NID photo — back', 'Academic certificate', 'Full name', 'Address / area', 'Phone number']
  return (
    <Modal open={m?.kind === 'correct'} onClose={close} title="Request a correction" footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button disabled={!f.length || !msg} onClick={() => { done(m.app, `${msg.trim()}${f.length ? ` (Please update: ${f.join(', ')}.)` : ''}`); setF([]); setMsg('') }}>Send request</Button></>}>
      <div className="space-y-4"><div><p className="mb-2 text-sm font-medium text-navy">Affected fields / documents</p><div className="space-y-2">{opts.map((o) => <label key={o} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal-600" checked={f.includes(o)} onChange={() => setF(f.includes(o) ? f.filter((x) => x !== o) : [...f, o])} />{o}</label>)}</div></div>
        <Field label="Message to applicant" required><Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Explain what needs to change and how." /></Field></div>
    </Modal>
  )
}
function Schedule({ m, close, done }: { m: any; close: () => void; done: (a: App, iv: Omit<Iv, 'id' | 'app' | 'name' | 'role'>) => void }) {
  const [t, setT] = useState<'Online' | 'In-person'>('Online'); const [d, setD] = useState('2026-11-04'); const [tm, setTm] = useState('11:00')
  const stu = m?.app?.role === 'student'
  return (
    <Modal open={m?.kind === 'schedule'} onClose={close} wide title="Schedule interview" footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={() => done(m.app, { type: stu ? 'Online' : t, date: new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), time: tm, status: 'Scheduled' })}>Send invitation</Button></>}>
      <div className="space-y-4"><div><p className="mb-2 text-sm font-medium text-navy">Interview type</p><div className="grid gap-2 sm:grid-cols-2">
        {(['Online', 'In-person'] as const).map((o) => { const dis = stu && o === 'In-person'; return <label key={o} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${dis ? 'cursor-not-allowed bg-slate-50 text-slate-400' : (stu ? 'Online' : t) === o ? 'border-teal-600 bg-teal-50' : 'border-slate-300'}`}><input type="radio" disabled={dis} className="mt-0.5 accent-teal-600" checked={(stu ? 'Online' : t) === o} onChange={() => setT(o)} /><span><b>{o}</b>{dis && <span className="block text-xs">Not available: student interviews are online only.</span>}</span></label> })}</div></div>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Date" required><Input type="date" value={d} onChange={(e) => setD(e.target.value)} /></Field><Field label="Time" required><Input type="time" value={tm} onChange={(e) => setTm(e.target.value)} /></Field></div>
        {(stu ? 'Online' : t) === 'Online' ? <Field label="Meeting link (placeholder)"><Input placeholder="Paste your meeting link here" /></Field> : <Field label="Address / room" required><Input defaultValue="TuitionHub Office, Room 3B, Mirpur DOHS, Dhaka" /></Field>}
        <Field label="Instructions for the applicant"><Textarea rows={3} defaultValue="Please keep your original documents ready." /></Field></div>
    </Modal>
  )
}
function Reject({ m, close, done }: { m: any; close: () => void; done: (a: App, reason: string) => void }) {
  const [r, setR] = useState('')
  return (
    <Modal open={m?.kind === 'reject'} onClose={close} title="Reject this application?" footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="destructive" disabled={!r.trim()} onClick={() => { done(m.app, r.trim()); setR('') }}>Reject application</Button></>}>
      <div className="space-y-3"><Alert kind="warning">The applicant will see your reason and be told how to reapply, if allowed.</Alert><Field label="Reason (required)" required><Textarea value={r} onChange={(e) => setR(e.target.value)} placeholder="Be specific and respectful." /></Field></div>
    </Modal>
  )
}
