import { useState } from 'react'
import {
  ArrowRight, BookOpen, Building2, Camera, CheckCircle2, ClipboardCheck, GraduationCap, Handshake,
  Menu, ShieldCheck, UserPlus, Users, Video, X, Lock, Search, Star, Home,
} from 'lucide-react'
import {
  Alert, Button, Card, Field, Illustration, Input, Logo, Modal, PasswordInput, Role, ROLE_LABEL, Tabs, useApp,
} from './ui'
import { ApiError, login, logout as apiLogout, requestPasswordReset, updatePassword } from './api'

export const ROLE_ICON = { tutor: GraduationCap, center: Building2, guardian: Users, student: BookOpen }
const LOGIN_ERROR_TITLE: Record<string, string> = {
  email_not_confirmed: 'Email not confirmed',
  over_request_rate_limit: 'Too many attempts',
  wrong_portal: 'Wrong sign-in page',
  network_error: 'Can’t reach TuitionHub',
  profile_unavailable: 'Service unavailable',
  profile_missing: 'Account problem',
}
const ROLE_DESC: Record<Role, { line: string; verify: string }> = {
  tutor: { line: 'Teach students near you and build a verified reputation.', verify: 'Requires NID photos, a supporting document and an admin review.' },
  center: { line: 'Showcase your institution and reach families in your area.', verify: 'Requires trade license, representative NID and premises photos.' },
  guardian: { line: 'Find trusted tutors and oversee your child’s learning.', verify: 'Requires your NID and your child’s birth certificate photo.' },
  student: { line: 'Get matched with tutors through your guardian.', verify: 'Student accounts are created through an approved Guardian.' },
}

