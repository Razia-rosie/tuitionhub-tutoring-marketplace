import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, Pill, useApp } from './ui'

type S = 'Fixed' | 'Added' | 'Verified' | 'Config-checked' | 'Out of scope'
const TONE: Record<S, 'green' | 'teal' | 'blue' | 'amber' | 'grey'> = { Fixed: 'green', Added: 'teal', Verified: 'blue', 'Config-checked': 'amber', 'Out of scope': 'grey' }

const ROWS: [string, string, string, S][] = [
  ['Environment', 'Coded React prototype; screens are reached through in-app routes.', 'Audit and fixes applied to the code. The Prototype navigator jumps to any screen or state.', 'Config-checked'],
  ['Settings', '“Change password” button looked active but did nothing.', 'Opens a modal with current/new password fields, cancel and confirm, and a toast.', 'Fixed'],
  ['Landing footer', 'Company links (About, Terms, Help…) were dead.', 'Each now responds with a clear “not part of this prototype” notice instead of silently doing nothing.', 'Fixed'],
  ['Admin filters', 'Role filter showed a generic “Select…” option.', 'Select now supports a custom placeholder; role filter reads “All roles”.', 'Fixed'],
  ['Global', 'Prototype button covered the sidebar Logout link on desktop.', 'Moved to the bottom-right on large screens.', 'Fixed'],
  ['Learning data', 'Room data was hard-coded to one student; child switching changed nothing; state reset on every navigation.', 'Added a shared store: separate records per room (assignments, tasks, attendance, materials, announcements, performance, results, feedback) and per batch subject room.', 'Added'],
  ['Navigation · back', 'Back controls were missing or inconsistent.', 'One shared Back control (same position/style) that returns to the true previous step using a history stack; falls back to the dashboard.', 'Fixed'],
  ['Navigation · breadcrumbs', 'No breadcrumbs on deep pages.', 'Added to Admin → Applications → Detail, Batches → Batch → Subject room, and Learning rooms → Student → Room, plus feedback.', 'Added'],
  ['Navigation · sidebar', 'Leaving a learning screen via Home/Settings/Profile/Applications/Schedule landed on the wrong dashboard view.', 'Sidebar items now route to the matching dashboard view.', 'Fixed'],
  ['Marketplace', 'Applying could look like it created a tuition.', 'Detail page shows “Application sent” and states that no tuition starts until both sides confirm.', 'Fixed'],
  ['Communication', 'Messages lived in local state and reset; guardian could accept for the tutor.', 'Messages stored; request Accept/Decline is tutor-only; Request-chat and Decline are guardian-only.', 'Fixed'],
  ['Agreement', 'Any role could tick any party’s checkbox.', 'Each checkbox only works for its own role; Confirm needs guardian and tutor; student acknowledgement stays optional.', 'Fixed'],
  ['Room creation', 'No room was created from confirmation.', 'Confirming adds a separate room for the student, listed beside existing rooms; no room exists before confirmation.', 'Added'],
  ['Attendance', 'Attendance was a simple toggle, not linked to a session.', 'Tutor opens a session → student checks in → tutor confirms Present/Late/Absent. Guardian is view-only.', 'Added'],
  ['Assignments', 'No assignment lifecycle.', 'Assigned → In Progress → Submitted → Under Review → Accepted / Correction Requested (with comment) → Resubmit. Image or PDF upload.', 'Added'],
  ['Daily tasks', 'Tasks were local and not visible to others.', 'Tutor assigns; student completes with a diary note; tutor and guardian see the result.', 'Added'],
  ['Coaching', 'Batch and subject rooms were placeholders.', 'Batches → subject rooms with roster (authorized-guardian flag), attendance, announcements, exams, materials; students/guardians see only enrolled batches.', 'Added'],
  ['Permissions', 'Rooms of other students were reachable in principle.', 'Student sees only own rooms; guardian only the selected child’s; denied screen explains why and notes that real checks are server-side.', 'Fixed'],
  ['Past tuitions', 'No read-only history.', 'Completed tuition shows a read-only banner and disabled controls.', 'Added'],
  ['Feedback', 'Private feedback could be confused with public reviews.', 'Separate tabs; private feedback stays in the room; public reviews become “Pending moderation”; feedback needs one attended session.', 'Fixed'],
  ['Admin → applicant', 'Admin actions did not change what the applicant sees.', 'Correction, interview, approve and reject now set the applicant status; “Preview what the applicant sees” opens it.', 'Fixed'],
  ['Schedule', 'Static weekly schedule unrelated to rooms.', 'Schedule lists upcoming sessions from the user’s own rooms.', 'Fixed'],
  ['Scenario 5, 6, 7, 9, 10', 'Task submit, attendance, parent view, assignment review, child switching.', 'Run in headless Chromium across roles; all assertions passed.', 'Verified'],
  ['Scenario 8', 'Announcement visible only in the intended batch.', 'Published in Class 9 Science → Physics; visible to enrolled student; absent in the HSC batch.', 'Verified'],
  ['Marketplace flow', 'Application → request → accept → demo → agreement → room.', 'Run in headless Chromium, switching roles; room created only after both confirm.', 'Verified'],
  ['Back / modals', 'Back from subject room returns to its batch.', 'Run in headless Chromium.', 'Verified'],
  ['Scenario 11', 'Admin requests correction → applicant status.', 'Run in headless Chromium: admin action, then “Preview what the applicant sees” shows Correction Requested with locked navigation. The applicant sees a stock admin note, not the admin’s typed text.', 'Verified'],
  ['Scenarios 1–4, 12, 15', 'Phase 1 registration, interview-details, approval and login journeys.', 'Wiring read in code (interview dialog opened in a browser, but the sent invitation was not traced to the applicant screen); not run end-to-end.', 'Config-checked'],
  ['Authentication', 'Real login, sign-up, logout, password reset and session restore.', 'Supabase Auth; each user gets a profile row (role, account status) via a database trigger. Postgres row-level security enforces access.', 'Added'],
  ['Admin review', 'Admin decisions did not persist and the applicant saw a stock note.', 'With an admin session, Admin lists real applicants (admin_list_applicants) and approve / correction / interview / reject call admin_set_account_status; the applicant sees the admin’s actual note and can “Check for updates”.', 'Added'],
  ['Profile activation', 'Users could mark themselves active.', 'Activation goes through complete_profile(), which only works after admin approval; profile_pct = 100 is constrained to active accounts.', 'Fixed'],
  ['Storage / workflows', 'Document uploads, marketplace and room data.', 'Schema, RLS and an application status-transition trigger exist in supabase/migrations; these screens still use the in-memory demo store.', 'Config-checked'],
]

