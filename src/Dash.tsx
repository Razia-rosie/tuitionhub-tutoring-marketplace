import { useState } from 'react'
import {
  Bell, BookOpen, Calendar, ClipboardList, Eye, FilePlus2, Home, Link2, Lock, MapPin, Plus, Search, Settings, ShieldCheck, Sparkles,
  UserCog, Users, Video, Wallet, Clock, GraduationCap, Building2, ArrowRight, MessageSquare, Ban, Layers, Award,
} from 'lucide-react'
import {
  Alert, Avatar, Button, Card, Check2, Empty, Field, Illustration, Input, LockOverlay, Modal, Pill, PrivacyNote, Ring, Role, ROLE_LABEL,
  PasswordInput, Select, Skeleton, Stat, StatusBadge, Tabs, Textarea, Toggle, useApp, Bar,
} from './ui'
import { NavItem, Shell } from './Shell'
import { KIDS, roomsFor, useStore } from './store'
import { updateDisplayName } from './api'

export function navFor(role: Role, locked = false): NavItem[] {
  const L = locked
  const m: Record<Role, NavItem[]> = {
    tutor: [{ id: 'home', label: 'Home', icon: Home }, { id: 'rooms', label: 'Learning rooms', icon: GraduationCap, locked: L }, { id: 'search', label: 'Find tuition', icon: Search, locked: L }, { id: 'messages', label: 'Messages', icon: MessageSquare, locked: L }, { id: 'students', label: 'Connected students', icon: Link2, locked: L }, { id: 'apps', label: 'Applications', icon: ClipboardList, locked: L }, { id: 'profile', label: 'My profile', icon: UserCog, locked: L }, { id: 'settings', label: 'Settings', icon: Settings }],
    center: [{ id: 'home', label: 'Home', icon: Home }, { id: 'batches', label: 'Batches', icon: Layers, locked: L }, { id: 'search', label: 'Opportunities', icon: Search, locked: L }, { id: 'messages', label: 'Messages', icon: MessageSquare, locked: L }, { id: 'apps', label: 'Applications', icon: ClipboardList, locked: L }, { id: 'profile', label: 'Center profile', icon: Building2, locked: L }, { id: 'settings', label: 'Settings', icon: Settings }],
    guardian: [{ id: 'home', label: 'Home', icon: Home }, { id: 'students', label: 'My students', icon: Users, locked: L }, { id: 'rooms', label: 'Learning rooms', icon: GraduationCap, locked: L }, { id: 'messages', label: 'Messages', icon: MessageSquare, locked: L }, { id: 'requirement', label: 'Find a tutor', icon: Search, locked: L }, { id: 'oversight', label: 'Oversight', icon: Eye, locked: L }, { id: 'results', label: 'Academic results', icon: Award, locked: L }, { id: 'settings', label: 'Settings', icon: Settings }],
    student: L ? [{ id: 'home', label: 'Status', icon: Home }, { id: 'settings', label: 'Settings', icon: Settings }]
      : [{ id: 'home', label: 'Home', icon: Home }, { id: 'rooms', label: 'My learning', icon: GraduationCap }, { id: 'search', label: 'Opportunities', icon: Search }, { id: 'apps', label: 'Applications', icon: ClipboardList }, { id: 'schedule', label: 'Schedule', icon: Calendar }, { id: 'results', label: 'School results', icon: Award }, { id: 'settings', label: 'Settings', icon: Settings }],
  }
  return m[role]
}
const NAMES: Record<Role, string> = { tutor: 'Rahim Uddin', center: 'Agrabad Academic Care', guardian: 'Shirin Akter', student: 'Nabil Hasan' }
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
/** Signed-in user's own name; demo name while browsing the prototype without a session. */
const useName = (role: Role) => { const { user } = useApp(); return user?.display_name || NAMES[role] }

