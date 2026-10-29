import { useSyncExternalStore } from 'react'

export type Kid = 'nabil' | 'tasnim'
export type TaskStatus = 'Assigned' | 'In Progress' | 'Submitted' | 'Under Review' | 'Accepted' | 'Correction Requested'
export type Demo = 'Proposed' | 'Agreed' | 'Rescheduled' | 'Cancelled' | 'Completed'
export type Comm = 'none' | 'pending' | 'accepted' | 'declined'

export type Session = { id: string; label: string; open: boolean; selfMark: boolean; tutorMark: null | 'Present' | 'Absent' | 'Late' }
export type Assn = { id: string; title: string; due: string; status: TaskStatus; note?: string; file?: string; comment?: string }
export type Daily = { id: string; t: string; due: string; done: boolean; note?: string }
export type Room = {
  id: string; student: Kid; title: string; cls: string; tutor: string; days: string; status: 'Active' | 'Completed' | 'Cancelled'
  sessions: Session[]; assignments: Assn[]; daily: Daily[]; materials: string[]; announcements: string[]
  perf: [string, number][]; results: [string, number][]; feedback: { by: string; stars: number; text: string }[]
}
export type SubRoom = { teacher: string; announcements: string[]; exams: string[]; materials: string[]; assignments: string[]; att: Record<string, 'Present' | 'Absent'>; open: boolean }
export type Batch = { id: string; name: string; schedule: string; roster: { name: string; kid?: Kid }[]; subjects: Record<string, SubRoom> }
export type Review = { room: string; by: string; stars: number; text: string; status: 'Pending moderation' | 'Published' }
export type Msg = { me: boolean; t: string }

export type State = {
  child: Kid
  flow: { comm: Comm; demo: Demo; g: boolean; t: boolean; s: boolean }
  rooms: Room[]
  batches: Batch[]
  reviews: Review[]
  msgs: Msg[]
}

export const KIDS: Record<Kid, string> = { nabil: 'Nabil Hasan', tasnim: 'Tasnim Hasan' }

const sess = (labels: string[]): Session[] => labels.map((label, i) => ({ id: `s${i}`, label, open: false, selfMark: false, tutorMark: null }))

