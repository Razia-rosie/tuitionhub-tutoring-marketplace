import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, Camera, Check, CheckCircle2, Clock, Eye, EyeOff, FileText, GraduationCap, Info, Lock,
  RefreshCw, ShieldCheck, Trash2, Upload as UploadIcon, UserCheck, Video, X, XCircle, CalendarClock,
  ClipboardEdit, BadgeCheck, Circle, FileWarning, Loader2,
} from 'lucide-react'
import type { AuthUser } from './api'

/* ---------- types & store ---------- */
export type Role = 'tutor' | 'center' | 'guardian' | 'student'
export type Status =
  | 'draft' | 'documents' | 'pending' | 'correction' | 'invited' | 'scheduled'
  | 'completed' | 'approved' | 'rejected' | 'incomplete' | 'active'

/** Prototype-only tools (screen navigator, sample-data fill, simulated admin actions) render only in `vite dev`. */
export const DEV_TOOLS = import.meta.env.DEV

export const ROLE_LABEL: Record<Role, string> = {
  tutor: 'Private Tutor', center: 'Coaching Center', guardian: 'Guardian / Parent', student: 'Student',
}

type Toast = { id: number; kind: 'success' | 'error' | 'warning' | 'info'; text: string }
export type Ctx = {
  route: string
  go: (r: string) => void
  logout: () => Promise<void>
  signIn: (user: AuthUser) => void
  /** The real Supabase user, or null while browsing the prototype without a session. */
  user: AuthUser | null
  /** Replace the cached profile after a save, without changing the route. */
  updateUser: (user: AuthUser) => void
  role: Role
  setRole: (r: Role) => void
  status: Status
  setStatus: (s: Status) => void
  pct: number
  setPct: (n: number) => void
  toast: (text: string, kind?: Toast['kind']) => void
}
export const AppCtx = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(AppCtx)

