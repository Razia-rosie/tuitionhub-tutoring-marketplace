import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, Lock, ShieldCheck } from 'lucide-react'
import { Avatar, Button, Card, Chips, DEV_TOOLS, Field, Illustration, Input, Pill, Ring, Role, ROLE_LABEL, Select, Stepper, Textarea, useApp } from './ui'
import { completeProfile, me } from './api'

type PF = { k: string; label: string; type: 'text' | 'textarea' | 'chips' | 'select' | 'photo' | 'verified' | 'readonly'; opts?: string[]; req?: boolean; hint?: string; sample?: string | string[]; half?: boolean }
type PS = { title: string; desc?: string; fields: PF[]; preview?: boolean }

const SUBJ = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Bangla', 'ICT', 'Accounting']
const CLS = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'HSC']
const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const AREAS = ['Mirpur', 'Dhanmondi', 'Uttara', 'Mohammadpur', 'Banani', 'Agrabad']

const FLOWS: Record<Role, PS[]> = {
  tutor: [
    { title: 'Profile photo', fields: [{ k: 'photo', label: 'Profile photo', type: 'photo', req: true, hint: 'A clear, friendly head-and-shoulders photo.' }, { k: 'idv', label: 'Identity', type: 'verified' }] },
    { title: 'Education', fields: [
      { k: 'uni', label: 'University / college', type: 'text', req: true, sample: 'University of Dhaka', half: true },
      { k: 'deg', label: 'Degree / program', type: 'text', req: true, sample: 'B.Sc. in Physics', half: true },
      { k: 'status', label: 'Current study status', type: 'select', opts: ['Currently studying', 'Graduated', 'Post-graduate'], req: true, sample: 'Currently studying', half: true },
      { k: 'res', label: 'Result / grade', type: 'text', req: true, sample: 'CGPA 3.72 / 4.00', half: true },
      { k: 'sch', label: 'School & college', type: 'text', sample: 'Dhaka Residential Model College', hint: 'Optional' }] },
    { title: 'Subjects & classes', fields: [{ k: 'subj', label: 'Subjects offered', type: 'chips', opts: SUBJ, req: true, sample: ['Mathematics', 'Physics'] }, { k: 'cls', label: 'Classes taught', type: 'chips', opts: CLS, req: true, sample: ['Class 9', 'Class 10'] }] },
    { title: 'Experience', fields: [{ k: 'exp', label: 'Teaching experience', type: 'select', opts: ['Less than 1 year', '1–3 years', '3–5 years', '5+ years'], req: true, sample: '3–5 years', half: true }, { k: 'types', label: 'Preferred tuition types', type: 'chips', opts: ['One-to-one', 'Small group', 'Exam preparation', 'Home visit'], req: true, sample: ['One-to-one'] }] },
    { title: 'Location & availability', fields: [{ k: 'areas', label: 'Preferred teaching areas', type: 'chips', opts: AREAS, req: true, sample: ['Mirpur', 'Mohammadpur'] }, { k: 'days', label: 'Available days', type: 'chips', opts: DAYS, req: true, sample: ['Sat', 'Mon', 'Wed'] }, { k: 'time', label: 'Available times', type: 'select', opts: ['Morning', 'Afternoon', 'Evening', 'Flexible'], req: true, sample: 'Evening', half: true }] },
    { title: 'Fee & mode', fields: [{ k: 'fee', label: 'Expected fee (৳ per month)', type: 'select', opts: ['৳3,000–5,000', '৳5,000–8,000', '৳8,000–12,000', '৳12,000+'], req: true, sample: '৳5,000–8,000', half: true }, { k: 'mode', label: 'Teaching mode', type: 'select', opts: ['Online', 'In-person', 'Both'], req: true, sample: 'Both', half: true }] },
    { title: 'About you', fields: [{ k: 'bio', label: 'Short biography', type: 'textarea', req: true, sample: 'Physics undergraduate at DU who loves making hard concepts feel simple.' }, { k: 'appr', label: 'Teaching approach', type: 'textarea', req: true, sample: 'Concept first, then practice. Weekly progress notes for parents.' }, { k: 'cert', label: 'Certifications or other details', type: 'textarea', sample: 'Olympiad mentor, 2024' }] },
    { title: 'Preview', preview: true, fields: [] },
  ],
  center: [
    { title: 'Name & logo', fields: [{ k: 'photo', label: 'Center logo', type: 'photo', req: true }, { k: 'cn', label: 'Center name', type: 'text', req: true, sample: 'Agrabad Academic Care' }] },
    { title: 'Address & service area', fields: [{ k: 'addr', label: 'Address', type: 'text', req: true, sample: '45 CDA Avenue, Agrabad, Chattogram' }, { k: 'svc', label: 'Service areas', type: 'chips', opts: ['Agrabad', 'Halishahar', 'Nasirabad', 'GEC Circle', 'Pahartali'], req: true, sample: ['Agrabad', 'Halishahar'] }] },
    { title: 'Contact', fields: [{ k: 'ph', label: 'Phone', type: 'verified', sample: '+880 18XX-XXXXXX' }, { k: 'em', label: 'Email', type: 'verified', sample: 'office@agrabadcare.example' }, { k: 'web', label: 'Website or Facebook page', type: 'text', sample: 'facebook.com/agrabadcare' }] },
    { title: 'Classes & subjects', fields: [{ k: 'cls', label: 'Classes offered', type: 'chips', opts: CLS, req: true, sample: ['Class 8', 'Class 9', 'Class 10'] }, { k: 'subj', label: 'Subjects offered', type: 'chips', opts: SUBJ, req: true, sample: ['Mathematics', 'English'] }] },
    { title: 'Programs & facilities', fields: [{ k: 'prog', label: 'Teaching programs', type: 'chips', opts: ['Board exam batch', 'Admission test prep', 'Spoken English', 'Weekend batch'], req: true, sample: ['Board exam batch'] }, { k: 'fac', label: 'Facilities', type: 'chips', opts: ['Air-conditioned rooms', 'Library', 'Online classes', 'Parking'], sample: ['Library'] }] },
    { title: 'Schedule & fees', fields: [{ k: 'sch', label: 'Class schedule', type: 'text', req: true, sample: 'Sat–Thu, 3:00 PM – 8:00 PM', half: true }, { k: 'fee', label: 'Monthly fee range', type: 'select', opts: ['৳1,500–3,000', '৳3,000–5,000', '৳5,000+'], req: true, sample: '৳3,000–5,000', half: true }] },
    { title: 'Representative', fields: [{ k: 'rn', label: 'Authorized representative', type: 'verified', sample: 'Farhana Akter · Director' }, { k: 'rb', label: 'Short note about the representative', type: 'textarea', sample: '' }] },
    { title: 'Preview', preview: true, fields: [] },
  ],
  guardian: [
    { title: 'Basic profile', fields: [{ k: 'photo', label: 'Profile photo', type: 'photo', req: true }, { k: 'bio', label: 'About your family', type: 'textarea', sample: '' }] },
    { title: 'Contact & location', fields: [{ k: 'em', label: 'Email', type: 'verified', sample: 'shirin.akter@example.com' }, { k: 'ph', label: 'Mobile', type: 'verified', sample: '+880 17XX-XXXXXX' }, { k: 'loc', label: 'Home area', type: 'select', opts: AREAS, req: true, sample: 'Mirpur' }] },
    { title: 'Linked student', fields: [{ k: 'ls', label: 'Linked student', type: 'readonly', sample: 'Nabil Hasan · Class 9 · Dhaka Residential Model College' }, { k: 'goal', label: 'Student’s learning goal', type: 'text', req: true, sample: 'Strengthen Mathematics before SSC' }] },
    { title: 'Tuition requirements', fields: [{ k: 'subj', label: 'Subjects needed', type: 'chips', opts: SUBJ, req: true, sample: ['Mathematics', 'Physics'] }, { k: 'cls', label: 'Class', type: 'select', opts: CLS, req: true, sample: 'Class 9', half: true }] },
    { title: 'Schedule & budget', fields: [{ k: 'days', label: 'Preferred days', type: 'chips', opts: DAYS, req: true, sample: ['Sat', 'Mon'] }, { k: 'bud', label: 'Monthly budget', type: 'select', opts: ['৳3,000–5,000', '৳5,000–8,000', '৳8,000–12,000'], req: true, sample: '৳5,000–8,000', half: true }, { k: 'mode', label: 'Online or in-person', type: 'select', opts: ['Online', 'In-person', 'Either'], req: true, sample: 'In-person', half: true }] },
    { title: 'Preview', preview: true, fields: [] },
  ],
  student: [
    { title: 'Photo', fields: [{ k: 'photo', label: 'Profile photo (optional)', type: 'photo', hint: 'A photo is optional for students. Your guardian can add one.' }, { k: 'idv', label: 'Identity', type: 'verified' }] },
    { title: 'Class & school', fields: [{ k: 'cls', label: 'Class / grade', type: 'select', opts: CLS, req: true, sample: 'Class 9', half: true }, { k: 'sch', label: 'School', type: 'text', req: true, sample: 'Dhaka Residential Model College', half: true }] },
    { title: 'Interests & support', fields: [{ k: 'int', label: 'Academic interests', type: 'chips', opts: ['Science', 'Art', 'Business', 'Languages', 'ICT'], req: true, sample: ['Science'] }, { k: 'need', label: 'Subjects needing support', type: 'chips', opts: SUBJ, req: true, sample: ['Mathematics'] }] },
    { title: 'Schedule & preferences', fields: [{ k: 'days', label: 'Preferred days', type: 'chips', opts: DAYS, req: true, sample: ['Sat', 'Mon'] }, { k: 'pref', label: 'Tuition preference', type: 'select', opts: ['Online', 'Small group', 'One-to-one'], req: true, sample: 'Online', half: true }] },
    { title: 'Linked guardian', fields: [{ k: 'lg', label: 'Linked guardian', type: 'readonly', sample: 'Shirin Akter · Verified relationship' }, { k: 'oth', label: 'Other education details', type: 'textarea', sample: '' }] },
    { title: 'Preview', preview: true, fields: [] },
  ],
}

