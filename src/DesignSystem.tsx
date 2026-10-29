import { useState } from 'react'
import {
  Alert, Avatar, Bar, Button, Card, Check2, DocUpload, Empty, Field, Illustration, Input, Logo, LockOverlay, Modal, PasswordInput, PhoneInput,
  Pill, Ring, Select, Skeleton, Stat, STATUS_KEYS, StatusBadge, Stepper, Tabs, Textarea, Timeline, Toggle, useApp,
} from './ui'
import { Inbox } from 'lucide-react'

const COLORS = [['Teal 600 · Primary', '#0f6f60'], ['Teal 800', '#084539'], ['Teal 50', '#eaf6f3'], ['Navy · Headings', '#0f2742'], ['Amber · Accent', '#f2a93b'], ['Canvas', '#f6f7f4'], ['Success', '#15803d'], ['Warning', '#b45309'], ['Info', '#1d4ed8'], ['Error', '#dc2626'], ['Indigo', '#3b3fa8'], ['Grey', '#64748b']]

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-4"><h2 className="border-b border-line pb-2 text-2xl">{title}</h2>{children}</section>
}

export function DesignSystem() {
  const { go, toast } = useApp()
  const [tab, setTab] = useState('Overview'); const [m, setM] = useState(false); const [on, setOn] = useState(true); const [c, setC] = useState(true); const [pw, setPw] = useState('Abc')
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4"><Logo /><div className="flex items-center gap-3"><span className="hidden text-sm text-mute sm:block">00 Design System</span><Button size="sm" onClick={() => go('landing')}>Open prototype</Button></div></div></header>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <div><h1 className="text-4xl">TuitionHub design system</h1><p className="mt-2 max-w-2xl text-mute">One shared set of tokens and components behind every role journey. Layouts follow a 12-column grid on desktop (1440), 8 on tablet (768) and 4 on mobile (390).</p></div>

        <S title="Colors"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{COLORS.map(([n, h]) => <div key={n} className="overflow-hidden rounded-xl border border-line bg-white"><div className="h-16" style={{ background: h }} /><div className="p-2.5"><p className="text-xs font-bold text-navy">{n}</p><p className="font-mono text-xs text-mute">{h}</p></div></div>)}</div></S>

        <S title="Typography · Plus Jakarta Sans"><Card className="space-y-3">
          {[['Display 48/56', 'text-5xl font-extrabold'], ['H1 36', 'text-4xl font-bold'], ['H2 28', 'text-[28px] font-bold'], ['H3 22', 'text-[22px] font-bold'], ['H4 18', 'text-lg font-bold']].map(([l, c]) => <div key={l} className="flex flex-wrap items-baseline gap-4"><span className="w-28 text-xs text-mute">{l}</span><span className={`${c} text-navy`}>Verified tutors</span></div>)}
          <div className="flex items-baseline gap-4"><span className="w-28 text-xs text-mute">Body 16 / 400</span><span>Every account is manually reviewed by our admin team.</span></div>
          <div className="flex items-baseline gap-4"><span className="w-28 text-xs text-mute">Label 14 / 500</span><span className="text-sm font-medium">Full name</span></div>
          <div className="flex items-baseline gap-4"><span className="w-28 text-xs text-mute">Caption 12</span><span className="text-xs text-mute">Private — visible only to admins</span></div></Card></S>

        <S title="Spacing & radius"><Card className="flex flex-wrap items-end gap-4">{[4, 8, 12, 16, 24, 32, 48, 64, 96].map((n) => <div key={n} className="text-center"><div className="bg-teal-600/80" style={{ width: Math.min(n, 96), height: 24 }} /><p className="mt-1 text-xs text-mute">{n}</p></div>)}<div className="ml-auto flex gap-3"><div className="grid h-16 w-24 place-items-center rounded-[10px] border border-line bg-white text-xs">10 · input</div><div className="grid h-16 w-24 place-items-center rounded-2xl border border-line bg-white text-xs shadow-soft">16 · card</div></div></Card></S>

        <S title="Buttons"><Card className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {(['primary', 'secondary', 'ghost', 'destructive', 'amber'] as const).map((v) => <div key={v} className="space-y-2"><p className="text-xs font-bold uppercase text-mute">{v}</p><Button variant={v} className="w-full">Default</Button><Button variant={v} loading className="w-full">Loading</Button><Button variant={v} disabled className="w-full">Disabled</Button></div>)}</Card></S>

        <S title="Status badges"><Card className="flex flex-wrap gap-3">{STATUS_KEYS.map((s) => <StatusBadge key={s} status={s} />)}</Card></S>

        <S title="Form controls — default, focus, filled, error, success, disabled"><Card className="grid gap-5 md:grid-cols-2">
          <Field label="Default" hint="Helper text"><Input placeholder="Full name" /></Field><Field label="Filled" success><Input defaultValue="Rahim Uddin" /></Field>
          <Field label="Error" error="Enter a valid email address."><Input error defaultValue="rahim@" /></Field><Field label="Disabled"><Input disabled defaultValue="Locked value" /></Field>
          <Field label="Phone" required><PhoneInput /></Field><Field label="Select"><Select options={['Dhaka', 'Chattogram']} /></Field>
          <Field label="Password with strength"><PasswordInput strength value={pw} onChange={(e) => setPw(e.target.value)} /></Field><Field label="Textarea" optional><Textarea rows={3} /></Field>
          <div className="flex items-center gap-6"><Check2 checked={c} onChange={setC} label="Checkbox" /><div className="flex items-center gap-2 text-sm"><Toggle on={on} onChange={setOn} label="Toggle" />Toggle</div><label className="flex items-center gap-2 text-sm"><input type="radio" defaultChecked className="accent-teal-600" />Radio</label></div></Card></S>

        <S title="Navigation & progress"><Card className="space-y-6"><Stepper steps={['Basic details', 'Documents', 'Review']} current={1} /><Tabs tabs={['Overview', 'Documents', 'Timeline']} value={tab} onChange={setTab} />
          <div className="flex flex-wrap items-center gap-8"><Ring pct={60} /><div className="w-48"><Bar pct={60} /><p className="mt-1 text-xs text-mute">Profile completion</p></div><div><Timeline items={[{ title: 'Submitted', state: 'done' }, { title: 'Under review', state: 'current' }, { title: 'Decision', state: 'todo' }]} /></div></div></Card></S>

        <S title="Cards, alerts, avatars"><div className="grid gap-4 md:grid-cols-3"><Stat icon={Inbox} label="Pending applications" value={12} tone="amber" /><Card className="flex items-center gap-3"><Avatar name="Rahim Uddin" size={48} /><div><p className="font-bold text-navy">Rahim Uddin</p><Pill tone="green">Verified</Pill></div></Card><Card className="relative min-h-24"><p className="font-bold text-navy">Locked card</p><LockOverlay title="Locked" /></Card></div>
          <div className="grid gap-3 md:grid-cols-2"><Alert kind="success" title="Success">Profile saved.</Alert><Alert kind="error" title="Error">Something went wrong.</Alert><Alert kind="warning" title="Warning">Documents required.</Alert><Alert kind="info" title="Info">Interview scheduled.</Alert></div>
          <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => toast('Saved successfully.', 'success')}>Toast: success</Button><Button size="sm" variant="secondary" onClick={() => toast('That did not work.', 'error')}>Toast: error</Button><Button size="sm" variant="secondary" onClick={() => setM(true)}>Open modal</Button></div></S>

        <S title="Empty state & skeleton"><div className="grid gap-4 md:grid-cols-2"><Card><Empty title="No applications yet" text="When you apply, they’ll show up here." /></Card><Card className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-24" /></Card></div></S>

        <S title="Illustrations"><div className="flex flex-wrap gap-4">{(['hero', 'shield', 'success', 'wait', 'lock', 'empty'] as const).map((k) => <Illustration key={k} kind={k} size={130} />)}</div></S>

        <S title="Document upload — states"><div className="grid gap-4 lg:grid-cols-2">
          <div><p className="mb-2 text-xs font-bold uppercase text-mute">Empty (interactive)</p><DocUpload label="NID photo — front" /></div>
          <div><p className="mb-2 text-xs font-bold uppercase text-mute">Camera capture</p><DocUpload label="NID photo — back" initial="camera" fakeKind="NID BACK" /></div>
          <div><p className="mb-2 text-xs font-bold uppercase text-mute">Preview</p><DocUpload label="Academic certificate" initial="preview" fakeKind="CERTIFICATE" /></div>
          <div><p className="mb-2 text-xs font-bold uppercase text-mute">Uploaded</p><DocUpload label="Birth certificate" initial="uploaded" fakeKind="BIRTH CERT." /></div>
          <div className="lg:col-span-2"><p className="mb-2 text-xs font-bold uppercase text-mute">Error (PDF rejected)</p><DocUpload label="Trade license" initial="empty" /></div></div></S>

        <p className="text-center text-xs text-mute">Annotation: real authorization is enforced by the backend. These designs represent the intended permission rules only.</p>
      </div>
      <Modal open={m} onClose={() => setM(false)} title="Confirmation dialog" footer={<><Button variant="ghost" onClick={() => setM(false)}>Cancel</Button><Button onClick={() => setM(false)}>Confirm</Button></>}><p className="text-sm text-mute">Dialogs confirm consequential actions with a clear summary.</p></Modal>
    </div>
  )
}