export function ToastHost({ toasts, close }: { toasts: Toast[]; close: (id: number) => void }) {
  const styles = {
    success: 'bg-green-50 border-green-300 text-green-900',
    error: 'bg-red-50 border-red-300 text-red-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    info: 'bg-blue-50 border-blue-300 text-blue-900',
  }
  const icons = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }
  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:w-96" aria-live="polite">
      {toasts.map((t) => {
        const I = icons[t.kind]
        return (
          <div key={t.id} role="status" className={`fade-up flex items-start gap-3 rounded-xl border p-3.5 text-sm shadow-soft ${styles[t.kind]}`}>
            <I size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 font-medium">{t.text}</p>
            <button aria-label="Dismiss" onClick={() => close(t.id)}><X size={16} /></button>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- logo ---------- */
export function Logo({ light = false, size = 28 }: { light?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <path d="M16 2 4 6.5v8.2C4 22.3 9 27.7 16 30c7-2.3 12-7.7 12-15.3V6.5L16 2Z" fill={light ? '#fff' : '#0f6f60'} />
        <path d="M16 9 8 12.5l8 3.5 8-3.5L16 9Zm-5 6.8v3.2c0 1.2 2.2 2.4 5 2.4s5-1.2 5-2.4v-3.2l-5 2.2-5-2.2Z" fill={light ? '#0f6f60' : '#fff'} />
        <circle cx="25" cy="25" r="5" fill="#f2a93b" />
        <path d="M25 22.6v4.8M22.6 25h4.8" stroke="#0f2742" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className={`text-[19px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>
        Tuition<span className={light ? 'text-amber-cta' : 'text-teal-600'}>Hub</span>
      </span>
    </span>
  )
}

/* ---------- buttons ---------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'amber'
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}
export function Button({ variant = 'primary', loading, size = 'md', className = '', children, disabled, ...p }: BtnProps) {
  const v = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm',
    amber: 'bg-amber-cta text-navy hover:brightness-95 active:brightness-90 shadow-sm',
    secondary: 'bg-white text-teal-700 border border-teal-600/40 hover:bg-teal-50 active:bg-teal-100',
    ghost: 'text-ink hover:bg-black/5 active:bg-black/10',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  }[variant]
  const s = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-5 text-[15px]', lg: 'h-12 px-6 text-base' }[size]
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition disabled:bg-slate-200 disabled:text-slate-500 disabled:border-transparent disabled:shadow-none ${v} ${s} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

/* ---------- status badge ---------- */
const BADGES: Record<Status, { label: string; cls: string; icon: React.ElementType }> = {
  draft: { label: 'Registration Incomplete', cls: 'bg-slate-100 text-slate-700 border-slate-200', icon: Circle },
  documents: { label: 'Documents Required', cls: 'bg-amber-100 text-amber-900 border-amber-200', icon: FileWarning },
  pending: { label: 'Pending Admin Review', cls: 'bg-amber-100 text-amber-900 border-amber-200', icon: Clock },
  correction: { label: 'Correction Requested', cls: 'bg-orange-bg text-orange-ink border-orange-200', icon: ClipboardEdit },
  invited: { label: 'Interview Invited', cls: 'bg-blue-100 text-blue-800 border-blue-200', icon: Video },
  scheduled: { label: 'Interview Scheduled', cls: 'bg-blue-100 text-blue-800 border-blue-200', icon: CalendarClock },
  completed: { label: 'Interview Completed', cls: 'bg-indigo-bg text-indigo-ink border-indigo-200', icon: UserCheck },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-800 border-green-200', icon: BadgeCheck },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  incomplete: { label: 'Profile Incomplete', cls: 'bg-white text-amber-900 border-amber-500 border-dashed', icon: AlertTriangle },
  active: { label: 'Active', cls: 'bg-green-700 text-white border-green-700', icon: CheckCircle2 },
}
export function StatusBadge({ status, big }: { status: Status; big?: boolean }) {
  const b = BADGES[status]
  const I = b.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${b.cls} ${big ? 'px-4 py-2 text-base' : 'px-2.5 py-1 text-xs'}`}>
      <I size={big ? 18 : 13} /> {b.label}
    </span>
  )
}
export const STATUS_KEYS = Object.keys(BADGES) as Status[]

export function Pill({ children, tone = 'grey' }: { children: React.ReactNode; tone?: 'grey' | 'green' | 'blue' | 'amber' | 'red' | 'teal' }) {
  const t = {
    grey: 'bg-slate-100 text-slate-700', green: 'bg-green-100 text-green-800', blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-900', red: 'bg-red-100 text-red-800', teal: 'bg-teal-50 text-teal-700',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${t}`}>{children}</span>
}

/* ---------- cards ---------- */
export function Card({ children, className = '', pad = true }: { children: React.ReactNode; className?: string; pad?: boolean }) {
  return <div className={`rounded-2xl bg-white border border-line shadow-soft ${pad ? 'p-5 sm:p-6' : ''} ${className}`}>{children}</div>
}
export function Stat({ label, value, icon: I, tone = 'teal' }: { label: string; value: string | number; icon: React.ElementType; tone?: string }) {
  const tones: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-700', amber: 'bg-amber-100 text-amber-900', blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-bg text-indigo-ink', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800',
  }
  return (
    <Card className="flex items-center gap-4">
      <span className={`grid h-12 w-12 place-items-center rounded-xl ${tones[tone]}`}><I size={22} /></span>
      <div>
        <div className="text-3xl font-extrabold text-navy leading-none">{value}</div>
        <div className="mt-1 text-sm text-mute">{label}</div>
      </div>
    </Card>
  )
}

/* ---------- form controls ---------- */
export function Field({ label, required, optional, hint, error, success, children }: {
  label: string; required?: boolean; optional?: boolean; hint?: string; error?: string; success?: boolean; children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-navy">
        {label}
        {required && <span className="text-red-600" aria-label="required">*</span>}
        {optional && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-mute">Optional</span>}
        {success && <Check size={14} className="text-green-600" />}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 flex items-center gap-1 text-[13px] text-red-700"><AlertTriangle size={13} />{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[13px] text-mute">{hint}</span>
      ) : null}
    </label>
  )
}
const inputCls = (err?: boolean) =>
  `h-11 w-full rounded-[10px] border bg-white px-3.5 text-[15px] text-navy placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 disabled:bg-slate-100 disabled:text-slate-500 ${err ? 'border-red-500 bg-red-50/40' : 'border-slate-300 hover:border-slate-400'}`
export function Input({ error, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input {...p} className={`${inputCls(error)} ${p.className || ''}`} />
}
export function Select({ options, placeholder = 'Select…', ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; placeholder?: string | false }) {
  return (
    <select {...p} className={`${inputCls()} ${p.className || ''}`}>
      {placeholder !== false && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  )
}
export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...p} className={`${inputCls()} h-auto py-2.5 ${p.className || ''}`} />
}
export function PhoneInput(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex">
      <span className="grid h-11 place-items-center rounded-l-[10px] border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-navy">🇧🇩 +880</span>
      <input {...p} placeholder="17XX-XXXXXX" className={`${inputCls()} rounded-l-none`} />
    </div>
  )
}
export function PasswordInput({ strength, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { strength?: boolean }) {
  const [show, setShow] = useState(false)
  const v = String(p.value ?? '')
  const score = [v.length >= 8, /[A-Z]/.test(v), /[0-9]/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length
  const lab = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const col = ['bg-slate-300', 'bg-red-500', 'bg-amber-500', 'bg-teal-500', 'bg-green-600'][score]
  return (
    <div>
      <div className="relative">
        <input {...p} type={show ? 'text' : 'password'} className={`${inputCls()} pr-11`} />
        <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-navy">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {strength && v && (
        <div className="mt-2">
          <div className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? col : 'bg-slate-200'}`} />)}</div>
          <p className="mt-1 text-xs text-mute">{lab} · 8+ characters, an uppercase letter, a number and a symbol</p>
        </div>
      )}
    </div>
  )
}
export function Check2({ label, checked, onChange, children }: { label?: string; checked: boolean; onChange: (b: boolean) => void; children?: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-teal-600" />
      <span>{label}{children}</span>
    </label>
  )
}
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-teal-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}
export function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button type="button" key={o} aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${on ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-300 bg-white text-ink hover:border-slate-400'}`}>
            {on && <Check size={14} />}{o}
          </button>
        )
      })}
    </div>
  )
}
export function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (t: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${value === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-mute hover:text-navy'}`}>
          {t}
        </button>
      ))}
    </div>
  )
}