type Listing = { id: number; title: string; area: string; cls: string; subj: string; fee: number; mode: 'In-person' | 'Online'; days: string; match?: number; poster: string }
const LISTINGS: Listing[] = [
  { id: 1, title: 'Mathematics & Physics tutor for Class 9', area: 'Mirpur', cls: 'Class 9', subj: 'Mathematics', fee: 6000, mode: 'In-person', days: '3 days/week · Evening', match: 94, poster: 'Posted by a verified guardian' },
  { id: 2, title: 'English language support, Class 10', area: 'Uttara', cls: 'Class 10', subj: 'English', fee: 4500, mode: 'Online', days: '2 days/week · Afternoon', match: 81, poster: 'Posted by a verified guardian' },
  { id: 3, title: 'HSC Chemistry exam preparation', area: 'Dhanmondi', cls: 'HSC', subj: 'Chemistry', fee: 8000, mode: 'In-person', days: '4 days/week · Evening', match: 76, poster: 'Posted by a verified guardian' },
  { id: 4, title: 'All-subject home tutor, Class 8', area: 'Mohammadpur', cls: 'Class 8', subj: 'Mathematics', fee: 7000, mode: 'In-person', days: '5 days/week · Morning', poster: 'Posted by a verified guardian' },
  { id: 5, title: 'Bangla & ICT, Class 6', area: 'Banani', cls: 'Class 6', subj: 'ICT', fee: 4000, mode: 'Online', days: '2 days/week · Evening', poster: 'Posted by a verified guardian' },
  { id: 6, title: 'Biology for Class 9 (Chattogram)', area: 'Agrabad', cls: 'Class 9', subj: 'Biology', fee: 5000, mode: 'In-person', days: '3 days/week · Afternoon', poster: 'Posted by a verified guardian' },
]
const APP_STATUS = ['Applied', 'Under review', 'Shortlisted', 'Not selected', 'Accepted'] as const
const appTone: Record<string, 'blue' | 'amber' | 'teal' | 'grey' | 'green'> = { Applied: 'blue', 'Under review': 'amber', Shortlisted: 'teal', 'Not selected': 'grey', Accepted: 'green' }

function ListingCard({ l, applied, onApply, rec, applyLabel = 'Apply' }: { l: Listing; applied: boolean; onApply: () => void; rec?: boolean; applyLabel?: string }) {
  return (
    <Card className="flex flex-col gap-3 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2"><h3 className="text-base leading-snug">{l.title}</h3>{rec && l.match && <Pill tone="teal"><Sparkles size={12} />Recommended for you</Pill>}</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-mute"><span className="flex items-center gap-1"><MapPin size={14} />{l.area}</span><span className="flex items-center gap-1"><Clock size={14} />{l.days}</span><span className="flex items-center gap-1">{l.mode === 'Online' ? <Video size={14} /> : <Home size={14} />}{l.mode}</span></div>
      <div className="flex flex-wrap gap-1.5"><Pill>{l.cls}</Pill><Pill>{l.subj}</Pill></div>
      {rec && l.match && <p className="text-xs text-mute">Matches your subjects, area and availability. This is a suggestion, not a guaranteed match.</p>}
      <div className="mt-auto flex items-center justify-between border-t border-line pt-3"><div><p className="text-lg font-extrabold text-navy">৳{l.fee.toLocaleString()}<span className="text-xs font-medium text-mute"> /month</span></p><p className="text-[11px] text-mute">{l.poster}</p></div>
        <Button size="sm" variant={applied ? 'secondary' : 'primary'} disabled={applied} onClick={onApply}>{applied ? 'Applied' : applyLabel}</Button></div>
    </Card>
  )
}

