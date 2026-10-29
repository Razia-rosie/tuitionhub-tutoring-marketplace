import { useState } from 'react'
import { Check, MapPin, Send, ShieldCheck, Star } from 'lucide-react'
import {
  Alert, Avatar, Button, Card, Check2, Empty, Field, Illustration, Input, Modal, Pill, Role, ROLE_LABEL, Select, Textarea, useApp,
} from './ui'
import { Back, BatchView, BatchesList, Denied, Feedback, Nav, Results, RoomView, RoomsList } from './Rooms'
import { KIDS, Kid, patchFlow, update, useStore, roomsFor } from './store'
import { Shell } from './Shell'
import { navFor } from './Dash'

const NAMES: Record<Role, string> = { tutor: 'Rahim Uddin', center: 'Agrabad Academic Care', guardian: 'Shirin Akter', student: 'Nabil Hasan' }
const SCREEN_NAV: Record<string, string> = {
  feed: 'search', detail: 'search', apply: 'search', review: 'requirement', request: 'messages', chat: 'messages', demo: 'messages',
  agreement: 'messages', created: 'rooms', connections: 'students', rooms: 'rooms', room: 'rooms', denied: 'rooms', batches: 'batches',
  batch: 'batches', results: 'results', feedback: 'rooms',
}
const NAV_SCREEN: Record<string, string> = { search: 'feed', requirement: 'review', messages: 'chat', students: 'connections', rooms: 'rooms', batches: 'batches', results: 'results', oversight: 'rooms' }


const STEPS = ['Applied', 'Reviewed', 'Communication', 'Demo class', 'Agreement', 'Room']
const stepIndex: Record<string, number> = { detail: 0, apply: 0, review: 1, request: 2, chat: 2, demo: 3, agreement: 4, created: 5 }