export function QAReport() {
  const { go } = useApp()
  const [f, setF] = useState<S | 'All'>('All')
  const rows = ROWS.filter((r) => f === 'All' || r[3] === f)
  const counts = (s: S) => ROWS.filter((r) => r[3] === s).length
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <button onClick={() => go('landing')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700"><ArrowLeft size={16} />Back to prototype</button>
      <div><h1 className="text-2xl sm:text-3xl">QA Report</h1><p className="text-sm text-mute">Audit and repair log for the TuitionHub coded prototype.</p></div>
      <div className="flex flex-wrap gap-2">{(['All', 'Fixed', 'Added', 'Verified', 'Config-checked', 'Out of scope'] as const).map((s) => (
        <button key={s} onClick={() => setF(s)} className={`rounded-full border px-3 py-1 text-xs font-bold ${f === s ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-line text-mute'}`}>{s}{s !== 'All' && ` · ${counts(s)}`}</button>))}</div>
      <Card pad={false} className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-mute"><tr><th className="p-3">Area</th><th className="p-3">Issue</th><th className="p-3">Fix applied</th><th className="p-3">Status</th></tr></thead>
        <tbody className="divide-y divide-line">{rows.map(([a, i, x, s]) => <tr key={a + i} className="align-top"><td className="p-3 font-semibold text-navy">{a}</td><td className="p-3 text-mute">{i}</td><td className="p-3">{x}</td><td className="p-3"><Pill tone={TONE[s]}>{s}</Pill></td></tr>)}</tbody></table></Card>
      <Card className="space-y-2"><h2 className="text-lg">Summary</h2>
        <p className="text-sm"><b>Remaining limitations:</b> data resets on reload; Phase 1 dashboards still use some static sample data (Guardian “Oversight”, application lists); the guardian child switcher drives the learning screens, not the Phase 1 oversight page; the Phase 1 journeys and the Admin applicant link were not re-run end-to-end; contrast was not measured with a tool; no real security.</p>
        <Button variant="secondary" onClick={() => go('design-system')}>Open design system</Button></Card>
    </div>
  )
}
