import { useState } from 'react'
import { Bell, ChevronDown, LogOut, Lock, MoreHorizontal, X } from 'lucide-react'
import { Avatar, Button, DEV_TOOLS, Logo, Modal, useApp } from './ui'

export type NavItem = { id: string; label: string; icon: React.ElementType; locked?: boolean }

export function Shell({ nav, active, onNav, name, roleLabel, children, tone = 'teal', banner }: {
  nav: NavItem[]; active: string; onNav: (id: string) => void; name: string; roleLabel: string
  children: React.ReactNode; tone?: 'teal' | 'navy'; banner?: React.ReactNode
}) {
  const { go, logout, toast } = useApp()
  const [menu, setMenu] = useState(false)
  const [more, setMore] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [notif, setNotif] = useState(false)
  const side = tone === 'navy' ? 'bg-navy text-slate-300' : 'bg-white text-ink border-r border-line'
  const click = (n: NavItem) => {
    if (n.locked) return toast(`${n.label} is locked until your account is approved and your profile is complete.`, 'warning')
    setMore(false); onNav(n.id)
  }
  const Item = ({ n }: { n: NavItem }) => {
    const on = active === n.id
    return (
      <button onClick={() => click(n)} aria-current={on ? 'page' : undefined}
        className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition ${n.locked ? 'cursor-not-allowed text-slate-400' : on ? (tone === 'navy' ? 'bg-white/10 text-white' : 'bg-teal-50 text-teal-700') : tone === 'navy' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
        <n.icon size={18} />{n.label}{n.locked && <Lock size={13} className="ml-auto" />}
      </button>
    )
  }
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <aside className={`sticky top-0 hidden h-screen flex-col p-4 lg:flex ${side}`}>
        <div className="px-2 py-2"><Logo light={tone === 'navy'} /></div>
        {tone === 'navy' && <span className="mx-2 mt-1 w-fit rounded bg-amber-cta px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">Admin console</span>}
        <nav className="mt-6 flex-1 space-y-1">{nav.map((n) => <Item key={n.id} n={n} />)}</nav>
        <button onClick={() => setConfirm(true)} className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold ${tone === 'navy' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}><LogOut size={18} />Logout</button>
      </aside>
      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="lg:hidden"><Logo size={24} /></div>
          <div className="hidden text-sm text-mute lg:block">{roleLabel}</div>
          <div className="relative flex items-center gap-2">
            <button aria-label="Notifications" aria-expanded={notif} onClick={() => setNotif(!notif)} className="relative rounded-full p-2 hover:bg-black/5"><Bell size={20} /></button>
            {notif && (
              <div className="absolute right-0 top-12 z-40 w-72 rounded-xl border border-line bg-white p-3 shadow-soft">
                <p className="px-2 pb-2 text-sm font-bold text-navy">Notifications</p>
                <p className="px-2 py-2 text-sm text-mute">You’re all caught up. Updates about your account will appear here.</p>
              </div>
            )}
            <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-black/5" aria-haspopup="menu" aria-expanded={menu}>
              <Avatar name={name} size={34} tone={tone === 'navy' ? 'navy' : 'teal'} /><span className="hidden text-sm font-semibold text-navy sm:block">{name}</span><ChevronDown size={16} />
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-line bg-white p-1.5 shadow-soft">
                <div className="px-3 py-2"><p className="text-sm font-bold text-navy">{name}</p><p className="text-xs text-mute">{roleLabel}</p></div>
                {DEV_TOOLS && <button role="menuitem" onClick={() => { setMenu(false); go('timeout') }} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">Preview session timeout</button>}
                <button role="menuitem" onClick={() => { setMenu(false); setConfirm(true) }} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50">Logout</button>
              </div>
            )}
          </div>
        </header>
        {banner}
        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white lg:hidden" aria-label="Primary">
        {nav.slice(0, 4).map((n) => (
          <button key={n.id} onClick={() => click(n)} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${n.locked ? 'text-slate-400' : active === n.id ? 'text-teal-700' : 'text-mute'}`}>
            {n.locked ? <Lock size={20} /> : <n.icon size={20} />}<span className="max-w-full truncate px-1">{n.label}</span>
          </button>
        ))}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-mute"><MoreHorizontal size={20} />More</button>
      </nav>
      {more && (
        <div className="fixed inset-0 z-[80] bg-navy/50 lg:hidden" onClick={() => setMore(false)}>
          <div className="fade-up absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between px-2"><b className="text-navy">Menu</b><button aria-label="Close" onClick={() => setMore(false)}><X /></button></div>
            <div className="space-y-1">{nav.map((n) => <Item key={n.id} n={n} />)}
              <button onClick={() => { setMore(false); setConfirm(true) }} className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold text-red-700"><LogOut size={18} />Logout</button></div>
          </div>
        </div>
      )}
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Log out of this device?"
        footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Stay signed in</Button><Button variant="destructive" onClick={async () => {
          try {
            await logout()
            setConfirm(false)
            toast('You have been logged out.', 'info')
          } catch (error) {
            toast(error instanceof Error ? error.message : 'Unable to log out. Please try again.', 'error')
          }
        }}>Log out</Button></>}>
        <p className="text-sm text-mute">You’ll need to enter your password to sign in again on this device. Other devices stay signed in.</p>
      </Modal>
    </div>
  )
}