/* ---------------- LANDING ---------------- */
export function Landing() {
  const { go, setRole } = useApp()
  const [drawer, setDrawer] = useState(false)
  const [tab, setTab] = useState('Tutors')
  const nav = ['How It Works', 'For Tutors', 'For Coaching Centers', 'For Guardians', 'For Students', 'Trust & Safety']
  const anchors = ['how', 'benefits', 'benefits', 'benefits', 'benefits', 'trust']
  const scroll = (id: string) => { setDrawer(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }
  const signup = (r: Role) => { setRole(r); go(r === 'student' ? 'student-info' : 'register') }

  const benefits: Record<string, string[]> = {
    Tutors: ['Verified badge that parents trust', 'Suggested tuition opportunities near you', 'Track every application in one place', 'You set your fee, days and areas'],
    'Coaching Centers': ['Institutional profile with verified status', 'Discover relevant listings by subject and area', 'Manage applications and statuses', 'Stand out with a manually reviewed license'],
    Guardians: ['Only admin-verified tutors and centers', 'Post a tuition requirement in minutes', 'Oversee your child’s applications and schedule', 'Private documents, never public'],
    Students: ['Own login linked to your guardian', 'Find help in subjects you struggle with', 'See your weekly schedule', 'Safe, guardian-approved access'],
  }

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => go('landing')} aria-label="TuitionHub home"><Logo /></button>
          <nav className="hidden items-center gap-6 xl:flex">
            {nav.map((n, i) => <button key={n} onClick={() => scroll(anchors[i])} className="text-sm font-medium text-ink hover:text-teal-700">{n}</button>)}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" onClick={() => go('login')}>Log in</Button>
            <Button onClick={() => go('signup')}>Sign up</Button>
          </div>
          <button className="xl:hidden sm:ml-3 rounded-lg p-2 hover:bg-black/5" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu /></button>
        </div>
      </header>
      {drawer && (
        <div className="fixed inset-0 z-[80] bg-navy/50" onClick={() => setDrawer(false)}>
          <aside className="fade-up ml-auto flex h-full w-80 max-w-[88%] flex-col bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><Logo /><button aria-label="Close menu" onClick={() => setDrawer(false)}><X /></button></div>
            <nav className="mt-6 flex flex-col">{nav.map((n, i) => <button key={n} onClick={() => scroll(anchors[i])} className="border-b border-line py-3.5 text-left font-medium">{n}</button>)}</nav>
            <div className="mt-auto flex flex-col gap-2"><Button variant="secondary" onClick={() => go('login')}>Log in</Button><Button onClick={() => go('signup')}>Sign up</Button></div>
          </aside>
        </div>
      )}

      {/* hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:py-20">
          <div className="fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700"><ShieldCheck size={14} />Every account manually verified</span>
            <h1 className="mt-5 text-[34px] font-extrabold leading-[1.1] sm:text-5xl lg:text-[52px] lg:leading-[1.08]">Find verified tutors and trusted coaching centers across Bangladesh</h1>
            <p className="mt-5 max-w-xl text-lg text-mute">TuitionHub connects guardians, students, private tutors and coaching centers. Every profile is reviewed by our admin team before anyone gets access.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="amber" onClick={() => go('signup')}>Get Started <ArrowRight size={18} /></Button>
              <Button size="lg" variant="secondary" onClick={() => scroll('how')}>How It Works</Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <Illustration kind="hero" size={440} />
          </div>
        </div>
      </section>

      {/* roles */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" id="roles">
        <h2 className="text-center text-3xl">Join as</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-mute">One platform, four verified roles, each with its own tools.</p>
        <div className="-mx-4 mt-10 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => {
            const I = ROLE_ICON[r]
            return (
              <Card key={r} className="flex w-72 shrink-0 snap-start flex-col md:w-auto">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700"><I size={24} /></span>
                <h3 className="mt-4 text-xl">{ROLE_LABEL[r]}</h3>
                <p className="mt-1.5 flex-1 text-sm text-mute">{ROLE_DESC[r].line}</p>
                <Button variant={r === 'student' ? 'secondary' : 'primary'} className="mt-5" onClick={() => signup(r)}>Sign up as {r === 'guardian' ? 'Guardian' : r === 'center' ? 'Center' : r === 'tutor' ? 'Tutor' : 'Student'}</Button>
              </Card>
            )
          })}
        </div>
      </section>

      {/* how */}
      <section id="how" className="bg-canvas py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[[UserPlus, 'Register', 'Create your account for your role.'], [Camera, 'Verify identity', 'Upload clear photos; admins review them by hand.'], [ClipboardCheck, 'Complete profile', 'Finish every required field to unlock access.'], [Handshake, 'Get matched', 'Receive rule-based suggestions and apply.']].map(([I, t, d], i) => {
              const Ic = I as typeof UserPlus
              return (
                <div key={t as string} className="relative">
                  <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-navy text-white"><Ic size={22} /></span>{i < 3 && <span className="hidden h-px flex-1 bg-slate-300 lg:block" />}</div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-teal-600">Step {i + 1}</p>
                  <h3 className="text-xl">{t as string}</h3><p className="mt-1 text-sm text-mute">{d as string}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* benefits */}
      <section id="benefits" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl">Built for every side of tutoring</h2>
        <div className="mt-6"><Tabs tabs={Object.keys(benefits)} value={tab} onChange={setTab} /></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {benefits[tab].map((b) => (
            <div key={b} className="fade-up flex items-start gap-3 rounded-xl border border-line bg-white p-5"><CheckCircle2 className="mt-0.5 shrink-0 text-teal-600" size={20} /><p className="font-medium text-navy">{b}</p></div>
          ))}
        </div>
      </section>

      {/* trust */}
      <section id="trust" className="bg-navy py-16 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl !text-white">How we verify every account</h2>
            <p className="mt-3 text-slate-300">Nobody gets operational access until an administrator has verified them and their profile is 100% complete.</p>
            <ul className="mt-8 space-y-4">
              {[[ShieldCheck, 'Manual admin review of every application'], [Camera, 'Camera-photo ID verification (JPG, JPEG, PNG)'], [Video, 'Interview step, online or in-person, when requested'], [Lock, 'Private document handling, never shown publicly'], [Users, 'Parent-linked student accounts']].map(([I, t]) => {
                const Ic = I as typeof Lock
                return <li key={t as string} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-amber-cta"><Ic size={18} /></span>{t as string}</li>
              })}
            </ul>
          </div>
          <div className="mx-auto"><Illustration kind="shield" size={320} /></div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-teal-700 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl !text-white">Create your account</h2>
          <p className="mx-auto mt-3 max-w-lg text-teal-100">Registration takes a few minutes. Our admin team usually reviews applications within 2–3 working days.</p>
          <Button size="lg" variant="amber" className="mt-6" onClick={() => go('signup')}>Create your account</Button>
        </div>
      </section>

      <footer className="border-t border-line bg-canvas">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
          <div><Logo /><p className="mt-3 max-w-xs text-sm text-mute">A verified tutoring marketplace connecting families, students, tutors and coaching centers across Bangladesh.</p></div>
          <nav aria-label="Footer"><h4 className="text-sm">Explore</h4><ul className="mt-3 space-y-2 text-sm text-mute">
            <li><button onClick={() => scroll('how')} className="hover:text-teal-700">How it works</button></li>
            <li><button onClick={() => scroll('trust')} className="hover:text-teal-700">Trust &amp; safety</button></li>
            <li><button onClick={() => go('signup')} className="hover:text-teal-700">Create an account</button></li>
            <li><button onClick={() => go('login')} className="hover:text-teal-700">Log in</button></li>
          </ul></nav>
        </div>
        <p className="border-t border-line py-4 text-center text-xs text-mute">© 2026 TuitionHub</p>
      </footer>
    </div>
  )
}

