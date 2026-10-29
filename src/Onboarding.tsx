import { useState } from 'react'
import {
  ArrowLeft, ArrowRight, CalendarPlus, Check, CheckCircle2, Copy, Link2, Lock, MapPin, ShieldCheck, Video, Mail, Phone, Building2,
} from 'lucide-react'
import {
  Alert, Button, Card, Check2, DocUpload, Field, Illustration, Input, Modal, PasswordInput, PhoneInput, PrivacyNote, Role, ROLE_LABEL,
  Select, Status, StatusBadge, Stepper, Textarea, Timeline, useApp, Pill, Avatar,
} from './ui'
import { AuthShell } from './Public'
import { Shell } from './Shell'
import { navFor } from './Dash'

const DIVISIONS = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh']
type F = { k: string; label: string; type?: string; options?: string[]; opt?: boolean; hint?: string; sample: string; half?: boolean; ro?: boolean }
type D = { k: string; label: string; fake: string; guide?: string; req?: boolean }
type Step = { title: string; fields?: F[]; docs?: D[]; review?: boolean }

const pw: F[] = [
  { k: 'pw', label: 'Password', type: 'password', sample: 'Teach@2026', half: true },
  { k: 'pw2', label: 'Confirm password', type: 'confirm', sample: 'Teach@2026', half: true },
]
const loc = (a = 'Mirpur'): F[] => [
  { k: 'div', label: 'Division', type: 'select', options: DIVISIONS, sample: 'Dhaka', half: true },
  { k: 'dist', label: 'District', type: 'text', sample: 'Dhaka', half: true },
  { k: 'area', label: 'Area', type: 'text', sample: a, half: true },
]
const base = (extra: F[] = []): F[] => [
  { k: 'name', label: 'Full name', sample: 'Rahim Uddin' },
  { k: 'email', label: 'Email', type: 'email', sample: 'rahim.uddin@example.com', half: true },
  { k: 'phone', label: 'Mobile number', type: 'tel', sample: '1712-345678', half: true },
  ...pw, ...extra,
]