function FlowBar({ screen }: { screen: string }) {
  const i = stepIndex[screen] ?? 0
  return (
    <div className="mb-6 overflow-x-auto"><ol className="flex min-w-max items-center gap-2 text-xs font-bold">
      {STEPS.map((s, n) => <li key={s} className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${n < i ? 'bg-teal-600 text-white' : n === i ? 'bg-navy text-white' : 'bg-slate-200 text-mute'}`}>{n < i ? <Check size={13} /> : n + 1}</span>
        <span className={n === i ? 'text-navy' : 'text-mute'}>{s}</span>{n < 5 && <span className="h-px w-6 bg-line" />}
      </li>)}
    </ol></div>
  )
}

const OPPS = [
  { id: 1, title: 'Mathematics & Physics, Class 9', area: 'Mirpur, Dhaka', subj: 'Mathematics', mode: 'In-person', fee: 6000, days: '3 days/week · Evening', student: 'Class 9 · Bangla medium' },
  { id: 2, title: 'English language support, Class 10', area: 'Uttara, Dhaka', subj: 'English', mode: 'Online', fee: 4500, days: '2 days/week · Afternoon', student: 'Class 10 · English version' },
  { id: 3, title: 'HSC Chemistry exam preparation', area: 'Dhanmondi, Dhaka', subj: 'Chemistry', mode: 'In-person', fee: 8000, days: '4 days/week · Evening', student: 'HSC 1st year' },
  { id: 4, title: 'Biology for Class 9', area: 'Agrabad, Chattogram', subj: 'Biology', mode: 'In-person', fee: 5000, days: '3 days/week · Afternoon', student: 'Class 9 · Bangla medium' },
]
type Opp = (typeof OPPS)[number]


export function Learn({ initial = 'feed' }: { initial?: string }) {
  const { role, go, toast } = useApp()
  const st = useStore()
  const flow = st.flow
  const [screen, setScreen] = useState(initial.replace('-locked', ''))
  const [hist, setHist] = useState<string[]>([])
  const [opp, setOpp] = useState<Opp>(OPPS[0])
  const [rid, setRid] = useState(() => roomsFor(st, role)[0]?.id ?? 'nabil-math')
  const [bid, setBid] = useState('c9'); const [subj, setSubj] = useState<string | undefined>()
  const [applied, setApplied] = useState(false)
  const [filters, setFilters] = useState({ subj: 'All subjects', mode: 'Any mode' })

  const nav: Nav = (s, p) => {
    setHist((h) => [...h, `${screen}|${rid}|${bid}|${subj ?? ''}`])
    if (p?.rid) setRid(p.rid)
    if (p?.bid) setBid(p.bid)
    setSubj(p?.subj)
    setScreen(s)
  }
  const back = () => {
    const h = [...hist]; const last = h.pop()
    if (!last) return go('dashboard')
    const [s, r, b, sj] = last.split('|')
    setHist(h); setScreen(s); setRid(r); setBid(b); setSubj(sj || undefined)
  }
  const onNav = (id: string) => {
    const dest: Record<string, string> = { home: 'dash:home', settings: 'dash:settings', profile: 'dash:profile', apps: 'dash:apps', schedule: 'dash:schedule' }
    if (dest[id]) return go(dest[id])
    setHist([]); setSubj(undefined); setScreen(NAV_SCREEN[id] ?? 'rooms')
  }
  const patch = patchFlow
  const canTeach = role === 'tutor' || role === 'center'
  const showBack = hist.length > 0 && !['created'].includes(screen)
  let c: React.ReactNode

  if (screen === 'feed') {
    const list = OPPS.filter((o) => (filters.subj === 'All subjects' || o.subj === filters.subj) && (filters.mode === 'Any mode' || o.mode === filters.mode))
    c = (
      <div className="space-y-5">
        <div><h1 className="text-2xl sm:text-3xl">Tuition opportunities</h1><p className="text-sm text-mute">Requirements posted by verified guardians and students.</p></div>
        <Card className="grid gap-3 sm:grid-cols-3">
          <Field label="Subject"><Select placeholder={false} options={['All subjects', 'Mathematics', 'English', 'Chemistry', 'Biology', 'Physics']} value={filters.subj} onChange={(e) => setFilters({ ...filters, subj: e.target.value })} /></Field>
          <Field label="Mode"><Select placeholder={false} options={['Any mode', 'In-person', 'Online']} value={filters.mode} onChange={(e) => setFilters({ ...filters, mode: e.target.value })} /></Field>
          <div className="flex items-end"><Button variant="ghost" onClick={() => setFilters({ subj: 'All subjects', mode: 'Any mode' })}>Clear filters</Button></div>
        </Card>
        {list.length === 0 ? <Empty title="No opportunities match" text="Try removing a filter to see more requirements." action={<Button variant="secondary" onClick={() => setFilters({ subj: 'All subjects', mode: 'Any mode' })}>Clear filters</Button>} /> :
          <div className="grid gap-4 md:grid-cols-2">{list.map((o) => (
            <Card key={o.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2"><h3 className="text-base leading-snug">{o.title}</h3><Pill tone="green"><ShieldCheck size={12} />Verified guardian</Pill></div>
              <p className="flex items-center gap-1.5 text-sm text-mute"><MapPin size={14} />{o.area} · {o.mode}</p>
              <p className="text-sm text-mute">{o.days}</p>
              <div className="mt-auto flex items-center justify-between"><b className="text-navy">৳{o.fee.toLocaleString()}<span className="text-xs font-medium text-mute"> / month</span></b>
                <Button size="sm" onClick={() => { setOpp(o); setApplied(false); nav('detail') }}>View details</Button></div>
            </Card>))}</div>}
      </div>
    )
  } else if (screen === 'detail') {
    c = (
      <div className="space-y-5"><FlowBar screen="detail" />
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card className="space-y-4"><h1 className="text-2xl">{opp.title}</h1>
            <div className="flex flex-wrap gap-2"><Pill tone="teal">{opp.subj}</Pill><Pill>{opp.mode}</Pill><Pill>{opp.student}</Pill></div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">{[['Area', opp.area], ['Schedule', opp.days], ['Budget', `৳${opp.fee.toLocaleString()} / month`], ['Posted', '2 days ago']].map(([k, v]) => <div key={k}><dt className="text-xs font-bold uppercase tracking-wider text-mute">{k}</dt><dd className="font-semibold text-navy">{v}</dd></div>)}</dl>
            <p className="text-sm text-mute">Looking for a patient tutor who can build exam confidence and give regular practice tasks. Weekly progress updates are appreciated.</p>
            <Alert kind="info" title="Contact details are protected">Exact address and phone numbers are shared only after both sides confirm the tuition.</Alert></Card>
          <Card className="h-fit space-y-3"><div className="flex items-center gap-3"><Avatar name="Shirin Akter" /><div><p className="font-bold text-navy">Verified guardian</p><p className="text-xs text-mute">Identity checked by TuitionHub</p></div></div>
            {role === 'tutor' ? (applied ? <Alert kind="success" title="Application sent">The guardian will review it. No tuition starts until both sides confirm.</Alert> : <Button className="w-full" onClick={() => nav('apply')}>Apply for this tuition</Button>) : <Alert kind="warning">{role === 'center' ? 'Coaching centers enroll students into batches. Individual tuition applications are for private tutors.' : 'Only tutors can apply for tuition.'}</Alert>}</Card>
        </div>
      </div>
    )
  } else if (screen === 'apply') {
    c = (
      <div className="mx-auto max-w-2xl space-y-5"><FlowBar screen="apply" />
        <Card className="space-y-4"><h1 className="text-2xl">Apply: {opp.title}</h1>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Proposed monthly fee (৳)" required><Input defaultValue={opp.fee} /></Field><Field label="Days per week" required><Select placeholder={false} options={['2', '3', '4', '5']} defaultValue="3" /></Field></div>
          <Field label="Short introduction" required hint="Explain your approach. Do not include phone numbers or addresses."><Textarea rows={4} defaultValue="I have 5 years of experience teaching SSC mathematics and focus on weekly practice and mock tests." /></Field>
          <Check2 checked onChange={() => {}} label="I’m willing to give a demo class" />
          <p className="text-xs text-mute">Submitting an application does not create a tuition. The guardian reviews it first.</p>
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={back}>Cancel</Button><Button onClick={() => { setApplied(true); toast('Application sent to the guardian.'); back() }}>Submit application</Button></div></Card>
      </div>
    )
  } else if (screen === 'review') {
    const rows = [['Rahim Uddin', 'BUET · 5 yrs', 6000, 4.8], ['Sumaiya Rahman', 'DU · 3 yrs', 5500, 4.6], ['Tanvir Hossain', 'NSU · 2 yrs', 5000, 4.3]] as const
    c = (
      <div className="space-y-5"><FlowBar screen="review" />
        <div><h1 className="text-2xl sm:text-3xl">Applicants for {opp.title}</h1><p className="text-sm text-mute">Review profiles, then request communication. Contact details stay hidden.</p></div>
        {role !== 'guardian' && <Alert kind="warning">Only the guardian who posted this requirement can review applicants.</Alert>}
        <div className="grid gap-4 md:grid-cols-3">{rows.map(([n, e, f, r], i) => (
          <Card key={n} className="space-y-3"><div className="flex items-center gap-3"><Avatar name={n} /><div><p className="font-bold text-navy">{n}</p><p className="text-xs text-mute">{e}</p></div></div>
            <div className="flex items-center gap-2 text-sm"><Star size={14} className="fill-amber-cta text-amber-cta" />{r} · <Pill tone="green"><ShieldCheck size={12} />Verified</Pill></div>
            <p className="text-sm text-mute">Proposes <b className="text-navy">৳{f.toLocaleString()}</b> / month</p>
            <div className="flex gap-2"><Button size="sm" className="flex-1" disabled={role !== 'guardian'} onClick={() => { if (i === 0 && flow.comm !== 'none') return nav('request'); patch({ comm: 'pending' }); toast('Communication request sent.', 'info'); nav('request') }}>{i === 0 && flow.comm !== 'none' ? 'View request' : 'Request chat'}</Button>
              <Button size="sm" variant="ghost" disabled={role !== 'guardian'} onClick={() => toast(`${n}’s application declined. They’re notified politely.`, 'info')}>Decline</Button></div></Card>))}</div>
      </div>
    )
  } else if (screen === 'request') {
    c = (
      <div className="mx-auto max-w-2xl space-y-5"><FlowBar screen="request" />
        {flow.comm === 'none' && <Alert kind="info" title="No request yet">Request a chat from an applicant first.</Alert>}
        {flow.comm === 'pending' && role === 'tutor' && <Alert kind="info" title="Guardian wants to talk"><p className="mb-3">Shirin Akter requested a chat about “{opp.title}”.</p><div className="flex gap-2"><Button size="sm" onClick={() => { patch({ comm: 'accepted' }); toast('Chat unlocked.'); nav('chat') }}>Accept</Button><Button size="sm" variant="secondary" onClick={() => { patch({ comm: 'declined' }); toast('Request declined.', 'info') }}>Decline</Button></div></Alert>}
        {flow.comm === 'pending' && role !== 'tutor' && <Alert kind="info" title="Waiting for the tutor to accept">Messaging unlocks once the tutor accepts. Switch to the tutor role in the prototype navigator to respond.</Alert>}
        {flow.comm === 'declined' && <Alert kind="warning" title="Request declined">The tutor chose not to continue. Review other applicants to find a match.</Alert>}
        {flow.comm === 'accepted' && <Alert kind="success" title="Request accepted">You can now message each other.</Alert>}
        <div className="flex gap-2">{flow.comm === 'accepted' && <Button onClick={() => nav('chat')}>Open messages</Button>}{flow.comm === 'declined' && <Button variant="secondary" onClick={() => go('learn:review')}>Back to applicants</Button>}</div>
      </div>
    )
  } else if (screen === 'chat') {
    c = <Chat comm={flow.comm} next={() => nav('demo')} toRequest={() => nav('request')} />
  } else if (screen === 'demo') {
    const s = flow.demo
    const tone = { Proposed: 'amber', Agreed: 'blue', Rescheduled: 'amber', Cancelled: 'red', Completed: 'green' }[s] as 'amber'
    c = (
      <div className="mx-auto max-w-2xl space-y-5"><FlowBar screen="demo" />
        {flow.comm !== 'accepted' ? <Alert kind="warning" title="Communication not accepted">A demo class can be scheduled only after the tutor accepts the communication request.</Alert> :
        <Card className="space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl">Demo class</h1><Pill tone={tone}>{s}</Pill></div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">{[['Date', s === 'Rescheduled' ? 'Mon, 10 Nov' : 'Sat, 8 Nov'], ['Time', '5:00 PM'], ['Mode', opp.mode]].map(([k, v]) => <div key={k}><dt className="text-xs font-bold uppercase text-mute">{k}</dt><dd className="font-semibold text-navy">{v}</dd></div>)}</dl>
          <p className="text-sm text-mute">{s === 'Cancelled' ? 'The demo was cancelled. You can propose another time or return to applicants.' : 'The demo is free of obligation. Either side may decline to continue afterwards.'}</p>
          <div className="flex flex-wrap gap-2">
            {s === 'Proposed' && <><Button onClick={() => patch({ demo: 'Agreed' })}>Agree to time</Button><Button variant="secondary" onClick={() => patch({ demo: 'Rescheduled' })}>Propose new time</Button></>}
            {s === 'Rescheduled' && <Button onClick={() => patch({ demo: 'Agreed' })}>Accept new time</Button>}
            {s === 'Agreed' && <><Button onClick={() => patch({ demo: 'Completed' })}>Mark as completed</Button><Button variant="secondary" onClick={() => patch({ demo: 'Rescheduled' })}>Reschedule</Button></>}
            {s !== 'Completed' && s !== 'Cancelled' && <Button variant="destructive" onClick={() => patch({ demo: 'Cancelled' })}>Cancel demo</Button>}
            {s === 'Cancelled' && <><Button variant="secondary" onClick={() => patch({ demo: 'Proposed' })}>Propose another time</Button><Button variant="ghost" onClick={() => go('learn:review')}>Back to applicants</Button></>}
            {s === 'Completed' && <Button onClick={() => nav('agreement')}>Continue to agreement</Button>}</div></Card>}
      </div>
    )
  } else if (screen === 'agreement') {
    c = <Agreement opp={opp} role={role} done={() => {
      update((x) => x.rooms.some((r) => r.id === 'nabil-phy') ? x : { ...x, rooms: [...x.rooms, { id: 'nabil-phy', student: 'nabil' as Kid, title: opp.title, cls: 'Class 9', tutor: 'Rahim Uddin', days: opp.days, status: 'Active' as const, sessions: [{ id: 's0', label: 'First class · to be scheduled', open: false, selfMark: false, tutorMark: null }], assignments: [], daily: [], materials: [], announcements: [], perf: [], results: [], feedback: [] }] })
      setRid('nabil-phy'); setHist([]); setScreen('created'); toast('Private Tuition Room created.')
    }} />
  } else if (screen === 'created') {
    c = (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 pt-6 text-center"><FlowBar screen="created" /><Illustration kind="success" size={200} />
        <h1 className="text-2xl">Private Tuition Room created</h1><p className="text-sm text-mute">Tuition confirmed by the guardian and tutor. {opp.subj} for Nabil Hasan now has its own room, separate from his other tuitions.</p>
        <Button onClick={() => { setHist([]); setScreen('room') }}>Open the room</Button></div>
    )
  } else if (screen === 'connections') {
    const room = (i: string) => st.rooms.find((r) => r.id === i)
    c = (
      <div className="space-y-5"><h1 className="text-2xl sm:text-3xl">Connected students</h1>
        <Card pad={false} className="divide-y divide-line">{st.rooms.filter((r) => r.status === 'Active').map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 p-4"><Avatar name={KIDS[r.student]} /><div className="flex-1"><p className="font-bold text-navy">{KIDS[r.student]}</p><p className="text-xs text-mute">{r.title} · {r.cls}</p></div><Pill tone="green">Active tuition</Pill>
            <Button size="sm" variant="secondary" onClick={() => nav('room', { rid: r.id })}>Open room</Button></div>))}
          <div className="flex flex-wrap items-center gap-3 p-4"><Avatar name="Imran Chowdhury" /><div className="flex-1"><p className="font-bold text-navy">Imran Chowdhury</p><p className="text-xs text-mute">Chemistry · HSC</p></div><Pill tone="amber">Agreement pending</Pill>
            <Button size="sm" variant="secondary" onClick={() => nav('agreement')}>Continue</Button></div>
          {room('nabil-chem') && <div className="flex flex-wrap items-center gap-3 p-4"><Avatar name="Nabil Hasan" /><div className="flex-1"><p className="font-bold text-navy">Nabil Hasan</p><p className="text-xs text-mute">Chemistry · ended</p></div><Pill>Completed</Pill><Button size="sm" variant="ghost" onClick={() => nav('room', { rid: 'nabil-chem' })}>History</Button></div>}</Card>
      </div>
    )
  } else if (screen === 'rooms') {
    c = <RoomsList role={role} nav={nav} />
  } else if (screen === 'room') {
    c = <RoomView key={rid} role={role} rid={rid} nav={nav} />
  } else if (screen === 'denied') {
    c = <Denied nav={nav} />
  } else if (screen === 'batches') {
    c = <BatchesList role={role} nav={nav} />
  } else if (screen === 'batch') {
    c = <BatchView key={bid + subj} role={role} bid={bid} subj={subj} nav={nav} />
  } else if (screen === 'results') {
    c = <Results role={role} />
  } else if (screen === 'feedback') {
    c = <Feedback role={role} rid={rid} nav={nav} />
  }

  const switcher = role === 'guardian' && ['rooms', 'room', 'results', 'batches', 'batch', 'feedback'].includes(screen)
  return (
    <Shell nav={navFor(role)} active={SCREEN_NAV[screen] ?? 'rooms'} onNav={onNav} name={NAMES[role]} roleLabel={ROLE_LABEL[role]}>
      {showBack && <Back onClick={back} />}
      {switcher && (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold text-navy">Viewing child:</span>
          <Select placeholder={false} options={Object.values(KIDS)} className="max-w-44" aria-label="Switch child" value={KIDS[st.child]} onChange={(e) => {
            const k = (Object.keys(KIDS) as Kid[]).find((x) => KIDS[x] === e.target.value)!
            update((s) => ({ ...s, child: k }))
            const first = st.rooms.find((r) => r.student === k && r.status === 'Active')
            if (first) setRid(first.id)
            if (screen === 'room' || screen === 'feedback') setScreen('room')
            if (screen === 'batch') setScreen('batches')
            toast(`Now showing ${e.target.value}’s records.`, 'info')
          }} /></div>
      )}
      {c}
    </Shell>
  )
}

function Chat({ comm, next, toRequest }: { comm: string; next: () => void; toRequest: () => void }) {
  const { msgs } = useStore()
  const [v, setV] = useState('')
  if (comm !== 'accepted')
    return <div className="mx-auto max-w-lg pt-8"><Empty title="Messaging is locked" text={comm === 'declined' ? 'The communication request was declined.' : 'You can message once the tutor accepts your communication request.'} action={<Button variant="secondary" onClick={toRequest}>View request status</Button>} /></div>
  return (
    <div className="mx-auto max-w-2xl space-y-3"><FlowBar screen="chat" />
      <Card className="flex h-[420px] flex-col" pad={false}>
        <div className="flex items-center gap-3 border-b border-line p-4"><Avatar name="Shirin Akter" /><b className="text-navy">Shirin Akter</b><Button size="sm" variant="secondary" className="ml-auto" onClick={next}>Schedule demo</Button></div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">{msgs.map((m, i) => <div key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.me ? 'ml-auto bg-teal-600 text-white' : 'bg-slate-100 text-ink'}`}>{m.t}</div>)}</div>
        <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { update((s) => ({ ...s, msgs: [...s.msgs, { me: true, t: v }] })); setV('') } }}>
          <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Write a message" aria-label="Message" /><Button type="submit" aria-label="Send"><Send size={16} /></Button></form>
      </Card>
      <p className="text-xs text-mute">Please don’t share phone numbers or addresses until the tuition is confirmed.</p></div>
  )
}