/* ---------- progress ---------- */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm sm:hidden">
        <span className="font-semibold text-navy">Step {current + 1} of {steps.length}</span>
        <span className="text-mute">{steps[current]}</span>
      </div>
      <ol className="hidden items-center sm:flex">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <span className="flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${i < current ? 'bg-teal-600 text-white' : i === current ? 'bg-navy text-white ring-4 ring-navy/10' : 'bg-slate-200 text-slate-600'}`}>
                {i < current ? <Check size={16} /> : i + 1}
              </span>
              <span className={`text-sm font-semibold ${i === current ? 'text-navy' : 'text-mute'}`}>{s}</span>
            </span>
            {i < steps.length - 1 && <span className={`mx-3 h-0.5 flex-1 rounded ${i < current ? 'bg-teal-600' : 'bg-slate-200'}`} />}
          </li>
        ))}
      </ol>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 sm:hidden">
        <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  )
}
export function Ring({ pct, size = 120, label = true }: { pct: number; size?: number; label?: boolean }) {
  const r = size / 2 - 9, c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${pct}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e3e8ee" strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={pct >= 100 ? '#15803d' : '#0f6f60'} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} className="transition-all duration-700" />
      </svg>
      {label && <div className="absolute inset-0 grid place-items-center text-center"><div><div className="font-extrabold text-navy" style={{ fontSize: size / 4.2 }}>{pct}%</div><div className="text-[11px] text-mute -mt-0.5">complete</div></div></div>}
    </div>
  )
}
export function Bar({ pct }: { pct: number }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} /></div>
}