/* ---------------- AUTH ---------------- */
export function AuthShell({ children, title, sub, wide }: { children: React.ReactNode; title: string; sub?: string; wide?: boolean }) {
  const { go } = useApp()
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between bg-teal-800 p-10 text-white lg:flex">
        <button onClick={() => go('landing')}><Logo light /></button>
        <div><Illustration kind="shield" size={260} /><h2 className="mt-6 max-w-sm text-3xl !text-white">Verified people. Safer tutoring.</h2><p className="mt-2 max-w-sm text-teal-100">Every account is reviewed by hand. Your documents stay private.</p></div>
        <p className="text-xs text-teal-200">Real authorization is enforced by the backend; this design shows intended rules.</p>
      </aside>
      <main className="flex items-start justify-center px-4 py-8 sm:px-8 lg:items-center">
        <div className={`fade-up w-full ${wide ? 'max-w-xl' : 'max-w-md'}`}>
          <button className="mb-6 lg:hidden" onClick={() => go('landing')}><Logo /></button>
          <h1 className="text-3xl">{title}</h1>
          {sub && <p className="mt-2 text-mute">{sub}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  )
}

export function Login({ admin }: { admin?: boolean }) {
  const { go, signIn, toast } = useApp()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false); const [err, setErr] = useState<{ code: string; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setErr(null)

    if (!email.trim() || !pw) {
      setErr({ code: 'invalid_input', text: 'Enter your email and password.' })
      return
    }

    setLoading(true)
    try {
      const user = await login(email.trim(), pw)

      // Each sign-in page accepts only its own kind of account; drop the session it just created.
      if (admin !== (user.role === 'admin')) {
        await apiLogout().catch(() => {})
        setErr({ code: 'wrong_portal', text: admin ? 'This account is not authorized for administrator access.' : 'Please use the administrator sign-in page.' })
        return
      }

      setPw('')
      if (user.role === 'admin') toast('Welcome back, Admin.')
      signIn(user)
    } catch (error) {
      setErr(error instanceof ApiError
        ? { code: error.code, text: error.message }
        : { code: 'unknown', text: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title={admin ? 'Administrator sign in' : 'Welcome back'} sub={admin ? 'Authorized personnel only.' : 'Log in to continue. You’ll be taken to the right screen for your account status.'}>
      {admin && <div className="mb-5 flex items-center gap-3 rounded-xl bg-navy p-4 text-sm text-white"><Lock size={18} className="text-amber-cta" />This area is monitored. Access is logged. No public sign-up exists.</div>}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && <Alert kind="error" title={LOGIN_ERROR_TITLE[err.code] ?? 'Couldn’t log you in'}>{err.text}</Alert>}
        <Field label="Email" required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={admin ? 'admin@tuitionhub.example' : 'you@example.com'} autoComplete="email" autoCapitalize="none" spellCheck={false} error={err?.code === 'invalid_input' && !email.trim()} /></Field>
        <Field label="Password" required><PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Your password" autoComplete="current-password" /></Field>
        {!admin && <div className="text-right text-sm"><button type="button" className="font-semibold text-teal-700 hover:underline" onClick={() => go('forgot')}>Forgot password?</button></div>}
        <Button type="submit" className="w-full" loading={loading}>{admin ? 'Sign in securely' : 'Log in'}</Button>
      </form>
      {!admin && (
        <>
          <p className="mt-6 text-center text-sm text-mute">New here? <button className="font-semibold text-teal-700 hover:underline" onClick={() => go('signup')}>Create an account</button></p>
          <p className="mt-4 text-center text-xs"><button className="text-mute hover:text-navy hover:underline" onClick={() => go('admin-login')}>Admin? Log in here</button></p>
        </>
      )}
      {admin && <button className="mt-6 block w-full text-center text-sm text-mute hover:underline" onClick={() => go('login')}>← Back to user login</button>}
    </AuthShell>
  )
}

export function Forgot() {
  const { go } = useApp(); const [sent, setSent] = useState(false)
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [err, setErr] = useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr('Enter a valid email address, like name@example.com.')
    setErr(''); setLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to send the reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <AuthShell title={sent ? 'Check your inbox' : 'Reset your password'} sub={sent ? 'If an account exists for that email, a reset link is on its way.' : 'Enter your email and we’ll send reset instructions.'}>
      {sent ? <Button className="w-full" onClick={() => go('login')}>Back to log in</Button> : (
        <form className="space-y-4" onSubmit={submit} noValidate>
          <Field label="Email" required error={err}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!err} autoComplete="email" placeholder="you@example.com" /></Field>
          <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
          <button type="button" className="w-full text-sm text-mute hover:underline" onClick={() => go('login')}>Back to log in</button>
        </form>
      )}
    </AuthShell>
  )
}