function seed(): State {
  const nm = sess(['Sat 1 Nov · 5:00 PM', 'Mon 3 Nov · 5:00 PM', 'Wed 5 Nov · 5:00 PM', 'Fri 7 Nov · 5:00 PM'])
  nm[0].tutorMark = 'Present'; nm[1].tutorMark = 'Absent'; nm[2].tutorMark = 'Present'; nm[2].selfMark = true
  const te = sess(['Tue 4 Nov · 4:00 PM', 'Thu 6 Nov · 4:00 PM', 'Tue 11 Nov · 4:00 PM'])
  te[0].tutorMark = 'Present'; te[1].tutorMark = 'Late'
  return {
    child: 'nabil',
    flow: { comm: 'none', demo: 'Proposed', g: false, t: false, s: false },
    rooms: [
      { id: 'nabil-math', student: 'nabil', title: 'Mathematics', cls: 'Class 9', tutor: 'Rahim Uddin', days: 'Mon · Wed · Fri, 5:00 PM', status: 'Active', sessions: nm,
        assignments: [{ id: 'a1', title: 'Algebra worksheet 4', due: 'Fri 7 Nov', status: 'Assigned' }, { id: 'a2', title: 'Geometry proofs', due: 'Mon 3 Nov', status: 'Accepted', file: 'geometry.jpg' }],
        daily: [{ id: 'd1', t: 'Solve exercise 4.2, Q1–10', due: 'Today', done: false }, { id: 'd2', t: 'Revise formulas', due: 'Yesterday', done: true, note: 'Done, 2 formulas unclear.' }],
        materials: ['Algebra-notes.pdf', 'Formula-sheet.png'], announcements: ['Class on Friday moved to 6:00 PM.'],
        perf: [['Class test 1', 62], ['Class test 2', 71], ['Class test 3', 78]], results: [['Mathematics', 82], ['English', 74], ['Physics', 68]], feedback: [] },
      { id: 'tasnim-eng', student: 'tasnim', title: 'English', cls: 'Class 6', tutor: 'Rahim Uddin', days: 'Tue · Thu, 4:00 PM', status: 'Active', sessions: te,
        assignments: [{ id: 'a1', title: 'Paragraph: My village', due: 'Thu 6 Nov', status: 'Under Review', file: 'paragraph.pdf' }],
        daily: [{ id: 'd1', t: 'Read pages 20–25 aloud', due: 'Today', done: false }],
        materials: ['Grammar-basics.pdf'], announcements: ['Bring the reader on Tuesday.'],
        perf: [['Spelling test', 88], ['Reading check', 74]], results: [['English', 90], ['Bangla', 85], ['Mathematics', 77]], feedback: [] },
      { id: 'nabil-chem', student: 'nabil', title: 'Chemistry (completed)', cls: 'Class 9', tutor: 'Sumaiya Rahman', days: 'Ended 30 Sep', status: 'Completed', sessions: sess(['Sat 20 Sep']).map((x) => ({ ...x, tutorMark: 'Present' as const })),
        assignments: [], daily: [], materials: ['Periodic-table.png'], announcements: [], perf: [['Final test', 84]], results: [], feedback: [] },
    ],
    batches: [
      { id: 'c9', name: 'Class 9 Science', schedule: 'Sat–Wed · 4:00 PM', roster: [{ name: 'Nabil Hasan', kid: 'nabil' }, { name: 'Rafi Ahmed' }, { name: 'Mim Akter' }, { name: 'Sabbir Khan' }],
        subjects: {
          Physics: { teacher: 'Mr. Alam', announcements: ['Chapter 3 test on Sunday.'], exams: ['Chapter 3 test · Sun 9 Nov'], materials: ['Motion-notes.pdf'], assignments: ['Numericals set 2'], att: {}, open: false },
          Chemistry: { teacher: 'Ms. Farhana', announcements: [], exams: [], materials: ['Atoms.pdf'], assignments: [], att: {}, open: false },
          Mathematics: { teacher: 'Mr. Karim', announcements: [], exams: ['Monthly test · Thu 13 Nov'], materials: [], assignments: ['Algebra worksheet'], att: {}, open: false },
        } },
      { id: 'h1', name: 'HSC Science · Morning', schedule: 'Sat–Thu · 7:00 AM', roster: [{ name: 'Imran Chowdhury' }, { name: 'Tania Islam' }, { name: 'Farhan Sadik' }],
        subjects: {
          Physics: { teacher: 'Mr. Alam', announcements: ['Lab session cancelled this week.'], exams: [], materials: [], assignments: [], att: {}, open: false },
          Chemistry: { teacher: 'Ms. Farhana', announcements: [], exams: [], materials: [], assignments: [], att: {}, open: false },
        } },
    ],
    reviews: [{ room: 'nabil-chem', by: 'Guardian of Nabil', stars: 5, text: 'Clear explanations and punctual.', status: 'Published' }],
    msgs: [{ me: false, t: 'Assalamu alaikum, thank you for accepting.' }, { me: true, t: 'Wa alaikum assalam! Happy to discuss the schedule.' }],
  }
}

let S: State = seed()
const subs = new Set<() => void>()
export const useStore = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => S)
export const update = (fn: (s: State) => State) => { S = fn(S); subs.forEach((f) => f()) }
export const resetStore = (fn?: (s: State) => State) => update(() => (fn ? fn(seed()) : seed()))
export const patchRoom = (id: string, fn: (r: Room) => Room) => update((s) => ({ ...s, rooms: s.rooms.map((r) => (r.id === id ? fn(r) : r)) }))
export const patchSub = (bid: string, subj: string, fn: (r: SubRoom) => SubRoom) =>
  update((s) => ({ ...s, batches: s.batches.map((b) => (b.id === bid ? { ...b, subjects: { ...b.subjects, [subj]: fn(b.subjects[subj]) } } : b)) }))
export const patchFlow = (p: Partial<State['flow']>) => update((s) => ({ ...s, flow: { ...s.flow, ...p } }))
export const uid = () => Math.random().toString(36).slice(2, 8)

export function sessionStatus(x: Session) {
  if (x.tutorMark) return x.tutorMark
  if (x.selfMark) return 'Self-marked, awaiting tutor'
  return x.open ? 'Open for check-in' : 'Not opened'
}
export function roomsFor(s: State, role: string): Room[] {
  if (role === 'tutor') return s.rooms
  if (role === 'student') return s.rooms.filter((r) => r.student === 'nabil')
  if (role === 'guardian') return s.rooms.filter((r) => r.student === s.child)
  return []
}