function SearchView({ role }: { role: Role }) {
  const { toast } = useApp()
  const [q, setQ] = useState({ subj: '', area: '', cls: '', mode: '', fee: '' })
  const [applied, setApplied] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => { setLoading(true); setQ((p) => ({ ...p, [k]: v })); setTimeout(() => setLoading(false), 350) }
  const res = LISTINGS.filter((l) => (!q.subj || l.subj === q.subj) && (!q.area || l.area === q.area) && (!q.cls || l.cls === q.cls) && (!q.mode || l.mode === q.mode) && (!q.fee || l.fee <= Number(q.fee)))
  return (
    <div className="space-y-5">
      <h1 className="text-2xl sm:text-3xl">{role === 'center' ? 'Discover opportunities' : 'Find tuition'}</h1>
      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select options={['Mathematics', 'English', 'Chemistry', 'ICT', 'Biology']} value={q.subj} onChange={(e) => set('subj', e.target.value)} aria-label="Subject" />
        <Select options={['Mirpur', 'Uttara', 'Dhanmondi', 'Mohammadpur', 'Banani', 'Agrabad']} value={q.area} onChange={(e) => set('area', e.target.value)} aria-label="Area" />
        <Select options={['Class 6', 'Class 8', 'Class 9', 'Class 10', 'HSC']} value={q.cls} onChange={(e) => set('cls', e.target.value)} aria-label="Class" />
        <Select options={['In-person', 'Online']} value={q.mode} onChange={(e) => set('mode', e.target.value)} aria-label="Mode" />
        <select className="h-11 rounded-[10px] border border-slate-300 bg-white px-3 text-[15px]" value={q.fee} onChange={(e) => set('fee', e.target.value)} aria-label="Fee"><option value="">Any fee</option><option value="5000">Up to ৳5,000</option><option value="7000">Up to ৳7,000</option><option value="9000">Up to ৳9,000</option></select>
      </Card>
      <p className="text-sm text-mute">{loading ? 'Searching…' : `${res.length} listings · schedule filters coming from your availability`}</p>
      {loading ? <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((n) => <Skeleton key={n} className="h-44" />)}</div>
        : res.length === 0 ? <Card><Empty title="No listings match" text="Try removing a filter or widening the area." action={<Button variant="secondary" onClick={() => setQ({ subj: '', area: '', cls: '', mode: '', fee: '' })}>Clear filters</Button>} /></Card>
          : <div className="grid gap-4 md:grid-cols-2">{res.map((l) => <ListingCard key={l.id} l={l} applied={applied.includes(l.id)} onApply={() => { setApplied([...applied, l.id]); toast('Application sent.', 'success') }} />)}</div>}
    </div>
  )
}