const FLOWS: Record<Role, Step[]> = {
  tutor: [
    { title: 'Basic details', fields: [...base([{ k: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'], sample: 'Male', half: true }, { k: 'dob', label: 'Date of birth', type: 'date', sample: '1999-04-12', half: true }]), ...loc(), { k: 'src', label: 'How did you hear about us?', opt: true, sample: 'A friend recommended it' }] },
    { title: 'Identity documents', docs: [
      { k: 'nidf', label: 'NID photo — front', fake: 'NID FRONT', guide: 'Photograph the original NID card, not a copy.' },
      { k: 'nidb', label: 'NID photo — back', fake: 'NID BACK' },
      { k: 'edu', label: 'Latest academic certificate or student ID', fake: 'CERTIFICATE', guide: 'Use your most recent certificate or current student ID card.' }] },
    { title: 'Review & submit', review: true },
  ],
  center: [
    { title: 'Account', fields: [{ k: 'cname', label: 'Center name', sample: 'Agrabad Academic Care' }, { k: 'rep', label: 'Authorized representative', sample: 'Farhana Akter', half: true }, { k: 'des', label: 'Designation', sample: 'Director', half: true }, ...base().slice(1)] },
    { title: 'Institution', fields: [{ k: 'addr', label: 'Full address', type: 'textarea', sample: '45 CDA Avenue, Agrabad, Chattogram' }, { k: 'dist', label: 'District', sample: 'Chattogram', half: true }, { k: 'area', label: 'Area', sample: 'Agrabad', half: true }, { k: 'svc', label: 'Service area', sample: 'Agrabad, Halishahar, Nasirabad' }, { k: 'est', label: 'Year established', type: 'number', sample: '2014', half: true }, { k: 'tn', label: 'Number of teachers', type: 'number', sample: '18', half: true }] },
    { title: 'Verification photos', docs: [
      { k: 'lic', label: 'Trade license or registration document', fake: 'TRADE LICENSE' },
      { k: 'nidf', label: 'Representative NID — front', fake: 'NID FRONT' },
      { k: 'nidb', label: 'Representative NID — back', fake: 'NID BACK' },
      { k: 'sign', label: 'Center signboard or premises', fake: 'SIGNBOARD' }] },
    { title: 'Review & submit', review: true },
  ],
  guardian: [
    { title: 'Your details', fields: [...base([{ k: 'rel', label: 'Relationship to student', type: 'select', options: ['Mother', 'Father', 'Legal guardian', 'Other relative'], sample: 'Mother', half: true }, { k: 'nid', label: 'NID number', type: 'nid', sample: '19904821', half: true, hint: 'Shown masked after entry. Never displayed publicly.' }, { k: 'addr', label: 'Address', sample: 'House 7, Road 3, Mirpur 10, Dhaka' }]), ...loc().slice(1)].filter((f) => f.k !== 'div') },
    { title: 'Identity documents', docs: [
      { k: 'nidf', label: 'Your NID photo — front', fake: 'NID FRONT' },
      { k: 'nidb', label: 'Your NID photo — back', fake: 'NID BACK' },
      { k: 'bc', label: 'Child’s birth certificate photo', fake: 'BIRTH CERT.', guide: 'Photograph the original certificate in full.' }] },
    { title: 'Review & submit', review: true },
  ],
  student: [
    { title: 'Student details', fields: [
      { k: 'g', label: 'Linked guardian (verified)', sample: 'Shirin Akter · GD-20418', ro: true },
      { k: 'name', label: 'Student full name', sample: 'Nabil Hasan' },
      { k: 'dob', label: 'Date of birth', type: 'date', sample: '2011-08-03', half: true },
      { k: 'cls', label: 'Class / grade', type: 'select', options: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'HSC 1st year', 'HSC 2nd year'], sample: 'Class 9', half: true },
      { k: 'school', label: 'School', sample: 'Dhaka Residential Model College' },
      { k: 'email', label: 'Student email or username', sample: 'nabil.hasan', half: true },
      { k: 'phone', label: 'Phone', type: 'tel', opt: true, sample: '1812-345678', half: true },
      { k: 'pw', label: 'Student password', type: 'password', sample: 'Learn@2026', half: true },
      { k: 'pw2', label: 'Confirm password', type: 'confirm', sample: 'Learn@2026', half: true }] },
    { title: 'Identity documents', docs: [{ k: 'bc', label: 'Student birth certificate photo', fake: 'BIRTH CERT.' }] },
    { title: 'Review & consent', review: true },
  ],
}

const mask = (v: string) => (v ? `•••• •••• ${v.slice(-4).padStart(4, '•')}` : '—')

export function Register({ kind, guardianMode }: { kind: Role; guardianMode?: boolean }) {
  const { go, toast } = useApp()
  const steps = FLOWS[kind]
  const [i, setI] = useState(0)
  const [v, setV] = useState<Record<string, string>>({})
  const [docs, setDocs] = useState<Record<string, boolean>>({})
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [noNid, setNoNid] = useState(false)
  const [alt, setAlt] = useState('School ID card photo')
  const [why, setWhy] = useState('')
  const step = steps[i]
  const set = (k: string, val: string) => { setV((p) => ({ ...p, [k]: val })); setErrs((p) => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e: Record<string, string> = {}
    step.fields?.forEach((f) => {
      const val = v[f.k] || ''
      if (f.opt || f.ro) return
      if (!val) e[f.k] = 'This field is required.'
      else if (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(val)) e[f.k] = 'Enter a valid email address, like name@example.com.'
      else if (f.type === 'password' && val.length < 8) e[f.k] = 'Use at least 8 characters.'
      else if (f.type === 'confirm' && val !== v.pw) e[f.k] = 'Passwords do not match.'
    })
    step.docs?.forEach((d) => { if (!docs[d.k]) e[d.k] = 'upload' })
    if (kind === 'student' && step.docs && noNid && !why) e.why = 'Please explain why the student has no NID.'
    setErrs(e)
    return Object.keys(e).length === 0
  }
  const next = () => {
    if (step.review) {
      if (!terms) return setErrs({ terms: 'Please accept the consent to continue.' })
      setLoading(true)
      return setTimeout(() => { setLoading(false); go(guardianMode ? 'student-confirm' : 'confirm') }, 1000)
    }
    if (validate()) setI(i + 1)
    else toast('Please fix the highlighted items to continue.', 'error')
  }
  const autofill = () => {
    const nv = { ...v }; step.fields?.forEach((f) => { nv[f.k] = f.sample }); setV(nv); setErrs({})
  }

  const body = (
    <div className="space-y-6">
      <Stepper steps={steps.map((s) => s.title)} current={i} />
      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-2xl">{step.title}</h2><p className="text-sm text-mute">{step.review ? 'Check everything before you submit. You can go back to edit.' : step.docs ? 'Add a clear photo of each original document.' : 'Fields marked * are required.'}</p></div>
          {step.fields && <button type="button" onClick={autofill} className="shrink-0 text-xs font-semibold text-teal-700 underline">Fill sample data</button>}
        </div>

        {step.fields && (
          <div className="grid gap-4 sm:grid-cols-2">
            {step.fields.map((f) => (
              <div key={f.k} className={f.half ? '' : 'sm:col-span-2'}>
                <Field label={f.label} required={!f.opt && !f.ro} optional={f.opt} error={errs[f.k]} hint={f.hint} success={!!v[f.k] && !errs[f.k] && !f.ro && f.type === 'email' && /^\S+@\S+\.\S+$/.test(v[f.k])}>
                  {f.ro ? <div className="flex h-11 items-center gap-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 text-[15px] text-navy"><Lock size={14} className="text-mute" />{f.sample}<Pill tone="green"><Check size={12} />Verified</Pill></div>
                    : f.type === 'select' ? <Select options={f.options!} value={v[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
                    : f.type === 'textarea' ? <Textarea rows={3} value={v[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
                    : f.type === 'tel' ? <PhoneInput value={v[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
                    : f.type === 'password' ? <PasswordInput strength value={v[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
                    : f.type === 'confirm' ? <PasswordInput value={v[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
                    : f.type === 'nid' ? <PasswordInput inputMode="numeric" value={v[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} placeholder="Digits only" />
                    : <Input type={f.type || 'text'} error={!!errs[f.k]} value={v[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />}
                </Field>
              </div>
            ))}
            {i === 0 && <div className="sm:col-span-2 text-xs text-mute">Password rules: 8+ characters with an uppercase letter, a number and a symbol.</div>}
          </div>
        )}

        {step.docs && (
          <div className="space-y-4">
            <PrivacyNote />
            {step.docs.map((d) => (
              <div key={d.k} className={errs[d.k] ? 'rounded-2xl ring-2 ring-red-300' : ''}>
                <DocUpload label={d.label} fakeKind={d.fake} guide={d.guide} required={d.req !== false} onChange={(ok) => { setDocs((p) => ({ ...p, [d.k]: ok })); setErrs((p) => ({ ...p, [d.k]: '' })) }} />
                {errs[d.k] && <p className="mt-1.5 text-[13px] text-red-700">Please add this photo to continue.</p>}
              </div>
            ))}
            {kind === 'student' && (
              <div className="space-y-4">
                <Check2 checked={noNid} onChange={setNoNid} label="Student does not have an NID (most minors don’t — this never blocks registration)" />
                {noNid && (
                  <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50/50 p-4">
                    <Alert kind="warning" title="Admin will review this alternative">No NID is needed. Choose an alternative document and tell us a little more.</Alert>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {['School ID card photo', 'Guardian-signed declaration photo'].map((o) => (
                        <label key={o} className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium ${alt === o ? 'border-teal-600 bg-white' : 'border-slate-300 bg-white'}`}><input type="radio" className="accent-teal-600" checked={alt === o} onChange={() => setAlt(o)} />{o}</label>
                      ))}
                    </div>
                    <DocUpload label={alt} fakeKind={alt.startsWith('School') ? 'SCHOOL ID' : 'DECLARATION'} onChange={(ok) => setDocs((p) => ({ ...p, alt: ok }))} />
                    <Field label="Short explanation" required error={errs.why}><Textarea rows={3} value={why} onChange={(e) => { setWhy(e.target.value); setErrs((p) => ({ ...p, why: '' })) }} placeholder="e.g. Nabil is 14 and has not yet been issued a national ID." /></Field>
                  </div>
                )}
                {!noNid && <DocUpload label="Student NID photo (where applicable)" required={false} fakeKind="NID FRONT" />}
              </div>
            )}
          </div>
        )}

        {step.review && (
          <div className="space-y-5">
            {steps.filter((s) => s.fields).map((s) => (
              <div key={s.title}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">{s.title}</p>
                <dl className="grid gap-x-6 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  {s.fields!.filter((f) => f.type !== 'password' && f.type !== 'confirm').map((f) => (
                    <div key={f.k}><dt className="text-xs text-mute">{f.label}</dt><dd className="font-semibold text-navy">{f.type === 'nid' ? mask(v[f.k]) : f.ro ? f.sample : v[f.k] || '—'}</dd></div>
                  ))}
                  <div><dt className="text-xs text-mute">Password</dt><dd className="font-semibold text-navy">••••••••</dd></div>
                </dl>
              </div>
            ))}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">Document photos</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {steps.find((s) => s.docs)!.docs!.map((d) => (
                  <div key={d.k} className="overflow-hidden rounded-xl border border-line"><div className="grid aspect-[4/3] place-items-center bg-slate-100 text-[10px] font-bold tracking-widest text-slate-400">SAMPLE · {d.fake}</div><p className="flex items-center gap-1 p-2 text-xs font-medium text-navy"><CheckCircle2 size={13} className="text-green-600" /><span className="truncate">{d.label}</span></p></div>
                ))}
              </div>
            </div>
            <PrivacyNote compact />
            <div>
              <Check2 checked={terms} onChange={(b) => { setTerms(b); setErrs({}) }}>{guardianMode ? ' I am the verified guardian and I consent to creating this student account linked to me.' : ' I consent to TuitionHub processing my details and documents for manual verification, and I accept the Terms and Privacy Policy.'}</Check2>
              {errs.terms && <p className="mt-1.5 text-[13px] text-red-700">{errs.terms}</p>}
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => (i === 0 ? go(guardianMode ? 'dashboard' : 'signup') : setI(i - 1))}><ArrowLeft size={16} />Back</Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            {!step.review && <Button variant="secondary" onClick={() => toast('Draft saved. You can continue later.', 'success')}>Save draft</Button>}
            <Button loading={loading} onClick={next}>{step.review ? 'Submit application' : 'Save and continue'}{!step.review && <ArrowRight size={16} />}</Button>
          </div>
        </div>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white"><div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4"><button onClick={() => go(guardianMode ? 'dashboard' : 'landing')} aria-label="Home"><span className="text-sm font-bold text-teal-700">TuitionHub</span></button>
        <span className="text-sm font-semibold text-navy">{guardianMode ? 'Add a student' : `${ROLE_LABEL[kind]} registration`}</span></div></header>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">{body}</div>
    </div>
  )
}

export function Confirm({ student }: { student?: boolean }) {
  const { go, role, setStatus } = useApp()
  const ref = student ? 'TH-STU-2026-00417' : `TH-${role.slice(0, 3).toUpperCase()}-2026-0${role === 'tutor' ? '2931' : '3184'}`
  return (
    <AuthShell title="Application submitted" sub={student ? 'Nabil’s application is with our admin team.' : 'Thank you. Our admin team will review your application.'}>
      <div className="flex flex-col items-start gap-6">
        <Illustration kind="success" size={150} />
        <div className="flex w-full items-center justify-between rounded-xl border border-dashed border-teal-300 bg-teal-50 p-4">
          <div><p className="text-xs text-mute">Application reference</p><p className="font-mono text-lg font-bold text-navy">{ref}</p></div>
          <Copy size={18} className="text-teal-700" />
        </div>
        <Card className="w-full">
          <h3 className="mb-3 text-base">What happens next</h3>
          <Timeline items={[{ title: 'Admin reviews your photos and details', sub: 'Usually within 2–3 working days', state: 'current' }, { title: 'You may be invited to a short interview', sub: student ? 'Online only for students' : 'Online or in-person', state: 'todo' }, { title: 'Decision', sub: 'We’ll notify you by email and in your account', state: 'todo' }, { title: 'Complete your profile to unlock full access', state: 'todo' }]} />
        </Card>
        <Button className="w-full" onClick={() => { if (student) return go('dashboard'); setStatus('pending'); go('pending') }}>{student ? 'Back to guardian dashboard' : 'Go to my account'}</Button>
      </div>
    </AuthShell>
  )
}

/* ---------------- PENDING & variants ---------------- */
const ORDER: Status[] = ['pending', 'documents', 'correction', 'invited', 'scheduled', 'completed', 'approved', 'rejected']

export function Pending() {
  const { role, status, setStatus, go, toast, setPct } = useApp()
  const [slot, setSlot] = useState('')
  const [resched, setResched] = useState(false)
  const [loading, setLoading] = useState(false)
  const isStudent = role === 'student'
  const name = role === 'center' ? 'Agrabad Academic Care' : role === 'guardian' ? 'Shirin Akter' : role === 'student' ? 'Nabil Hasan' : 'Rahim Uddin'
  const org = role === 'center'
  const inPerson = role === 'center'
  const stepIdx = { pending: 1, documents: 0, correction: 1, invited: 2, scheduled: 2, completed: 3, approved: 4, rejected: 3 } as Record<string, number>
  const sim = () => {
    const nxt: Record<string, Status> = { pending: 'invited', invited: 'scheduled', scheduled: 'completed', completed: 'approved', correction: 'pending', documents: 'pending' }
    if (nxt[status]) { setStatus(nxt[status]); toast(`Prototype: admin moved status to “${nxt[status]}”.`, 'info') }
  }
  const items = [
    { title: 'Submitted', sub: '24 Oct 2026', state: 'done' as const },
    { title: org ? 'Organization under review' : 'Under review', sub: 'Admin is checking your photos by hand', state: stepIdx[status] > 1 ? 'done' as const : stepIdx[status] === 1 ? 'current' as const : 'todo' as const },
    { title: 'Interview (if required)', sub: isStudent ? 'Online only' : 'Online or in person', state: stepIdx[status] > 2 ? 'done' as const : stepIdx[status] === 2 ? 'current' as const : 'todo' as const },
    { title: 'Decision', state: stepIdx[status] > 3 || status === 'approved' ? 'done' as const : stepIdx[status] === 3 ? 'current' as const : 'todo' as const },
    { title: 'Profile setup', sub: 'Unlocks after approval', state: status === 'approved' ? 'current' as const : 'todo' as const },
  ]
  const readOnly = [['Name', name], ['Email', 'user@example.com'], ['Phone', '+880 17XX-XXXXXX'], ['Location', role === 'center' ? 'Chattogram, Agrabad' : 'Dhaka, Mirpur'], ['ID number', '•••• •••• 4821']]

  const interviewCard = (
    <Card className="border-blue-200">
      <div className="flex items-center justify-between"><h3 className="text-lg">Interview details</h3><StatusBadge status="scheduled" /></div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-mute">Type</dt><dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-navy">{inPerson ? <><MapPin size={15} />In-person</> : <><Video size={15} />Online</>}</dd></div>
        <div><dt className="text-mute">Date &amp; time</dt><dd className="mt-0.5 font-semibold text-navy">Sun, 2 Nov 2026 · 11:00 AM (BST)</dd></div>
        <div className="sm:col-span-2"><dt className="text-mute">{inPerson ? 'Address' : 'Meeting link'}</dt><dd className="mt-0.5 font-semibold text-navy">{inPerson ? 'TuitionHub Office, Room 3B, Mirpur DOHS, Dhaka' : 'Meeting link will appear here: https://meet.example/th-2931'}</dd></div>
        <div className="sm:col-span-2"><dt className="text-mute">Instructions</dt><dd className="mt-0.5 text-ink">{inPerson ? 'Bring original documents and arrive 10 minutes early.' : 'Join 5 minutes early with your original documents ready. A guardian should be present.'}</dd></div>
      </dl>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row"><Button variant="secondary" size="sm" onClick={() => toast('Added to your calendar.', 'success')}><CalendarPlus size={15} />Add to calendar</Button><Button variant="ghost" size="sm" onClick={() => setResched(true)}>Request reschedule</Button></div>
    </Card>
  )

  let main: React.ReactNode
  if (status === 'documents')
    main = <Card className="space-y-4"><Alert kind="warning" title="Documents required">Your submission is missing one document. Please add it so we can start the review.</Alert><DocUpload label={org ? 'Trade license or registration document' : 'Supporting identity document'} fakeKind="DOCUMENT" onChange={(ok) => ok && toast('Document added. You can now resubmit.', 'success')} /><Button onClick={() => { setStatus('pending'); toast('Resubmitted for review.', 'success') }}>Submit documents</Button></Card>
  else if (status === 'correction')
    main = (
      <Card className="space-y-4">
        <Alert kind="warning" title="Admin notes">“The NID photo is slightly blurred at the bottom-left corner and the date of birth is hard to read. Please retake it in better light and confirm your area.” — TuitionHub Admin, 27 Oct</Alert>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="NID photo — front" error="Flagged: needs a clearer photo"><div className="flex h-11 items-center rounded-[10px] border border-red-500 bg-red-50 px-3 text-sm text-red-800">Flagged by admin</div></Field>
          <Field label="Area" error="Flagged: please confirm"><Input error defaultValue="Mirpur" /></Field>
        </div>
        <DocUpload label="NID photo — front (replacement)" fakeKind="NID FRONT" />
        <Button onClick={() => { setStatus('pending'); toast('Updated and resubmitted for review.', 'success') }}>Update and resubmit</Button>
      </Card>
    )
  else if (status === 'invited')
    main = (
      <Card className="space-y-4">
        <h3 className="text-lg">You’re invited to an interview</h3>
        <p className="text-sm text-mute">{isStudent ? 'Student interviews are held online. Choose a time that suits you and your guardian.' : 'Choose one of the times offered by our admin team.'}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {['Sun, 2 Nov · 11:00 AM', 'Mon, 3 Nov · 4:30 PM', 'Tue, 4 Nov · 10:00 AM'].map((s) => (
            <button key={s} onClick={() => setSlot(s)} aria-pressed={slot === s} className={`rounded-xl border-2 p-3 text-left text-sm font-semibold ${slot === s ? 'border-teal-600 bg-teal-50' : 'border-line hover:border-slate-300'}`}>{s}<span className="mt-1 flex items-center gap-1 text-xs font-medium text-mute"><Video size={13} />Online</span></button>
          ))}
        </div>
        {!isStudent && <p className="flex items-center gap-1.5 text-xs text-mute"><MapPin size={13} />In-person is also possible if you prefer. Request it in the notes.</p>}
        <Button disabled={!slot} loading={loading} onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); setStatus('scheduled'); toast('Interview confirmed.', 'success') }, 700) }}>Confirm this time</Button>
      </Card>
    )
  else if (status === 'scheduled') main = interviewCard
  else if (status === 'completed')
    main = <Card className="flex flex-col items-center gap-3 py-10 text-center"><Illustration kind="wait" size={140} /><h3 className="text-xl">Interview completed</h3><p className="max-w-md text-sm text-mute">Thank you. Our admin team is making a decision and will notify you soon. Your access stays restricted until then.</p></Card>
  else if (status === 'rejected')
    main = (
      <Card className="space-y-4 border-red-200">
        <Alert kind="error" title="Your application was not approved">Reason: “The identity documents submitted did not match the details provided, and the follow-up could not confirm them.”</Alert>
        <p className="text-sm text-ink">If you believe this is a mistake, contact support at <b>support@tuitionhub.example</b> or <b>+880 17XX-XXXXXX</b>. You may reapply after 30 days with new, clear documents.</p>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => toast('Support request opened.', 'info')}>Contact support</Button><Button disabled>Reapply (available 26 Nov 2026)</Button></div>
      </Card>
    )
  else if (status === 'approved')
    main = (
      <Card className="flex flex-col items-center gap-3 py-10 text-center"><Illustration kind="success" size={170} />
        <h3 className="text-2xl">Congratulations — you’re approved!</h3><p className="max-w-md text-sm text-mute">Complete your profile to unlock your dashboard. Operational features open once every required field is done.</p>
        <Button size="lg" onClick={() => { setPct(20); go('profile-wizard') }}>Complete your profile <ArrowRight size={18} /></Button></Card>
    )
  else
    main = (
      <Card className="flex flex-col items-center gap-3 py-8 text-center sm:flex-row sm:text-left"><Illustration kind="wait" size={130} />
        <div><StatusBadge status="pending" big /><h3 className="mt-3 text-xl">We’re reviewing your application</h3><p className="mt-1 max-w-lg text-sm text-mute">An administrator is checking your photos by hand. We never verify authenticity automatically. You’ll be notified of every update.</p></div></Card>
    )

  return (
    <Shell nav={navFor(role, true)} active="home" onNav={() => {}} name={name} roleLabel={`${ROLE_LABEL[role]} · limited access`}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl sm:text-3xl">{isStudent ? 'Your application status' : 'Account verification'}</h1><p className="text-sm text-mute">{isStudent ? 'Your account is limited. Your guardian can also view this status.' : 'Operational features are locked until approval.'}</p></div>
          <StatusBadge status={status} big />
        </div>
        {status !== 'approved' && status !== 'rejected' && <Alert kind="info" title="Features locked"><span className="flex items-center gap-1.5"><Lock size={14} />Tuition search, applications, messaging and other features unlock after admin approval and 100% profile completion.</span></Alert>}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">{main}
            {!isStudent && <Card><h3 className="mb-3 text-lg">Submitted information</h3><dl className="grid gap-3 text-sm sm:grid-cols-2">{readOnly.map(([a, b]) => <div key={a}><dt className="text-xs text-mute">{a}</dt><dd className="font-semibold text-navy">{b}</dd></div>)}</dl><div className="mt-4"><PrivacyNote compact /></div></Card>}
          </div>
          <Card><h3 className="mb-4 text-lg">Verification progress</h3><Timeline items={items} /></Card>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-xs text-mute">
          <b className="text-ink">Prototype controls</b> — simulate admin actions or jump to a variant:
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={sim}>Simulate next admin action</Button>
            {ORDER.map((s) => <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-2.5 py-1 font-semibold ${status === s ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-300'}`}>{s}</button>)}
          </div>
        </div>
      </div>
      <Modal open={resched} onClose={() => setResched(false)} title="Request a reschedule" footer={<><Button variant="ghost" onClick={() => setResched(false)}>Cancel</Button><Button onClick={() => { setResched(false); toast('Reschedule request sent to admin.', 'success') }}>Send request</Button></>}>
        <Field label="Reason and preferred times" required><Textarea placeholder="e.g. I have an exam on Sunday. Monday afternoon works better." /></Field>
      </Modal>
    </Shell>
  )
}

export function Linked() {
  const { go } = useApp()
  return (
    <AuthShell title="Parent and student linked" sub="Nabil’s account is approved and connected to Shirin’s." wide>
      <div className="flex flex-col items-center gap-6 text-center">
        <Illustration kind="success" size={140} />
        <div className="flex w-full items-center justify-center gap-3 sm:gap-6">
          <Card className="flex-1 text-center"><Avatar name="Shirin Akter" size={52} /><p className="mt-2 font-bold text-navy">Shirin Akter</p><p className="text-xs text-mute">Guardian · GD-20418</p></Card>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-100 text-green-700"><Link2 size={20} /></span>
          <Card className="flex-1 text-center"><Avatar name="Nabil Hasan" size={52} tone="indigo" /><p className="mt-2 font-bold text-navy">Nabil Hasan</p><p className="text-xs text-mute">Student · Class 9</p></Card>
        </div>
        <Pill tone="green"><ShieldCheck size={13} />Verified relationship</Pill>
        <p className="max-w-md text-sm text-mute">The link was created by an approved guardian and confirmed by our admin team. Nobody can link themselves to another account.</p>
        <div className="flex w-full flex-col gap-2 sm:flex-row"><Button className="flex-1" onClick={() => go('dashboard')}>Open guardian dashboard</Button><Button variant="secondary" className="flex-1" onClick={() => go('profile-wizard-student')}>Student: complete profile</Button></div>
      </div>
    </AuthShell>
  )
}

export { Mail, Phone, Building2 }