function Agreement({ role, opp, done }: { role: Role; opp: Opp; done: () => void }) {
  const { flow } = useStore()
  const { toast } = useApp()
  const [open, setOpen] = useState(false)
  const both = flow.g && flow.t
  return (
    <div className="mx-auto max-w-2xl space-y-5"><FlowBar screen="agreement" />
      <Card className="space-y-4"><h1 className="text-2xl">Tuition agreement</h1>
        {flow.demo !== 'Completed' && <Alert kind="info">The demo class isn’t marked completed yet. You can still confirm if both sides are happy to proceed.</Alert>}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">{[['Subject', opp.subj], ['Schedule', opp.days], ['Monthly fee', `৳${opp.fee.toLocaleString()}`], ['Mode', opp.mode]].map(([k, v]) => <div key={k}><dt className="text-xs font-bold uppercase text-mute">{k}</dt><dd className="font-semibold text-navy">{v}</dd></div>)}</dl>
        <ul className="list-disc space-y-1 pl-5 text-sm text-mute"><li>Fees are agreed directly between guardian and tutor.</li><li>Either party may end the tuition with 7 days’ notice.</li><li>Both parties agree to respect privacy and conduct rules.</li></ul>
        <div className="space-y-2 rounded-xl bg-slate-50 p-4">
          <Check2 checked={flow.g} onChange={(b) => { if (role !== 'guardian') return toast('Only the guardian can accept for the guardian.', 'warning'); patchFlow({ g: b }) }} label="Guardian accepts the agreement" />
          <Check2 checked={flow.t} onChange={(b) => { if (role !== 'tutor') return toast('Only the tutor can accept for the tutor.', 'warning'); patchFlow({ t: b }) }} label="Tutor accepts the agreement" />
          <Check2 checked={flow.s} onChange={(b) => { if (role !== 'student') return toast('Only the student can acknowledge for the student.', 'warning'); patchFlow({ s: b }) }} label="Student acknowledges (optional)" /></div>
        <Button disabled={!both} onClick={() => setOpen(true)}>Confirm tuition</Button>
        <p className="text-xs text-mute">{both ? 'Both required parties have accepted.' : `The guardian and the tutor must each accept from their own account. You are viewing as ${ROLE_LABEL[role]}.`}</p></Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Confirm tuition and create the room?" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Go back</Button><Button onClick={() => { setOpen(false); done() }}>Confirm & create</Button></>}>
        <p className="text-sm text-mute">A separate room is created for this student, shared with the tutor and linked guardian.</p></Modal>
    </div>
  )
}
