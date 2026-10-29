import { useCallback, useEffect, useState } from 'react'
import { Compass, X } from 'lucide-react'
import { AppCtx, Role, Status, ToastHost } from './ui'
import { Forgot, Landing, Login, RoleSelect, StudentInfo, Timeout } from './Public'
import { Confirm, Linked, Pending, Register } from './Onboarding'
import { ActiveScreen, ProfileWizard } from './Profile'
import { AccessDenied, AddStudentLocked, Dashboard, DashboardIncomplete } from './Dash'
import { Learn } from './Learn'
import { resetStore } from './store'
import { QAReport } from './QAReport'
import { Admin } from './Admin'
import { DesignSystem } from './DesignSystem'
import { AuthUser, landingFor, logout as apiLogout, me } from './api'

type T = { id: number; kind: 'success' | 'error' | 'warning' | 'info'; text: string }

export default function App() {
  const [route, setRoute] = useState('landing')
  const [role, setRole] = useState<Role>('tutor')
  const [status, setStatus] = useState<Status>('pending')
  const [pct, setPct] = useState(20)
  const [toasts, setToasts] = useState<T[]>([])
  const [menu, setMenu] = useState(false)
  const [authenticatedRole, setAuthenticatedRole] = useState<Role | 'admin' | null>(null)

  // Sets auth state and the landing route together, so the route guard in `go` never sees a stale role.
  const signIn = useCallback((user: AuthUser) => {
    const next = landingFor(user)
    if (next.role) setRole(next.role)
    if (next.status) setStatus(next.status)
    if (next.pct !== undefined) setPct(next.pct)
    setAuthenticatedRole(user.role)
    setRoute(next.route)
  }, [])
  const go = useCallback((r: string) => {
    if (r === 'admin' && authenticatedRole !== 'admin') {
      setRoute('login')
      return
    }
    if ((r === 'dashboard' || r === 'dashboard-incomplete') && !authenticatedRole) {
      setRoute('login')
      return
    }
    setRoute(r)
  }, [authenticatedRole])
  const toast = useCallback((text: string, kind: T['kind'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, kind, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])
  const logout = useCallback(async () => {
    await apiLogout()
    setAuthenticatedRole(null)
    setRoute('login')
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [route])
  useEffect(() => {
    let active = true
    me()
      .then((user) => { if (active && user) signIn(user) })
      .catch((error) => { if (active) toast(error instanceof Error ? error.message : 'Unable to verify your session.', 'error') })
    return () => { active = false }
  }, [signIn, toast])

  const jump = (r: string, ro?: Role, s?: Status, p?: number) => {
    if (ro) setRole(ro)
    if (s) setStatus(s)
    if (p !== undefined) setPct(p)
    setRoute(r); setMenu(false)
  }
  const groups: [string, [string, () => void][]][] = [
    ['Public & auth', [['01 Landing', () => jump('landing')], ['02 Login', () => jump('login')], ['Role select / sign up', () => jump('signup')], ['Forgot password', () => jump('forgot')], ['Admin login', () => jump('admin-login')], ['Session timeout', () => jump('timeout')]]],
    ['Registration', [['03 Tutor registration', () => jump('register', 'tutor')], ['04 Center registration', () => jump('register', 'center')], ['05 Guardian registration', () => jump('register', 'guardian')], ['06 Student (guardian-initiated)', () => jump('add-student', 'guardian')], ['Student card info', () => jump('student-info')]]],
    ['Tutor states', [['Pending review', () => jump('pending', 'tutor', 'pending')], ['Documents required', () => jump('pending', 'tutor', 'documents')], ['Correction requested', () => jump('pending', 'tutor', 'correction')], ['Interview invited', () => jump('pending', 'tutor', 'invited')], ['Interview scheduled', () => jump('pending', 'tutor', 'scheduled')], ['Interview completed', () => jump('pending', 'tutor', 'completed')], ['Rejected', () => jump('pending', 'tutor', 'rejected')], ['Approved', () => jump('pending', 'tutor', 'approved')]]],
    ['Center / Guardian / Student', [['Center · interview scheduled (in-person)', () => jump('pending', 'center', 'scheduled')], ['Guardian · pending', () => jump('pending', 'guardian', 'pending')], ['Guardian · invited', () => jump('pending', 'guardian', 'invited')], ['Student · limited pending', () => jump('pending', 'student', 'pending')], ['Student · online interview', () => jump('pending', 'student', 'scheduled')], ['Add student — locked', () => jump('add-student-locked', 'guardian')], ['Parent–student linked', () => jump('linked', 'guardian')]]],
    ['Profile wizards', [['Tutor', () => jump('profile-wizard', 'tutor', 'approved', 20)], ['Coaching center', () => jump('profile-wizard', 'center', 'approved', 20)], ['Guardian', () => jump('profile-wizard', 'guardian', 'approved', 20)], ['Student', () => jump('profile-wizard', 'student', 'approved', 20)], ['Account Active', () => jump('active', undefined, 'active', 100)]]],
    ['Dashboards', [['Tutor', () => jump('dashboard', 'tutor', 'active', 100)], ['Coaching center', () => jump('dashboard', 'center', 'active', 100)], ['Guardian', () => jump('dashboard', 'guardian', 'active', 100)], ['Student', () => jump('dashboard', 'student', 'active', 100)], ['09 Parent oversight', () => jump('oversight', 'guardian', 'active', 100)], ['Profile incomplete (60%)', () => jump('dashboard-incomplete', 'tutor', 'approved', 60)]]],
    ['P2 · Marketplace (tutor)', [['Opportunity feed', () => jump('learn:feed', 'tutor', 'active', 100)], ['Tuition details', () => jump('learn:detail', 'tutor', 'active', 100)], ['Apply', () => jump('learn:apply', 'tutor', 'active', 100)], ['Guardian reviews applicants', () => jump('learn:review', 'guardian', 'active', 100)], ['Communication request', () => jump('learn:request', 'tutor', 'active', 100)], ['Messaging locked', () => jump('learn:chat-locked', 'guardian', 'active', 100)], ['Messaging', () => jump('learn:chat', 'tutor', 'active', 100)], ['Demo class', () => jump('learn:demo', 'tutor', 'active', 100)], ['Agreement · guardian', () => jump('learn:agreement', 'guardian', 'active', 100)], ['Agreement · tutor', () => jump('learn:agreement', 'tutor', 'active', 100)], ['Request · guardian view', () => jump('learn:request', 'guardian', 'active', 100)], ['Room created', () => jump('learn:created', 'tutor', 'active', 100)], ['Connections', () => jump('learn:connections', 'tutor', 'active', 100)]]],
    ['P2 · Rooms & results', [['Rooms · tutor', () => jump('learn:rooms', 'tutor', 'active', 100)], ['Rooms · student', () => jump('learn:rooms', 'student', 'active', 100)], ['Rooms · guardian', () => jump('learn:rooms', 'guardian', 'active', 100)], ['Room · tutor', () => jump('learn:room', 'tutor', 'active', 100)], ['Room · student', () => jump('learn:room', 'student', 'active', 100)], ['Room · guardian', () => jump('learn:room', 'guardian', 'active', 100)], ['Access denied', () => jump('learn:denied', 'student', 'active', 100)], ['Batches · coaching center', () => jump('learn:batches', 'center', 'active', 100)], ['Batches · student', () => jump('learn:batches', 'student', 'active', 100)], ['Batches · guardian', () => jump('learn:batches', 'guardian', 'active', 100)], ['School results · student', () => jump('learn:results', 'student', 'active', 100)], ['School results · guardian', () => jump('learn:results', 'guardian', 'active', 100)], ['Ratings & feedback', () => jump('learn:feedback', 'student', 'active', 100)]]],
    ['Admin & system', [['08 Admin dashboard', () => jump('admin')], ['10 Access restricted', () => jump('restricted')], ['10 No access (403)', () => jump('forbidden')], ['00 Design system', () => jump('design-system')], ['QA Report', () => jump('qa-report')], ['Reset demo data', () => { resetStore(); jump('landing') }]]],
  ]

  let screen: React.ReactNode
  switch (route) {
    case 'landing': screen = <Landing />; break
    case 'login': screen = <Login />; break
    case 'admin-login': screen = <Login admin />; break
    case 'forgot': screen = <Forgot />; break
    case 'signup': screen = <RoleSelect />; break
    case 'student-info': screen = <StudentInfo />; break
    case 'timeout': screen = <Timeout />; break
    case 'register': screen = <Register key={role} kind={role} />; break
    case 'add-student': screen = <Register key="add" kind="student" guardianMode />; break
    case 'add-student-locked': screen = <AddStudentLocked />; break
    case 'confirm': screen = <Confirm />; break
    case 'student-confirm': screen = <Confirm student />; break
    case 'pending': screen = <Pending />; break
    case 'linked': screen = <Linked />; break
    case 'profile-wizard': screen = <ProfileWizard key={role} />; break
    case 'profile-wizard-student': screen = <ProfileWizard key="stu" forceRole="student" />; break
    case 'active': screen = <ActiveScreen />; break
    case 'dashboard': screen = <Dashboard key={role} />; break
    case 'oversight': screen = <Dashboard key="ov" initial="oversight" />; break
    case 'dashboard-incomplete': screen = <DashboardIncomplete />; break
    case 'admin': screen = <Admin />; break
    case 'forbidden': screen = <AccessDenied />; break
    case 'restricted': screen = <AccessDenied restricted />; break
    case 'qa-report': screen = <QAReport />; break
    case 'design-system': screen = <DesignSystem />; break
    default: screen = route.startsWith('learn:') ? <Learn key={route + role} initial={route.slice(6)} /> : route.startsWith('dash:') ? <Dashboard key={route + role} initial={route.slice(5)} /> : <Landing />
  }

  return (
    <AppCtx.Provider value={{ route, go, logout, signIn, role, setRole, status, setStatus, pct, setPct, toast }}>
      {screen}
      <ToastHost toasts={toasts} close={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
      <button onClick={() => setMenu(true)} aria-label="Open prototype navigator" className="fixed left-3 bottom-20 z-[70] lg:left-auto lg:right-4 flex items-center gap-2 rounded-full bg-navy px-3.5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-ink lg:bottom-4">
        <Compass size={16} />Prototype
      </button>
      {menu && (
        <div className="fixed inset-0 z-[95] bg-navy/50" onClick={() => setMenu(false)}>
          <aside className="fade-up h-full w-80 max-w-[90%] overflow-y-auto bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><b className="text-navy">Prototype navigator</b><button aria-label="Close" onClick={() => setMenu(false)}><X /></button></div>
            <p className="mb-4 text-xs text-mute">Jump to any screen or state. Resize the browser to 1440 / 768 / 390 to review responsive layouts.</p>
            {groups.map(([g, items]) => (
              <div key={g} className="mb-4"><p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-teal-700">{g}</p>
                {items.map(([l, f]) => <button key={l} onClick={f} className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100">{l}</button>)}</div>
            ))}
          </aside>
        </div>
      )}
    </AppCtx.Provider>
  )
}