export function ProfileWizard({ forceRole }: { forceRole?: Role }) {
  const app = useApp()
  const kind = forceRole || app.role
  const steps = FLOWS[kind]
  const [i, setI] = useState(0)
  const [v, setV] = useState<Record<string, string | string[]>>({ idv: 'yes' })
  const [err, setErr] = useState<Record<string, boolean>>({})

  const required = useMemo(() => steps.flatMap((s) => s.fields.filter((f) => f.req)), [steps])
  const filled = (f: PF) => { const x = v[f.k]; return Array.isArray(x) ? x.length > 0 : !!x }
  const pct = Math.round((required.filter(filled).length / required.length) * 80 + 20 * (required.every(filled) ? 1 : 0.0) + 0)
  const real = required.every(filled) ? 100 : Math.min(95, Math.max(20, Math.round(20 + (required.filter(filled).length / required.length) * 75)))
  useEffect(() => { app.setPct(real) }, [real])
  void pct

  const step = steps[i]
  const set = (k: string, val: string | string[]) => { setV((p) => ({ ...p, [k]: val })); setErr((p) => ({ ...p, [k]: false })) }
  const stepDone = (s: PS) => s.fields.filter((f) => f.req).every(filled) && !s.preview
  const next = () => {
    const miss = step.fields.filter((f) => f.req && !filled(f))
    if (miss.length) { setErr(Object.fromEntries(miss.map((f) => [f.k, true]))); return app.toast('Complete the required fields marked * to continue.', 'error') }
    setI(i + 1)
  }
  const fillAll = () => {
    const nv = { ...v }; steps.forEach((s) => s.fields.forEach((f) => { if (f.sample !== undefined && f.req) nv[f.k] = f.sample })); nv.photo = 'yes'; setV(nv)
  }
  const [activating, setActivating] = useState(false)
  const finish = async () => {
    if (!required.every(filled)) { return app.toast('Some required fields are still empty. Check steps marked with a dot.', 'error') }
    if (app.user) {
      // Activation is decided server-side (the account must already be approved).
      setActivating(true)
      try {
        await completeProfile()
        const fresh = await me()
        if (fresh) app.updateUser(fresh)
      } catch (error) {
        return app.toast(error instanceof Error ? error.message : 'Unable to activate your account. Please try again.', 'error')
      } finally {
        setActivating(false)
      }
    }
    app.setPct(100); app.setStatus('active'); app.go('active')
  }
  const name = app.user?.display_name || (kind === 'center' ? 'Agrabad Academic Care' : kind === 'guardian' ? 'Shirin Akter' : kind === 'student' ? 'Nabil Hasan' : 'Rahim Uddin')

  const render = (f: PF) => {
    const val = v[f.k]
    if (f.type === 'verified') return <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800"><CheckCircle2 size={18} />{f.sample ? `${f.sample} · ` : ''}Identity verified<span className="ml-auto text-xs font-medium text-green-700">No documents needed again</span></div>
    if (f.type === 'readonly') return <div className="flex items-center gap-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-navy"><Lock size={14} className="text-mute" />{f.sample}</div>
    if (f.type === 'photo') return (
      <div className="flex items-center gap-4"><span className={`grid h-20 w-20 place-items-center rounded-full ${val ? '' : 'border-2 border-dashed border-slate-300 bg-slate-50'}`}>{val ? <Avatar name={name} size={80} /> : <Camera className="text-slate-400" />}</span>
        <div><Button size="sm" variant="secondary" onClick={() => set(f.k, val ? '' : 'yes')}>{val ? 'Remove photo' : 'Upload photo'}</Button><p className="mt-1.5 text-xs text-mute">JPG or PNG. Not an identity document.</p></div></div>
    )
    if (f.type === 'chips') return <Chips options={f.opts!} value={(val as string[]) || []} onChange={(x) => set(f.k, x)} />
    if (f.type === 'select') return <Select options={f.opts!} value={(val as string) || ''} onChange={(e) => set(f.k, e.target.value)} />
    if (f.type === 'textarea') return <Textarea rows={3} value={(val as string) || ''} onChange={(e) => set(f.k, e.target.value)} />
    return <Input value={(val as string) || ''} onChange={(e) => set(f.k, e.target.value)} error={err[f.k]} />
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="font-extrabold text-navy">Profile setup · <span className="font-semibold text-mute">{ROLE_LABEL[kind]}</span></span>
        <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-bold text-navy">{real}% complete</p><p className="text-xs text-mute">100% needed to activate</p></div><Ring pct={real} size={46} label={false} /></div></div></header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block"><Card pad={false} className="p-2">
          {steps.map((s, n) => (
            <button key={s.title} onClick={() => setI(n)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${n === i ? 'bg-teal-50 text-teal-700' : 'text-ink hover:bg-slate-50'}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${stepDone(s) ? 'bg-teal-600 text-white' : n === i ? 'bg-navy text-white' : 'bg-slate-200'}`}>{stepDone(s) ? <Check size={13} /> : n + 1}</span>{s.title}
            </button>))}
        </Card></aside>
        <div className="space-y-5">
          <div className="lg:hidden"><Stepper steps={steps.map((s) => s.title)} current={i} /></div>
          <Card className="space-y-5">
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl">{step.title}</h2><p className="text-sm text-mute">{step.preview ? 'This is how your profile will look once active.' : 'Fields marked * are required. Optional fields never block activation.'}</p></div>
              {DEV_TOOLS && <button onClick={fillAll} className="shrink-0 text-xs font-semibold text-teal-700 underline">Fill required (demo)</button>}</div>
            {step.preview ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-2xl bg-teal-50 p-5"><Avatar name={name} size={64} /><div><p className="text-xl font-bold text-navy">{name}</p><div className="mt-1 flex gap-2"><Pill tone="green"><ShieldCheck size={12} />Verified by TuitionHub</Pill><Pill tone="teal">{ROLE_LABEL[kind]}</Pill></div></div></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {steps.flatMap((s) => s.fields).filter((f) => ['text', 'select', 'chips', 'textarea'].includes(f.type)).map((f) => (
                    <div key={f.k} className="rounded-xl border border-line p-3"><p className="text-xs text-mute">{f.label.replace('(optional)', '')} {!f.req && <span className="rounded bg-slate-100 px-1 text-[10px]">Optional</span>}</p><p className={`text-sm font-semibold ${filled(f) ? 'text-navy' : 'text-red-700'}`}>{filled(f) ? [v[f.k]].flat().join(', ') : f.req ? 'Missing — required' : '—'}</p></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {step.fields.map((f) => (
                  <div key={f.k} className={f.half ? '' : 'sm:col-span-2'}>
                    {f.type === 'verified' || f.type === 'readonly' ? <div><p className="mb-1.5 text-sm font-medium text-navy">{f.label}</p>{render(f)}</div> : (
                      <Field label={f.label} required={f.req} optional={!f.req && f.type !== 'photo'} hint={f.hint !== 'Optional' ? f.hint : undefined} error={err[f.k] ? 'This field is required.' : undefined}>
                        <div>{render(f)}</div></Field>)}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft size={16} />Back</Button>
              {step.preview ? <Button size="lg" variant="amber" loading={activating} onClick={finish}>Confirm and activate account</Button> : <Button onClick={next}>Save and continue<ArrowRight size={16} /></Button>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function ActiveScreen() {
  const { go } = useApp()
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-green-50 to-canvas p-6">
      <div className="fade-up max-w-md text-center"><Illustration kind="success" size={220} />
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-700 px-4 py-1.5 text-sm font-bold text-white"><CheckCircle2 size={16} />Active</span>
        <h1 className="mt-4 text-3xl">Your account is now Active</h1>
        <p className="mt-2 text-mute">You’re verified and your profile is 100% complete. Every feature is unlocked.</p>
        <Button size="lg" className="mt-6 w-full" onClick={() => go('dashboard')}>Go to my dashboard<ArrowRight size={18} /></Button></div>
    </div>
  )
}
