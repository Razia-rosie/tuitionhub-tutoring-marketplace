import { useState } from 'react'
import { ArrowLeft, CheckCircle2, ChevronRight, FileText, Lock, Megaphone, Plus, Star, Upload, Users, Layers, Award, ClipboardList, Calendar, Eye } from 'lucide-react'
import { Alert, Avatar, Bar, Button, Card, Empty, Field, Illustration, Input, Modal, Pill, Role, Select, Stat, Tabs, Textarea, useApp } from './ui'
import {
  Assn, KIDS, Kid, Room, TaskStatus, patchRoom, patchSub, roomsFor, sessionStatus, uid, update, useStore,
} from './store'

export type Nav = (screen: string, p?: { rid?: string; bid?: string; subj?: string }) => void

export function Back({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return <button onClick={onClick} title={label} className="mb-4 inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-semibold text-teal-700 hover:underline"><ArrowLeft size={16} />{label}</button>
}
export function Crumbs({ items }: { items: [string, (() => void)?][] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-mute">
      {items.map(([l, f], i) => <span key={l} className="flex items-center gap-1">{i > 0 && <ChevronRight size={12} />}{f ? <button onClick={f} className="font-semibold text-teal-700 hover:underline">{l}</button> : <span className="font-semibold text-navy">{l}</span>}</span>)}
    </nav>
  )
}

const aTone: Record<TaskStatus, 'grey' | 'blue' | 'amber' | 'teal' | 'green' | 'red'> = {
  Assigned: 'grey', 'In Progress': 'blue', Submitted: 'amber', 'Under Review': 'teal', Accepted: 'green', 'Correction Requested': 'red',
}

export function RoomsList({ role, nav }: { role: Role; nav: Nav }) {
  const s = useStore()
  const rooms = roomsFor(s, role)
  const active = rooms.filter((r) => r.status === 'Active')
  const hist = rooms.filter((r) => r.status !== 'Active')
  const batches = role === 'student' ? s.batches.filter((b) => b.roster.some((x) => x.kid === 'nabil')) : role === 'guardian' ? s.batches.filter((b) => b.roster.some((x) => x.kid === s.child)) : []
  const Item = ({ r }: { r: Room }) => {
    const pct = Math.round((r.sessions.filter((x) => x.tutorMark === 'Present' || x.tutorMark === 'Late').length / Math.max(1, r.sessions.length)) * 100)
    return (
      <Card className="space-y-3"><div className="flex items-center justify-between gap-2"><h3>{r.title} · {KIDS[r.student]}</h3><Pill tone={r.status === 'Active' ? 'green' : 'grey'}>{r.status}</Pill></div>
        <p className="text-sm text-mute">{r.cls} · {role === 'tutor' ? r.days : `${r.tutor} · ${r.days}`}</p>
        {r.status === 'Active' && <><Bar pct={pct} /><p className="text-xs text-mute">Attendance {pct}%</p></>}
        <Button size="sm" variant={r.status === 'Active' ? 'primary' : 'secondary'} onClick={() => nav('room', { rid: r.id })}>{r.status === 'Active' ? 'Open room' : 'View history'}</Button></Card>
    )
  }
  return (
    <div className="space-y-6"><h1 className="text-2xl sm:text-3xl">{role === 'student' ? 'My learning' : 'Learning rooms'}</h1>
      <div><h2 className="mb-3 text-lg">Private tuition rooms</h2>
        {active.length === 0 ? <Empty title="No active tuition yet" text="A room appears only after a tuition has been confirmed by both sides." /> : <div className="grid gap-4 md:grid-cols-2">{active.map((r) => <Item key={r.id} r={r} />)}</div>}</div>
      {batches.length > 0 && <div><h2 className="mb-3 text-lg">Coaching batches</h2><div className="grid gap-4 md:grid-cols-2">{batches.map((b) => (
        <Card key={b.id} className="space-y-3"><div className="flex items-center justify-between"><h3>{b.name}</h3><Pill tone="teal">Enrolled</Pill></div><p className="text-sm text-mute">{b.schedule}</p><Button size="sm" onClick={() => nav('batch', { bid: b.id })}>Open batch</Button></Card>))}</div></div>}
      {hist.length > 0 && <div><h2 className="mb-3 text-lg">Past tuitions (read-only)</h2><div className="grid gap-4 md:grid-cols-2">{hist.map((r) => <Item key={r.id} r={r} />)}</div></div>}
      {role === 'student' && <Card className="flex flex-wrap items-center gap-3 border-dashed"><Lock size={18} className="text-mute" /><p className="flex-1 text-sm text-mute">Prototype check: open a room that belongs to another student.</p><Button size="sm" variant="ghost" onClick={() => nav('denied')}>Try Tasnim’s room</Button></Card>}
    </div>
  )
}

const RTABS = ['Overview', 'Schedule & Attendance', 'Classwork', 'Daily Tasks', 'Performance', 'Reports & Results', 'Feedback', 'Announcements']

export function RoomView({ role, rid, nav }: { role: Role; rid: string; nav: Nav }) {
  const { toast } = useApp()
  const s = useStore()
  const room = s.rooms.find((r) => r.id === rid)
  const [tab, setTab] = useState(RTABS[0])
  const [txt, setTxt] = useState('')
  const [modal, setModal] = useState<null | { kind: 'assign' | 'submit' | 'correct'; a?: Assn }>(null)
  const [f1, setF1] = useState(''); const [f2, setF2] = useState(''); const [file, setFile] = useState('')
  if (!room || (role === 'student' && room.student !== 'nabil') || (role === 'guardian' && room.student !== s.child))
    return <Empty title="Room not available" text="This room isn’t linked to your account." action={<Button onClick={() => nav('rooms')}>Back to rooms</Button>} />
  const tutor = role === 'tutor', student = role === 'student'
  const live = room.status === 'Active'
  const canTeach = tutor && live
  const P = (fn: (r: Room) => Room) => patchRoom(room.id, fn)
  const setA = (id: string, p: Partial<Assn>) => P((r) => ({ ...r, assignments: r.assignments.map((a) => (a.id === id ? { ...a, ...p } : a)) }))
  const pending = room.assignments.filter((a) => a.status === 'Submitted' || a.status === 'Under Review').length
  const attended = room.sessions.filter((x) => x.tutorMark === 'Present' || x.tutorMark === 'Late').length
  const pct = Math.round((attended / Math.max(1, room.sessions.length)) * 100)
  const eligible = attended > 0

  return (
    <div className="space-y-5">
      <Crumbs items={[['Learning rooms', () => nav('rooms')], [`${KIDS[room.student]}`], [room.title]]} />
      <div className="flex flex-wrap items-center gap-3"><div className="flex-1"><h1 className="text-2xl sm:text-3xl">{room.title} · {KIDS[room.student]}</h1><p className="text-sm text-mute">Private Tuition Room · {room.cls} · {room.tutor}</p></div>
        <Pill tone={live ? 'green' : 'grey'}>{room.status}</Pill></div>
      {!live && <Alert kind="info" title="Read-only history">This tuition has ended. Records are kept for reference and can’t be edited.</Alert>}
      {live && role === 'guardian' && <Alert kind="info"><Eye size={14} className="mr-1 inline" />View-only monitoring. You can follow progress but can’t submit work or mark attendance for {KIDS[room.student].split(' ')[0]}.</Alert>}
      {live && student && <Alert kind="info">You can check in to open sessions, complete tasks and submit work. Grades and reviews are set by your tutor.</Alert>}
      <Tabs tabs={RTABS} value={tab} onChange={setTab} />

      {tab === 'Overview' && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Calendar} label="Schedule" value={room.days.split(',')[0]} /><Stat icon={CheckCircle2} label="Attendance" value={`${pct}%`} tone="blue" />
        <Stat icon={ClipboardList} label="Open tasks" value={room.daily.filter((d) => !d.done).length + room.assignments.filter((a) => a.status === 'Assigned' || a.status === 'In Progress' || a.status === 'Correction Requested').length} tone="amber" />
        <Stat icon={Award} label="Latest test" value={room.perf.length ? `${room.perf[room.perf.length - 1][1]}%` : '—'} /></div>
        {tutor && <Card className="space-y-1"><h3 className="text-base">Teacher activity summary</h3><p className="text-sm text-mute">{room.sessions.filter((x) => x.open || x.tutorMark).length} sessions opened · {room.assignments.length} assignments set · {pending} awaiting your review · {room.announcements.length} announcements</p></Card>}</div>}

      {tab === 'Schedule & Attendance' && <Card pad={false} className="divide-y divide-line">{room.sessions.map((x) => (
        <div key={x.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-40 flex-1"><p className="font-semibold text-navy">{x.label}</p><p className="text-xs text-mute">{sessionStatus(x)}</p></div>
          {canTeach && !x.open && !x.tutorMark && <Button size="sm" onClick={() => { P((r) => ({ ...r, sessions: r.sessions.map((y) => (y.id === x.id ? { ...y, open: true } : y)) })); toast('Attendance opened. The student can now check in.', 'info') }}>Open attendance</Button>}
          {canTeach && (x.open || x.tutorMark) && (['Present', 'Late', 'Absent'] as const).map((m) => <button key={m} onClick={() => { P((r) => ({ ...r, sessions: r.sessions.map((y) => (y.id === x.id ? { ...y, tutorMark: m, open: false } : y)) })); toast(`Marked ${m}.`) }} className={`rounded-full border px-3 py-1 text-xs font-bold ${x.tutorMark === m ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-line text-mute'}`}>{m}</button>)}
          {student && live && x.open && !x.selfMark && !x.tutorMark && <Button size="sm" onClick={() => { P((r) => ({ ...r, sessions: r.sessions.map((y) => (y.id === x.id ? { ...y, selfMark: true } : y)) })); toast('Checked in. Your tutor will confirm.') }}>I’m present</Button>}
          {student && live && !x.open && !x.selfMark && !x.tutorMark && <Pill>Waiting for tutor to open</Pill>}
          {(role === 'guardian' || !live || (student && (x.selfMark || x.tutorMark))) && <Pill tone={x.tutorMark === 'Absent' ? 'red' : x.tutorMark || x.selfMark ? 'green' : 'grey'}>{sessionStatus(x)}</Pill>}
        </div>))}</Card>}

      {tab === 'Classwork' && <div className="space-y-4">
        <div className="flex items-center justify-between"><h3>Assignments</h3>{canTeach && <Button size="sm" onClick={() => { setF1(''); setF2('Fri 14 Nov'); setModal({ kind: 'assign' }) }}><Plus size={14} />New assignment</Button>}</div>
        {room.assignments.length === 0 ? <Empty title="No assignments" text={canTeach ? 'Create the first assignment for this student.' : 'Nothing has been assigned yet.'} /> :
          <Card pad={false} className="divide-y divide-line">{room.assignments.map((a) => (
            <div key={a.id} className="space-y-2 p-4"><div className="flex flex-wrap items-center gap-2"><b className="flex-1 text-navy">{a.title}</b><span className="text-xs text-mute">Due {a.due}</span><Pill tone={aTone[a.status]}>{a.status}</Pill></div>
              {a.file && <p className="flex items-center gap-1.5 text-xs text-mute"><FileText size={13} />{a.file}</p>}
              {a.comment && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-800">Tutor: {a.comment}</p>}
              <div className="flex flex-wrap gap-2">
                {student && live && a.status === 'Assigned' && <Button size="sm" variant="secondary" onClick={() => setA(a.id, { status: 'In Progress' })}>Start work</Button>}
                {student && live && (a.status === 'In Progress' || a.status === 'Correction Requested' || a.status === 'Assigned') && <Button size="sm" onClick={() => { setF1(''); setFile(''); setModal({ kind: 'submit', a }) }}>{a.status === 'Correction Requested' ? 'Resubmit' : 'Submit work'}</Button>}
                {canTeach && a.status === 'Submitted' && <Button size="sm" variant="secondary" onClick={() => setA(a.id, { status: 'Under Review' })}>Start review</Button>}
                {canTeach && (a.status === 'Under Review' || a.status === 'Submitted') && <><Button size="sm" onClick={() => { setA(a.id, { status: 'Accepted', comment: undefined }); toast('Work accepted.') }}>Accept</Button><Button size="sm" variant="destructive" onClick={() => { setF1(''); setModal({ kind: 'correct', a }) }}>Request correction</Button></>}
              </div></div>))}</Card>}
        <h3>Study materials</h3>
        <Card className="space-y-3">{room.materials.length === 0 && <p className="text-sm text-mute">No materials shared yet.</p>}{room.materials.map((m) => <p key={m} className="flex items-center gap-2 text-sm"><FileText size={16} className="text-teal-700" />{m}</p>)}
          {canTeach && <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line p-3 text-sm font-semibold text-teal-700 hover:bg-teal-50"><Upload size={16} />Add material (PDF, JPG, PNG)<input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) { P((r) => ({ ...r, materials: [...r.materials, f.name] })); toast('Material shared with the room.') } }} /></label>}
          <p className="text-xs text-mute">PDF and image files are accepted for study material.</p></Card></div>}

      {tab === 'Daily Tasks' && <Card className="space-y-3">{room.daily.length === 0 && <p className="text-sm text-mute">No daily tasks.</p>}{room.daily.map((d) => (
        <div key={d.id} className="space-y-1 border-b border-line pb-3 last:border-0 last:pb-0"><label className="flex items-center gap-3 text-sm"><input type="checkbox" disabled={!student || !live} checked={d.done} onChange={() => P((r) => ({ ...r, daily: r.daily.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x)) }))} className="h-4 w-4 accent-teal-600" aria-label={`Mark done: ${d.t}`} /><span className={`flex-1 ${d.done ? 'text-mute line-through' : 'font-semibold text-navy'}`}>{d.t}</span><span className="text-xs text-mute">{d.due}</span></label>
          {student && live && <Input placeholder="Diary note (optional)" aria-label="Diary note" value={d.note ?? ''} onChange={(e) => P((r) => ({ ...r, daily: r.daily.map((x) => (x.id === d.id ? { ...x, note: e.target.value } : x)) }))} />}
          {!student && d.note && <p className="pl-7 text-xs text-mute">Student note: {d.note}</p>}</div>))}
        {canTeach && <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (txt.trim()) { P((r) => ({ ...r, daily: [...r.daily, { id: uid(), t: txt, due: 'Today', done: false }] })); setTxt(''); toast('Daily task assigned.') } }}><Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Assign a daily task" aria-label="New daily task" /><Button type="submit">Assign</Button></form>}</Card>}

      {tab === 'Performance' && <Card className="space-y-4">{room.perf.map(([n, p]) => <div key={n}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-navy">{n}</span><span>{p}%</span></div><Bar pct={p} /></div>)}
        {canTeach && <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = Number(f2); if (f1.trim() && v >= 0 && v <= 100) { P((r) => ({ ...r, perf: [...r.perf, [f1, v]] })); setF1(''); setF2(''); toast('Score recorded.') } }}><Input placeholder="Test name" aria-label="Test name" value={f1} onChange={(e) => setF1(e.target.value)} /><Input type="number" min={0} max={100} className="w-24" placeholder="%" aria-label="Score" value={f2} onChange={(e) => setF2(e.target.value)} /><Button type="submit">Add</Button></form>}
        <p className="text-xs text-mute">Tuition performance is recorded by the tutor and is separate from school results.</p></Card>}

      {tab === 'Reports & Results' && <Card className="space-y-3"><h3 className="text-base">School results (shared by the family)</h3>{room.results.length === 0 ? <p className="text-sm text-mute">No school results shared.</p> : room.results.map(([n, p]) => <div key={n}><div className="mb-1 flex justify-between text-sm"><span>{n}</span><span>{p}%</span></div><Bar pct={p} /></div>)}
        {!tutor && <Button variant="secondary" onClick={() => nav('results')}>Manage school results</Button>}</Card>}

      {tab === 'Feedback' && <Card className="space-y-3"><p className="text-sm text-mute">Private feedback is visible only to this room’s members and is never published as a public review.</p>
        {room.feedback.map((f, i) => <p key={i} className="rounded-lg bg-slate-50 p-3 text-sm"><b>{f.by}</b> · {'★'.repeat(f.stars)} — {f.text}</p>)}
        {!tutor && live ? <Button onClick={() => nav('feedback', { rid: room.id })} disabled={!eligible}>{eligible ? 'Give feedback or review' : 'Available after the first attended session'}</Button> : tutor && <p className="text-xs text-mute">Tutors can read feedback here but can’t edit it.</p>}</Card>}

      {tab === 'Announcements' && <Card className="space-y-3">{room.announcements.length === 0 && <p className="text-sm text-mute">No announcements.</p>}{room.announcements.map((a) => <p key={a} className="flex items-center gap-2 text-sm"><Megaphone size={16} className="text-amber-cta" />{a}</p>)}
        {canTeach && <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (txt.trim()) { P((r) => ({ ...r, announcements: [txt, ...r.announcements] })); setTxt(''); toast('Announcement posted to this room only.') } }}><Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Post an announcement" aria-label="Announcement" /><Button type="submit">Post</Button></form>}</Card>}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.kind === 'assign' ? 'New assignment' : modal?.kind === 'submit' ? 'Submit your work' : 'Request correction'}
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={() => {
            if (modal?.kind === 'assign') { if (!f1.trim()) return toast('Add a title first.', 'warning'); P((r) => ({ ...r, assignments: [...r.assignments, { id: uid(), title: f1, due: f2, status: 'Assigned' }] })); toast('Assignment sent to the student.') }
            if (modal?.kind === 'submit' && modal.a) { if (!file && !f1.trim()) return toast('Attach a file or add a note.', 'warning'); setA(modal.a.id, { status: 'Submitted', note: f1, file: file || undefined, comment: undefined }); toast('Submitted. Your tutor will review it.') }
            if (modal?.kind === 'correct' && modal.a) { if (!f1.trim()) return toast('Tell the student what to fix.', 'warning'); setA(modal.a.id, { status: 'Correction Requested', comment: f1 }); toast('Correction requested.', 'info') }
            setModal(null)
          }}>{modal?.kind === 'assign' ? 'Assign' : modal?.kind === 'submit' ? 'Submit' : 'Send request'}</Button></>}>
        <div className="space-y-3">
          {modal?.kind === 'assign' && <><Field label="Title" required><Input value={f1} onChange={(e) => setF1(e.target.value)} /></Field><Field label="Due"><Input value={f2} onChange={(e) => setF2(e.target.value)} /></Field></>}
          {modal?.kind === 'submit' && <><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line p-4 text-sm font-semibold text-teal-700"><Upload size={16} />{file || 'Upload a photo of handwritten work, or a PDF'}<input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} /></label><Field label="Note" optional><Textarea rows={3} value={f1} onChange={(e) => setF1(e.target.value)} /></Field></>}
          {modal?.kind === 'correct' && <Field label="What needs to change?" required><Textarea rows={3} value={f1} onChange={(e) => setF1(e.target.value)} /></Field>}
        </div></Modal>
    </div>
  )
}

export function BatchesList({ role, nav }: { role: Role; nav: Nav }) {
  const { toast } = useApp()
  const s = useStore()
  const center = role === 'center'
  const list = center ? s.batches : s.batches.filter((b) => b.roster.some((x) => x.kid === (role === 'student' ? 'nabil' : s.child)))
  return (
    <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl sm:text-3xl">Batches</h1><p className="text-sm text-mute">Each batch has its own roster and one room per subject.</p></div>
      {center && <Button onClick={() => { update((x) => ({ ...x, batches: [...x.batches, { id: uid(), name: `New batch ${x.batches.length + 1}`, schedule: 'To be scheduled', roster: [], subjects: { Mathematics: { teacher: 'Unassigned', announcements: [], exams: [], materials: [], assignments: [], att: {}, open: false } } }] })); toast('Batch created. Add subjects and students.') }}><Plus size={16} />New batch</Button>}</div>
      {list.length === 0 ? <Empty title="No batches" text="This child isn’t enrolled in a coaching batch." /> : <div className="grid gap-4 md:grid-cols-2">{list.map((b) => (
        <Card key={b.id} className="space-y-3"><div className="flex items-center justify-between gap-2"><h3>{b.name}</h3><Pill tone="teal"><Users size={12} />{b.roster.length} students</Pill></div><p className="text-sm text-mute">{b.schedule}</p>
          <div className="flex flex-wrap gap-1.5">{Object.keys(b.subjects).map((x) => <Pill key={x}>{x}</Pill>)}</div><Button size="sm" onClick={() => nav('batch', { bid: b.id })}>Open batch</Button></Card>))}</div>}
    </div>
  )
}

export function BatchView({ role, bid, subj, nav }: { role: Role; bid: string; subj?: string; nav: Nav }) {
  const { toast } = useApp()
  const s = useStore()
  const b = s.batches.find((x) => x.id === bid)
  const [txt, setTxt] = useState(''); const [tab, setTab] = useState('Announcements')
  const center = role === 'center'
  const me = role === 'student' ? 'nabil' : s.child
  if (!b || (!center && !b.roster.some((x) => x.kid === me))) return <Empty title="Batch not available" text="You’re not enrolled in this batch." action={<Button onClick={() => nav('batches')}>Back to batches</Button>} />
  const sub = subj ? b.subjects[subj] : undefined
  if (!subj || !sub) return (
    <div className="space-y-5"><Crumbs items={[['Batches', () => nav('batches')], [b.name]]} />
      <div><h1 className="text-2xl sm:text-3xl">{b.name}</h1><p className="text-sm text-mute">{b.schedule}</p></div>
      <div className="grid gap-4 md:grid-cols-3">{Object.entries(b.subjects).map(([k, v]) => <Card key={k} className="space-y-2"><h3>{k} room</h3><p className="text-sm text-mute">{v.teacher}</p><Button size="sm" onClick={() => nav('batch', { bid, subj: k })}>Open {k} room</Button></Card>)}</div>
      {center ? <Card className="space-y-3"><h3 className="text-base">Roster</h3><div className="divide-y divide-line">{b.roster.length === 0 && <p className="text-sm text-mute">No students enrolled yet.</p>}{b.roster.map((r) => <div key={r.name} className="flex items-center gap-3 py-2"><Avatar name={r.name} size={32} /><span className="flex-1 text-sm font-semibold text-navy">{r.name}</span>{r.kid ? <Pill tone="green">Guardian authorized</Pill> : <Pill>No guardian link</Pill>}</div>)}</div></Card>
        : <Alert kind="info">You can see your own attendance and announcements. Other students’ records are not shown.</Alert>}
    </div>
  )
  const mine = Object.entries(sub.att)
  return (
    <div className="space-y-5"><Crumbs items={[['Batches', () => nav('batches')], [b.name, () => nav('batch', { bid })], [`${subj} room`]]} />
      <div className="flex flex-wrap items-center gap-3"><div className="flex-1"><h1 className="text-2xl sm:text-3xl">{subj} room</h1><p className="text-sm text-mute">{b.name} · {sub.teacher}</p></div>{sub.open && <Pill tone="green">Attendance open</Pill>}</div>
      <Tabs tabs={['Announcements', 'Attendance', 'Exams', 'Materials & Assignments']} value={tab} onChange={setTab} />
      {tab === 'Announcements' && <Card className="space-y-3">{sub.announcements.length === 0 && <p className="text-sm text-mute">No announcements in this subject room.</p>}{sub.announcements.map((a) => <p key={a} className="flex items-center gap-2 text-sm"><Megaphone size={16} className="text-amber-cta" />{a}</p>)}
        {center && <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (txt.trim()) { patchSub(bid, subj, (r) => ({ ...r, announcements: [txt, ...r.announcements] })); setTxt(''); toast(`Published to ${b.name} · ${subj} only.`) } }}><Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Post to this subject room" aria-label="Announcement" /><Button type="submit">Publish</Button></form>}</Card>}
      {tab === 'Attendance' && <Card className="space-y-3">
        {center ? <><div className="flex flex-wrap gap-2">{!sub.open ? <Button size="sm" onClick={() => patchSub(bid, subj, (r) => ({ ...r, open: true }))}>Open attendance</Button> : <Button size="sm" variant="secondary" onClick={() => { patchSub(bid, subj, (r) => ({ ...r, open: false })); toast('Attendance saved.') }}>Close & save</Button>}</div>
          <div className="divide-y divide-line">{b.roster.map((r) => <div key={r.name} className="flex items-center gap-2 py-2"><span className="flex-1 text-sm font-semibold text-navy">{r.name}</span>{(['Present', 'Absent'] as const).map((m) => <button key={m} disabled={!sub.open} onClick={() => patchSub(bid, subj, (x) => ({ ...x, att: { ...x.att, [r.name]: m } }))} className={`rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-40 ${sub.att[r.name] === m ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-line text-mute'}`}>{m}</button>)}</div>)}</div></>
          : <div className="flex items-center justify-between"><span className="text-sm text-navy">Your status today: <b>{mine.find(([n]) => n === KIDS[me])?.[1] ?? (sub.open ? 'Being taken' : 'Not taken yet')}</b></span>{role === 'guardian' && <Pill>View only</Pill>}</div>}</Card>}
      {tab === 'Exams' && <Card className="space-y-2">{sub.exams.length === 0 ? <p className="text-sm text-mute">No exams scheduled.</p> : sub.exams.map((e) => <p key={e} className="flex items-center gap-2 text-sm"><Calendar size={16} className="text-teal-700" />{e}</p>)}
        {center && <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (txt.trim()) { patchSub(bid, subj, (r) => ({ ...r, exams: [...r.exams, txt] })); setTxt(''); toast('Exam notice published.') } }}><Input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="e.g. Chapter 4 test · Sun 16 Nov" aria-label="Exam notice" /><Button type="submit">Add</Button></form>}</Card>}
      {tab === 'Materials & Assignments' && <Card className="space-y-2"><h3 className="text-base">Materials</h3>{sub.materials.length === 0 && <p className="text-sm text-mute">None yet.</p>}{sub.materials.map((m) => <p key={m} className="flex items-center gap-2 text-sm"><FileText size={16} className="text-teal-700" />{m}</p>)}<h3 className="pt-2 text-base">Assignments</h3>{sub.assignments.length === 0 && <p className="text-sm text-mute">None yet.</p>}{sub.assignments.map((m) => <p key={m} className="flex items-center gap-2 text-sm"><ClipboardList size={16} className="text-teal-700" />{m}</p>)}</Card>}
    </div>
  )
}