/** Reached from the emailed recovery link; Supabase has already created a short-lived recovery session. */
export function ResetPassword() {
  const { logout, toast } = useApp()
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('')
  const [loading, setLoading] = useState(false); const [err, setErr] = useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return setErr('Use at least 8 characters.')
    if (pw !== pw2) return setErr('Passwords do not match.')
    setErr(''); setLoading(true)
    try {
      await updatePassword(pw)
      // End the short-lived recovery session so the user signs in fresh with the new password.
      await logout()
      toast('Password updated. Please log in with your new password.')
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to update your password. Request a new link and try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <AuthShell title="Choose a new password" sub="Use 8+ characters with a letter, a number and a symbol.">
      <form className="space-y-4" onSubmit={submit} noValidate>
        {err && <Alert kind="error" title="Couldn’t update password">{err}</Alert>}
        <Field label="New password" required><PasswordInput strength value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
        <Field label="Confirm new password" required><PasswordInput value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>
        <Button type="submit" className="w-full" loading={loading}>Update password</Button>
      </form>
    </AuthShell>
  )
}

export function RoleSelect() {
  const { go, setRole } = useApp()
  const [sel, setSel] = useState<Role | null>(null)
  return (
    <AuthShell title="Create your account" sub="Choose how you’ll use TuitionHub. Each role has its own verification." wide>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => {
          const I = ROLE_ICON[r]; const on = sel === r
          return (
            <button key={r} onClick={() => setSel(r)} aria-pressed={on}
              className={`rounded-2xl border-2 p-4 text-left transition ${on ? 'border-teal-600 bg-teal-50' : 'border-line bg-white hover:border-slate-300'}`}>
              <span className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-lg ${on ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700'}`}><I size={20} /></span>{on && <CheckCircle2 className="text-teal-600" size={20} />}</span>
              <p className="mt-3 font-bold text-navy">{ROLE_LABEL[r]}</p>
              <p className="mt-1 text-[13px] text-mute">{ROLE_DESC[r].verify}</p>
            </button>
          )
        })}
      </div>
      <Button className="mt-6 w-full" disabled={!sel} onClick={() => { setRole(sel!); go(sel === 'student' ? 'student-info' : 'register') }}>Continue</Button>
      <p className="mt-5 text-center text-sm text-mute">Already have an account? <button className="font-semibold text-teal-700 hover:underline" onClick={() => go('login')}>Log in</button></p>
    </AuthShell>
  )
}

export function StudentInfo() {
  const { go, setRole } = useApp()
  return (
    <AuthShell title="Student accounts start with a Guardian" sub="To keep students safe, a student account can only be created by an approved, verified Guardian." >
      <Card className="flex items-start gap-4"><Illustration kind="lock" size={90} /><div><h3 className="text-lg">Ask your guardian to add you</h3><p className="mt-1 text-sm text-mute">Once your guardian is approved, they can choose “Add a student” from their dashboard. You’ll then get your own login.</p></div></Card>
      <div className="mt-6 flex flex-col gap-3"><Button onClick={() => { setRole('guardian'); go('register') }}>I’m a guardian — register</Button><Button variant="secondary" onClick={() => go('login')}>I already have a student login</Button></div>
    </AuthShell>
  )
}

export function Timeout() {
  const { go } = useApp()
  return (
    <AuthShell title="You’ve been signed out" sub="For your security, we ended your session after 30 minutes of inactivity.">
      <Illustration kind="wait" size={160} /><Button className="mt-4 w-full" onClick={() => go('login')}>Log in again</Button>
    </AuthShell>
  )
}

export { Home, Search, Star }