function AppsView({ role }: { role: Role }) {
  const rows = [[LISTINGS[0], 'Applied'], [LISTINGS[1], 'Under review'], [LISTINGS[2], 'Shortlisted'], [LISTINGS[3], 'Not selected'], [LISTINGS[5], 'Accepted']] as [Listing, string][]
  return (
    <div className="space-y-5"><h1 className="text-2xl sm:text-3xl">{role === 'guardian' ? 'Tutor applications' : 'My applications'}</h1>
      <div className="flex flex-wrap gap-2">{APP_STATUS.map((s) => <Pill key={s} tone={appTone[s]}>{s}</Pill>)}</div>
      <Card pad={false} className="divide-y divide-line">
        {rows.map(([l, s]) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6"><div><p className="font-semibold text-navy">{l.title}</p><p className="text-sm text-mute">{l.area} · ৳{l.fee.toLocaleString()}/month · applied {20 - l.id} Oct</p></div><Pill tone={appTone[s]}>{s}</Pill></div>))}
      </Card></div>
  )
}

function Schedule() {
  const { role, go } = useApp()
  const st = useStore()
  const rooms = roomsFor(st, role).filter((r) => r.status === 'Active')
  return (
    <div className="space-y-5"><h1 className="text-2xl sm:text-3xl">Schedule</h1>
      {rooms.length === 0 ? <Empty title="Nothing scheduled" text="Sessions appear here once a tuition is confirmed." /> :
        <Card pad={false} className="divide-y divide-line">{rooms.flatMap((r) => r.sessions.filter((x) => !x.tutorMark).map((x) => (
          <div key={r.id + x.id} className="flex flex-wrap items-center gap-3 p-4"><Calendar size={18} className="text-teal-700" /><div className="flex-1"><p className="font-semibold text-navy">{x.label}</p><p className="text-xs text-mute">{r.title} · {KIDS[r.student]}</p></div>
            {x.open && <Pill tone="green">Attendance open</Pill>}<Button size="sm" variant="secondary" onClick={() => go('learn:rooms')}>Open room</Button></div>)))}</Card>}
    </div>
  )
}

function Suggested({ role }: { role: Role }) {
  const { toast } = useApp(); const [ap, setAp] = useState<number[]>([])
  return (
    <div><div className="mb-3 flex items-center justify-between"><h2 className="text-xl">Suggested tuition opportunities</h2><span className="text-xs text-mute">Based on subjects, area, availability</span></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{LISTINGS.filter((l) => l.match).map((l) => <ListingCard key={l.id} l={l} rec applied={ap.includes(l.id)} onApply={() => { setAp([...ap, l.id]); toast(role === 'student' ? 'Request sent to your guardian and the tutor.' : 'Application sent.', 'success') }} />)}</div></div>
  )
}

function Settings_({ role }: { role: Role }) {
  const [a, setA] = useState(true); const [b, setB] = useState(false)
  const [pw, setPw] = useState(false)
  const { toast, user, updateUser } = useApp()
  const [name, setName] = useState(useName(role)); const [saving, setSaving] = useState(false)
  const saveName = async () => {
    if (!user) return toast('Display name saved (prototype only — not signed in).', 'info')
    setSaving(true)
    try { updateUser(await updateDisplayName(name)); toast('Display name saved.') }
    catch (error) { toast(error instanceof Error ? error.message : 'Unable to save your name.', 'error') }
    finally { setSaving(false) }
  }
  return (
    <div className="max-w-2xl space-y-5"><h1 className="text-2xl sm:text-3xl">Account settings</h1>
      <Card className="space-y-4"><Field label="Display name"><div className="flex gap-2"><Input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} /><Button variant="secondary" loading={saving} disabled={!name.trim()} onClick={saveName}>Save</Button></div></Field><Field label="Email"><Input value={user?.email ?? 'user@example.com'} disabled readOnly /></Field><PrivacyNote compact /></Card>
      <Card className="space-y-4">{[['Email me about application updates', a, setA], ['SMS reminders for interviews and classes', b, setB]].map(([t, on, f]) => <div key={t as string} className="flex items-center justify-between gap-4 text-sm"><span>{t as string}</span><Toggle on={on as boolean} onChange={f as (b: boolean) => void} label={t as string} /></div>)}</Card>
      <Card><h3 className="text-base">Security</h3><p className="mt-1 text-sm text-mute">ID numbers appear masked: •••• •••• 4821</p><Button variant="secondary" className="mt-3" onClick={() => setPw(true)}>Change password</Button></Card><Modal open={pw} onClose={() => setPw(false)} title="Change password" footer={<><Button variant="ghost" onClick={() => setPw(false)}>Cancel</Button><Button onClick={() => { setPw(false); toast('Password updated. Other devices will ask you to sign in again.') }}>Update password</Button></>}>
        <div className="space-y-3"><Field label="Current password"><PasswordInput /></Field><Field label="New password"><PasswordInput strength /></Field></div></Modal>
    </div>
  )
}

function Guardian({ view, go }: { view: string; go: (v: string) => void }) {
  const { toast, go: route } = useApp()
  const [sel, setSel] = useState('Nabil Hasan')
  const [modal, setModal] = useState(false)
  const [posted, setPosted] = useState(false)
  const students = [{ n: 'Nabil Hasan', c: 'Class 9 · Dhaka Residential Model College', s: 'active' as const }, { n: 'Ayesha Hasan', c: 'Class 6 · Viqarunnisa Noon School', s: 'scheduled' as const }]
  if (view === 'students' || view === 'home')
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl sm:text-3xl">{view === 'home' ? 'Welcome, Shirin' : 'My students'}</h1><p className="text-sm text-mute">Verified guardian · GD-20418</p></div><Button onClick={() => route('add-student')}><Plus size={16} />Add a student</Button></div>
        {view === 'home' && <div className="grid gap-4 sm:grid-cols-3"><Stat icon={Users} label="Linked students" value={2} /><Stat icon={ClipboardList} label="Open applications" value={3} tone="blue" /><Stat icon={Calendar} label="Classes this week" value={3} tone="amber" /></div>}
        <div className="grid gap-4 md:grid-cols-2">{students.map((s) => (
          <Card key={s.n} className="space-y-3"><div className="flex items-center gap-3"><Avatar name={s.n} size={48} tone="indigo" /><div><p className="font-bold text-navy">{s.n}</p><p className="text-xs text-mute">{s.c}</p></div></div>
            <div className="flex flex-wrap gap-2"><StatusBadge status={s.s} /><Pill tone="green"><ShieldCheck size={12} />Verified relationship</Pill></div>
            <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => { setSel(s.n); go('oversight') }}>View overview</Button><Button size="sm" variant="ghost" onClick={() => setModal(true)}>Application status</Button></div></Card>))}</div>
        {view === 'home' && <Suggested role="guardian" />}
        <Modal open={modal} onClose={() => setModal(false)} title="Student application status" footer={<Button onClick={() => setModal(false)}>Close</Button>}>
          <p className="mb-3 text-sm text-mute">Ayesha Hasan · Account verification</p><StatusBadge status="scheduled" big /><p className="mt-3 text-sm text-ink">Online interview on Sun, 2 Nov · 11:00 AM. Students are interviewed online only. You’ll be notified of the decision.</p></Modal>
      </div>
    )
  if (view === 'oversight')
    return (
      <div className="space-y-5"><h1 className="text-2xl sm:text-3xl">Parent oversight</h1>
        <div className="flex flex-wrap gap-2">{students.map((s) => <button key={s.n} onClick={() => setSel(s.n)} aria-pressed={sel === s.n} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${sel === s.n ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-300 bg-white'}`}><Avatar name={s.n} size={24} tone="indigo" />{s.n}</button>)}</div>
        <Alert kind="info">You can view activity and applications. Private conversations and sensitive account details are not shown.</Alert>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><h3 className="text-base">Profile status</h3><div className="mt-3 flex items-center gap-4"><Ring pct={sel === 'Nabil Hasan' ? 100 : 40} size={80} /><div className="space-y-1.5"><StatusBadge status={sel === 'Nabil Hasan' ? 'active' : 'scheduled'} /><p className="text-xs text-mute">Class {sel === 'Nabil Hasan' ? '9' : '6'}</p></div></div></Card>
          <Card><h3 className="text-base">Tuition applications</h3><ul className="mt-3 space-y-2 text-sm">{sel === 'Nabil Hasan' ? <><li className="flex justify-between">Mathematics, Class 9 <Pill tone="teal">Shortlisted</Pill></li><li className="flex justify-between">Physics, Class 9 <Pill tone="blue">Applied</Pill></li></> : <li className="text-mute">No applications yet. Account not active.</li>}</ul></Card>
          <Card><h3 className="text-base">Schedule &amp; activity</h3><p className="mt-3 text-sm text-ink">{sel === 'Nabil Hasan' ? 'Sat 4:00 PM Mathematics · Mon 5:00 PM Physics (online) · Wed 4:30 PM English' : 'Nothing scheduled.'}</p></Card>
          <Card className="relative min-h-40"><h3 className="text-base">Private conversations</h3><p className="mt-3 text-sm text-mute">Messages between the student and tutors.</p><div className="absolute inset-0 grid place-items-center rounded-2xl bg-white/85 text-center"><div><Ban className="mx-auto text-slate-500" /><p className="mt-2 text-sm font-bold text-navy">Not available to guardians</p></div></div></Card>
        </div>
      </div>
    )
  if (view === 'requirement')
    return (
      <div className="space-y-5"><h1 className="text-2xl sm:text-3xl">Post a tuition requirement</h1>
        <Card className="grid gap-4 sm:grid-cols-2"><Field label="Student" required><Select options={students.map((s) => s.n)} defaultValue="Nabil Hasan" /></Field><Field label="Subject" required><Select options={['Mathematics', 'Physics', 'English']} defaultValue="Mathematics" /></Field><Field label="Area" required><Input defaultValue="Mirpur" /></Field><Field label="Budget (৳/month)" required><Input defaultValue="6000" /></Field>
          <div className="sm:col-span-2"><Button onClick={() => { setPosted(true); toast('Requirement posted. Matching results are ready.', 'success') }}>Post and see matches</Button></div></Card>
        {posted && <div className="grid gap-4 md:grid-cols-2">{[['Rahim Uddin', 'Physics, B.Sc. DU · Mirpur · 4.9'], ['Tasnim Jahan', 'Mathematics, BUET · Mirpur · 4.8']].map(([n, d]) => <Card key={n} className="flex items-center gap-3"><Avatar name={n} size={48} /><div className="flex-1"><p className="font-bold text-navy">{n}</p><p className="text-xs text-mute">{d}</p><Pill tone="green"><ShieldCheck size={12} />Verified</Pill></div><Button size="sm" onClick={() => toast('Request sent.', 'success')}>Request</Button></Card>)}</div>}
      </div>
    )
  return <Settings_ role="guardian" />
}

export function Dashboard({ initial = 'home' }: { initial?: string }) {
  const { role, go } = useApp()
  const name = useName(role)
  const [view, setView] = useState(initial)
  const L = role === 'center' ? 'Institution' : 'Profile'
  let content: React.ReactNode
  if (role === 'guardian') content = <Guardian view={view} go={setView} />
  else if (view === 'search') content = <SearchView role={role} />
  else if (view === 'apps') content = <AppsView role={role} />
  else if (view === 'schedule') content = <Schedule />
  else if (view === 'settings') content = <Settings_ role={role} />
  else if (view === 'profile') content = <Card className="space-y-3"><h1 className="text-2xl">{role === 'center' ? 'Center profile' : 'My profile'}</h1><div className="flex items-center gap-4"><Avatar name={name} size={64} /><div><p className="text-lg font-bold text-navy">{name}</p><Pill tone="green"><ShieldCheck size={12} />Verified by TuitionHub</Pill></div></div><Button variant="secondary" onClick={() => go('profile-wizard')}>Edit profile</Button></Card>
  else content = (
    <div className="space-y-6">
      <div><h1 className="text-2xl sm:text-3xl">{greeting()}, {name.split(' ')[0]}</h1><p className="text-sm text-mute">{role === 'student' ? 'Here’s your learning at a glance.' : 'Here’s what’s happening on your account.'}</p></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-4"><Ring pct={100} size={84} /><div><p className="text-sm font-bold text-navy">{L} status</p><StatusBadge status="active" /></div></Card>
        <Stat icon={ClipboardList} label="Active applications" value={5} tone="blue" />
        <Stat icon={Sparkles} label="New suggestions" value={3} tone="amber" />
      </div>
      {role === 'student' && <Card className="flex flex-wrap items-center gap-4"><Avatar name="Shirin Akter" size={48} /><div className="flex-1"><p className="text-xs font-bold uppercase tracking-wider text-mute">Linked Guardian</p><p className="font-bold text-navy">Shirin Akter</p></div><Pill tone="green"><ShieldCheck size={12} />Verified relationship</Pill></Card>}
      <Suggested role={role} />
      <div><h2 className="mb-3 text-xl">Application status</h2><Card pad={false} className="divide-y divide-line">{[[LISTINGS[0], 'Under review'], [LISTINGS[2], 'Shortlisted']].map(([l, s]) => <div key={(l as Listing).id} className="flex items-center justify-between p-4 sm:px-6"><span className="text-sm font-semibold text-navy">{(l as Listing).title}</span><Pill tone={appTone[s as string]}>{s as string}</Pill></div>)}</Card></div>
    </div>
  )
  const LEARN = ['rooms', 'messages', 'batches', 'results', 'search', ...(role === 'guardian' ? [] : ['students'])]
  const onNav = (id: string) => (LEARN.includes(id) && !(role === 'guardian' && id === 'search') ? go('learn:' + (id === 'search' ? 'feed' : id === 'messages' ? 'chat' : id === 'students' ? 'connections' : id)) : setView(id))
  return <Shell nav={navFor(role)} active={view} onNav={onNav} name={name} roleLabel={ROLE_LABEL[role]}>{content}</Shell>
}

export function DashboardIncomplete() {
  const { role, pct, go } = useApp()
  const name = useName(role)
  const p = pct >= 100 ? 60 : pct
  return (
    <Shell nav={navFor(role).map((n) => ({ ...n, locked: n.id !== 'home' && n.id !== 'settings' }))} active="home" onNav={() => {}} name={name} roleLabel={`${ROLE_LABEL[role]} · profile incomplete`}>
      <div className="space-y-6">
        <Card className="flex flex-col items-center gap-6 border-amber-300 sm:flex-row"><Ring pct={p} size={130} />
          <div className="text-center sm:text-left"><StatusBadge status="incomplete" big /><h1 className="mt-3 text-2xl">You’re approved. Finish your profile to unlock everything.</h1><p className="mt-1 text-sm text-mute">Identity is verified. Only required fields block activation.</p><Button size="lg" className="mt-4" onClick={() => go('profile-wizard')}>Continue profile setup<ArrowRight size={18} /></Button></div></Card>
        <div className="relative grid gap-4 md:grid-cols-3">
          {['Tuition search', 'Applications', 'Suggestions'].map((t) => <Card key={t} className="min-h-40"><h3 className="text-lg">{t}</h3><Skeleton className="mt-4 h-4 w-3/4" /><Skeleton className="mt-2 h-4 w-1/2" /><Skeleton className="mt-2 h-4 w-2/3" /></Card>)}
          <LockOverlay cta="Continue profile setup" onCta={() => go('profile-wizard')} />
        </div>
      </div>
    </Shell>
  )
}

export function AddStudentLocked() {
  const { role, go } = useApp()
  return (
    <Shell nav={navFor('guardian', true)} active="home" onNav={() => {}} name="Shirin Akter" roleLabel="Guardian · pending approval">
      <Card className="mx-auto flex max-w-xl flex-col items-center gap-3 py-10 text-center"><Illustration kind="lock" size={150} /><h1 className="text-2xl">Add a student is locked</h1><p className="text-sm text-mute">Only an approved Guardian can create a student account. Your application is still <b>Pending Admin Review</b>. We’ll unlock this as soon as you’re approved.</p><StatusBadge status="pending" big /><Button variant="secondary" onClick={() => go('pending')}>View my application status</Button></Card>
    </Shell>
  )
}

export function AccessDenied({ restricted }: { restricted?: boolean }) {
  const { go } = useApp()
  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-6"><div className="max-w-md text-center"><Illustration kind="lock" size={170} />
      <h1 className="mt-2 text-3xl">{restricted ? 'Access restricted' : 'You don’t have access to this page'}</h1>
      <p className="mt-2 text-mute">{restricted ? 'This feature is locked until your account is approved and your profile is 100% complete.' : 'This page belongs to another account. Guardians can only open their own linked students; students can only see their linked guardian.'}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center"><Button onClick={() => go('dashboard')}>Back to my dashboard</Button><Button variant="secondary" onClick={() => go('landing')}>Home</Button></div></div></div>
  )
}