export function Results({ role }: { role: Role }) {
  const { toast } = useApp()
  const s = useStore()
  const kid: Kid = role === 'student' ? 'nabil' : s.child
  const room = s.rooms.find((r) => r.student === kid && r.status === 'Active')
  const [open, setOpen] = useState(false); const [n, setN] = useState('Chemistry'); const [m, setM] = useState('70')
  if (!room) return <Empty title="No results yet" text="No school results have been added for this child." />
  return (
    <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl sm:text-3xl">School results · {KIDS[kid]}</h1><p className="text-sm text-mute">Separate from tuition performance recorded by tutors.</p></div><Button onClick={() => setOpen(true)}><Plus size={16} />Add result</Button></div>
      <Card pad={false} className="divide-y divide-line">{room.results.map(([a, p]) => <div key={a} className="p-4"><div className="mb-1 flex justify-between text-sm"><b className="text-navy">{a}</b><span>{p}%</span></div><Bar pct={p} /></div>)}</Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Add school result" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { const v = Number(m); if (!n.trim() || !(v >= 0 && v <= 100)) return toast('Enter a subject and marks between 0 and 100.', 'warning'); patchRoom(room.id, (r) => ({ ...r, results: [...r.results, [n, v]] })); setOpen(false); toast('Result added.') }}>Save</Button></>}>
        <div className="space-y-3"><Field label="Subject"><Input value={n} onChange={(e) => setN(e.target.value)} /></Field><Field label="Marks (%)"><Input type="number" min={0} max={100} value={m} onChange={(e) => setM(e.target.value)} /></Field></div></Modal>
    </div>
  )
}