/* ---------- modal ---------- */
export function Modal({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] grid place-items-end sm:place-items-center bg-navy/50 p-0 sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className={`fade-up max-h-[92vh] w-full overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-lg">{title}</h3>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-mute hover:bg-black/5"><X size={20} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- alerts, timeline, empty, lock ---------- */
export function Alert({ kind = 'info', title, children }: { kind?: 'info' | 'warning' | 'success' | 'error'; title?: string; children: React.ReactNode }) {
  const s = {
    info: ['bg-blue-50 border-blue-200 text-blue-900', Info], warning: ['bg-amber-50 border-amber-300 text-amber-900', AlertTriangle],
    success: ['bg-green-50 border-green-200 text-green-900', CheckCircle2], error: ['bg-red-50 border-red-200 text-red-900', XCircle],
  }[kind] as [string, React.ElementType]
  const I = s[1]
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-sm ${s[0]}`} role={kind === 'error' ? 'alert' : undefined}>
      <I size={18} className="mt-0.5 shrink-0" />
      <div>{title && <p className="font-bold">{title}</p>}<div className={title ? 'mt-0.5' : ''}>{children}</div></div>
    </div>
  )
}
export function Timeline({ items }: { items: { title: string; sub?: string; state: 'done' | 'current' | 'todo' | 'skip' }[] }) {
  return (
    <ol>
      {items.map((it, i) => (
        <li key={it.title} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${it.state === 'done' ? 'bg-teal-600 text-white' : it.state === 'current' ? 'bg-amber-cta text-navy ring-4 ring-amber-cta/25' : 'border-2 border-slate-300 bg-white text-slate-400'}`}>
              {it.state === 'done' ? <Check size={14} /> : i + 1}
            </span>
            {i < items.length - 1 && <span className={`my-1 w-0.5 flex-1 ${it.state === 'done' ? 'bg-teal-600' : 'bg-slate-200'}`} />}
          </div>
          <div className="pb-6">
            <p className={`text-[15px] font-semibold ${it.state === 'todo' || it.state === 'skip' ? 'text-mute' : 'text-navy'}`}>{it.title}</p>
            {it.sub && <p className="text-sm text-mute">{it.sub}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
export function Avatar({ name, size = 40, tone = 'teal' }: { name: string; size?: number; tone?: string }) {
  const bg = { teal: 'bg-teal-600', navy: 'bg-navy', amber: 'bg-amber-cta text-navy', indigo: 'bg-indigo-ink' }[tone] || 'bg-teal-600'
  return (
    <span style={{ width: size, height: size, fontSize: size / 2.6 }} className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${bg}`}>
      {name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
    </span>
  )
}
export function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <Illustration kind="empty" size={150} />
      <h3 className="mt-4 text-lg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-mute">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}
export function LockOverlay({ title = 'Locked until your profile is 100% complete', cta, onCta }: { title?: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/75 p-4 text-center backdrop-blur-[3px]">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy text-white"><Lock size={20} /></span>
        <p className="mt-3 text-sm font-bold text-navy">{title}</p>
        {cta && <Button size="sm" className="mt-3" onClick={onCta}>{cta}</Button>}
      </div>
    </div>
  )
}
export function PrivacyNote({ compact }: { compact?: boolean }) {
  return (
    <div className="flex gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-800">
      <ShieldCheck size={20} className="mt-0.5 shrink-0" />
      <p>{compact ? 'Documents are private and visible only to authorized TuitionHub administrators.' : 'Your identity documents are stored securely and are visible only to authorized TuitionHub administrators. They are never shown publicly or to other users.'}</p>
    </div>
  )
}

/* ---------- illustrations (flat, one palette) ---------- */
export function Illustration({ kind, size = 240 }: { kind: 'hero' | 'shield' | 'empty' | 'success' | 'wait' | 'lock'; size?: number }) {
  const T = '#0f6f60', N = '#0f2742', A = '#f2a93b', L = '#cfeae4', S = '#f2c9a0'
  const common = { width: size, height: size, viewBox: '0 0 240 240', 'aria-hidden': true } as const
  if (kind === 'hero')
    return (
      <svg {...common}>
        <circle cx="120" cy="124" r="100" fill="#eaf6f3" />
        <rect x="40" y="150" width="160" height="14" rx="7" fill={N} />
        <rect x="56" y="132" width="60" height="18" rx="3" fill={T} /><rect x="64" y="116" width="52" height="16" rx="3" fill={A} /><rect x="60" y="102" width="56" height="14" rx="3" fill={N} />
        <circle cx="156" cy="72" r="20" fill={S} /><path d="M134 72a22 22 0 0 1 44 0c-8-12-34-12-44 0Z" fill={N} />
        <path d="M128 150c0-28 12-48 28-48s28 20 28 48Z" fill={T} /><rect x="148" y="90" width="16" height="16" fill={S} />
        <path d="M126 116 98 104" stroke={S} strokeWidth="9" strokeLinecap="round" />
        <path d="M182 56 156 46 130 56l26 10 26-10Zm-38 14v10c0 4 6 8 12 8s12-4 12-8V70l-12 5-12-5Z" fill={N} transform="translate(0 -14) scale(1)" opacity="0" />
        <g transform="translate(168 24)"><path d="M20 0 0 8v12c0 14 8 22 20 26 12-4 20-12 20-26V8L20 0Z" fill={A} /><path d="m11 22 7 7 12-14" stroke={N} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
        <g transform="translate(34 56)"><path d="M14 0a14 14 0 0 0-14 14c0 12 14 26 14 26s14-14 14-26A14 14 0 0 0 14 0Z" fill={T} /><circle cx="14" cy="14" r="5" fill="#fff" /></g>
      </svg>
    )
  if (kind === 'shield')
    return (
      <svg {...common}>
        <circle cx="120" cy="120" r="104" fill="#eaf6f3" /><circle cx="120" cy="120" r="78" fill="none" stroke={L} strokeWidth="2" strokeDasharray="4 8" />
        <path d="M120 40 62 62v50c0 42 26 70 58 84 32-14 58-42 58-84V62l-58-22Z" fill={T} />
        <path d="M120 54 74 71v41c0 33 20 55 46 68 26-13 46-35 46-68V71l-46-17Z" fill="#0b5a4e" />
        <path d="m94 118 18 18 36-40" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="200" cy="64" r="10" fill={A} /><circle cx="36" cy="170" r="7" fill={N} />
      </svg>
    )
  if (kind === 'success')
    return (
      <svg {...common}>
        <circle cx="120" cy="120" r="100" fill="#e3f5e8" />
        <circle cx="120" cy="120" r="60" fill="#15803d" /><path d="m92 122 20 20 38-42" stroke="#fff" strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {[[40, 60, A], [200, 50, T], [190, 180, A], [48, 180, N], [120, 24, T]].map(([x, y, c], i) => <rect key={i} x={x as number} y={y as number} width="10" height="10" rx="2" fill={c as string} transform={`rotate(${i * 25} ${x} ${y})`} />)}
      </svg>
    )
  if (kind === 'wait')
    return (
      <svg {...common}>
        <circle cx="120" cy="120" r="100" fill="#fef3d6" />
        <rect x="64" y="52" width="112" height="140" rx="10" fill="#fff" stroke={N} strokeWidth="4" />
        {[80, 104, 128].map((y) => <rect key={y} x="82" y={y} width={y === 128 ? 50 : 76} height="8" rx="4" fill={L} />)}
        <circle cx="160" cy="164" r="32" fill={A} /><path d="M160 146v18l12 8" stroke={N} strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
    )
  if (kind === 'lock')
    return (
      <svg {...common}><circle cx="120" cy="120" r="100" fill="#eef1f5" /><rect x="76" y="108" width="88" height="70" rx="12" fill={N} /><path d="M92 108V88a28 28 0 0 1 56 0v20" stroke={N} strokeWidth="12" fill="none" /><circle cx="120" cy="140" r="9" fill={A} /><rect x="116" y="142" width="8" height="18" rx="3" fill={A} /></svg>
    )
  return (
    <svg {...common}>
      <circle cx="120" cy="120" r="100" fill="#eef1f5" />
      <rect x="62" y="70" width="116" height="96" rx="12" fill="#fff" stroke={N} strokeWidth="4" />
      <circle cx="112" cy="116" r="22" fill="none" stroke={T} strokeWidth="6" /><path d="m128 132 22 22" stroke={T} strokeWidth="8" strokeLinecap="round" />
      <circle cx="190" cy="60" r="8" fill={A} /><circle cx="48" cy="150" r="6" fill={T} />
    </svg>
  )
}

/* ---------- document upload (shared) ---------- */
type UpState = 'empty' | 'camera' | 'preview' | 'uploading' | 'uploaded' | 'error'
export function DocUpload({ label, guide, initial = 'empty', fakeKind = 'NID FRONT', required = true, onChange }: {
  label: string; guide?: string; initial?: UpState; fakeKind?: string; required?: boolean; onChange?: (ok: boolean) => void
}) {
  const [st, setSt] = useState<UpState>(initial)
  const [err, setErr] = useState('')
  const [prog, setProg] = useState(0)
  const [src, setSrc] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number>(0)
  useEffect(() => { if (initial === 'uploaded') onChange?.(true) }, [])
  useEffect(() => () => clearInterval(timer.current), [])

  const pick = (f?: File) => {
    if (!f) return
    const okType = ['image/jpeg', 'image/png'].includes(f.type) && /\.(jpe?g|png)$/i.test(f.name)
    if (!okType) {
      setErr(f.type === 'application/pdf' || /\.pdf$/i.test(f.name) ? 'PDF files are not accepted. Please upload a clear photo (JPG, JPEG or PNG).' : 'Unsupported file type. Please upload a JPG, JPEG or PNG photo.')
      setSt('error'); return
    }
    if (f.size > 8 * 1024 * 1024) { setErr('This file is too large (max 8 MB). Please retake or compress the photo.'); setSt('error'); return }
    setSrc(URL.createObjectURL(f)); setSt('preview')
  }
  const upload = () => {
    setSt('uploading'); setProg(0)
    timer.current = window.setInterval(() => setProg((p) => {
      if (p >= 100) { clearInterval(timer.current); setSt('uploaded'); onChange?.(true); return 100 }
      return p + 20
    }), 250)
  }
  const reset = () => { setSt('empty'); setSrc(''); setErr(''); onChange?.(false) }

  const sample = (
    <div className="relative grid h-full w-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200">
      {src ? <img src={src} alt="Selected document preview" className="h-full w-full object-cover" /> : (
        <div className="w-[78%] rounded-lg border-2 border-dashed border-slate-400 bg-white/80 p-3 text-[10px] font-bold text-slate-500">
          <div className="mb-2 flex items-center gap-2"><span className="h-6 w-6 rounded bg-slate-300" /><span>SAMPLE – NOT A REAL DOCUMENT</span></div>
          <div className="mb-1 h-1.5 w-3/4 rounded bg-slate-300" /><div className="mb-1 h-1.5 w-1/2 rounded bg-slate-300" /><div className="h-1.5 w-2/3 rounded bg-slate-300" />
          <div className="mt-2 text-center tracking-widest text-slate-400">{fakeKind}</div>
        </div>
      )}
    </div>
  )

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-navy"><FileText size={16} className="text-teal-600" />{label}{required ? <span className="text-red-600">*</span> : <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-mute">Optional</span>}</p>
        {st === 'uploaded' && <Pill tone="green"><Check size={12} />Uploaded</Pill>}
        {st === 'error' && <Pill tone="red">Error</Pill>}
      </div>
      {st === 'empty' && (
        <div>
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <UploadIcon className="mx-auto text-slate-400" size={28} />
            <p className="mt-2 text-sm font-medium text-navy">Add a photo of the original document</p>
            <p className="text-xs text-mute">JPG, JPEG or PNG only · max 8 MB · PDF not accepted</p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <Button size="sm" onClick={() => setSt('camera')}><Camera size={16} />Take photo with camera</Button>
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}><UploadIcon size={16} />Upload image from device</Button>
            </div>
            <input ref={fileRef} type="file" hidden accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
            <button className="mt-3 text-xs text-mute underline" onClick={() => { setErr('PDF files are not accepted. Please upload a clear photo (JPG, JPEG or PNG).'); setSt('error') }}>Preview: choose a PDF</button>
          </div>
          <ul className="mt-3 grid gap-x-4 gap-y-1 text-[13px] text-mute sm:grid-cols-2">
            {['Place the original on a flat surface', 'Use good, even lighting', 'All four corners visible', 'No glare or shadows', 'Text must be readable', 'No screenshots or photocopies'].map((g) => <li key={g} className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-teal-600" />{g}</li>)}
          </ul>
          {guide && <p className="mt-2 text-[13px] font-medium text-teal-700">{guide}</p>}
        </div>
      )}
      {st === 'camera' && (
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1f3550,#0b1a2c)]" />
            <div className="absolute inset-[12%] rounded-xl border-2 border-white/90">
              {['top-0 left-0 border-t-4 border-l-4', 'top-0 right-0 border-t-4 border-r-4', 'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((c) => <span key={c} className={`absolute h-6 w-6 border-amber-cta ${c}`} />)}
            </div>
            <p className="absolute inset-x-0 bottom-3 text-center text-xs font-medium text-white">Fit all four corners inside the frame</p>
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSt('empty')}>Cancel</Button>
            <Button size="sm" onClick={() => setSt('preview')}><Camera size={16} />Capture</Button>
          </div>
        </div>
      )}
      {(st === 'preview' || st === 'uploading' || st === 'uploaded') && (
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-line">{sample}</div>
          <div className="flex flex-col justify-center">
            {st === 'preview' && <>
              <p className="text-sm font-medium text-navy">Check the photo is sharp and complete.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={upload}>Use this photo</Button>
                <Button size="sm" variant="secondary" onClick={reset}><RefreshCw size={14} />Retake</Button>
              </div>
            </>}
            {st === 'uploading' && <><p className="text-sm font-medium text-navy">Uploading… {prog}%</p><div className="mt-2"><Bar pct={prog} /></div></>}
            {st === 'uploaded' && <>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700"><CheckCircle2 size={16} />Photo uploaded</p>
              <p className="mt-1 text-xs text-mute">Your photo will be manually reviewed by our admin team.</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={reset}><RefreshCw size={14} />Replace image</Button>
                <Button size="sm" variant="ghost" onClick={reset}><Trash2 size={14} />Remove</Button>
              </div>
            </>}
          </div>
        </div>
      )}
      {st === 'error' && (
        <div>
          <Alert kind="error" title="We couldn't use that file">{err}</Alert>
          <p className="mt-2 text-xs text-mute">Other reasons we ask for a new photo: blurry, too dark, or glare covering text.</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={reset}>Try again</Button>
        </div>
      )}
      <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-mute"><ShieldCheck size={14} className="text-teal-600" />Your photo will be manually reviewed by our admin team. Private — visible only to authorized administrators.</p>
    </div>
  )
}

export { GraduationCap }