export function Feedback({ role, rid, nav }: { role: Role; rid: string; nav: Nav }) {
  const { toast } = useApp()
  const s = useStore()
  const room = s.rooms.find((r) => r.id === rid)
  const [tab, setTab] = useState('Private feedback'); const [stars, setStars] = useState(4); const [text, setText] = useState('')
  if (!room || role === 'tutor' || role === 'center') return <Empty title="Feedback isn’t available" text="Only the student or guardian of a room can leave feedback." action={<Button onClick={() => nav('rooms')}>Back to rooms</Button>} />
  const by = role === 'guardian' ? `Guardian of ${KIDS[room.student].split(' ')[0]}` : KIDS[room.student]
  const mine = s.reviews.filter((r) => r.room === room.id)
  return (
    <div className="mx-auto max-w-2xl space-y-5"><Crumbs items={[['Learning rooms', () => nav('rooms')], [room.title, () => nav('room', { rid })], ['Feedback']]} />
      <h1 className="text-2xl sm:text-3xl">Ratings & feedback</h1>
      <Tabs tabs={['Private feedback', 'Public review']} value={tab} onChange={setTab} />
      <Card className="space-y-4"><div className="flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={n === stars} aria-label={`${n} stars`} onClick={() => setStars(n)}><Star size={28} className={n <= stars ? 'fill-amber-cta text-amber-cta' : 'text-slate-300'} /></button>)}</div>
        {tab === 'Private feedback' ? <Alert kind="info">Only the room’s members see this. It is never turned into a public review automatically.</Alert> : <Alert kind="warning">Public reviews are checked by TuitionHub before they appear on the tutor’s profile. Don’t include phone numbers or addresses.</Alert>}
        <Textarea rows={4} placeholder="Write your feedback" aria-label="Feedback text" value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={() => { if (!text.trim()) return toast('Write a short comment first.', 'warning'); if (tab === 'Public review') update((x) => ({ ...x, reviews: [...x.reviews, { room: room.id, by, stars, text, status: 'Pending moderation' }] })); else patchRoom(room.id, (r) => ({ ...r, feedback: [...r.feedback, { by, stars, text }] })); setText(''); toast(tab === 'Public review' ? 'Review submitted for moderation.' : 'Private feedback saved.') }}>{tab === 'Public review' ? 'Submit for moderation' : 'Save privately'}</Button>
        {tab === 'Public review' && mine.map((r, i) => <p key={i} className="flex items-center gap-2 text-sm">{'★'.repeat(r.stars)} {r.text}<Pill tone={r.status === 'Published' ? 'green' : 'amber'}>{r.status}</Pill></p>)}</Card>
      <Back onClick={() => nav('room', { rid })} label="Back to room" />
    </div>
  )
}

export function Denied({ nav }: { nav: Nav }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 pt-10 text-center"><Illustration kind="lock" size={180} /><h1 className="text-2xl">You don’t have access to this room</h1>
      <p className="text-sm text-mute">Rooms are visible only to their tutor, the enrolled student and the linked guardian.</p>
      <p className="rounded-lg bg-slate-100 p-3 text-left text-xs text-mute"><b>Developer note:</b> This screen only shows the result. Room access must be enforced server-side on every request by checking room membership for the signed-in user.</p>
      <Button variant="secondary" onClick={() => nav('rooms')}>Back to my rooms</Button></div>
  )
}
export { Layers, Select }
