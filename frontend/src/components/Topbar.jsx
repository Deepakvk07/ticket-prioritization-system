import { useState, useEffect, useRef } from 'react'
import { Search, Bell, HelpCircle, Sun, Moon, X, Ticket, CheckCircle2, AlertCircle, LayoutDashboard, Headphones, BarChart2, Cpu, Home, LogOut, Zap } from 'lucide-react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function getNotifications() {
  try { return JSON.parse(localStorage.getItem('tf_notifications') || '[]') } catch { return [] }
}
function saveNotifications(notifs) {
  localStorage.setItem('tf_notifications', JSON.stringify(notifs))
}

const ADMIN_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets', icon: Ticket, label: 'Ticket Queue' },
  { to: '/agents', icon: Headphones, label: 'Agent Management' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/model', icon: Cpu, label: 'Model' },
]

const AGENT_NAV = [
  { to: '/tickets', icon: Ticket, label: 'Assigned Tickets' },
]

const CUSTOMER_NAV = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/tickets', icon: Ticket, label: 'My Tickets' },
  { to: '/track', icon: Search, label: 'Track Ticket' },
  { to: '/faq', icon: HelpCircle, label: 'FAQ / Help' },
]

export default function Topbar({ user, placeholder = 'Search tickets, agents, or help...' }) {
  const [query, setQuery] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState(getNotifications())
  const [isDark, setIsDark] = useState(() => localStorage.getItem('tf_theme') === 'dark')
  const navigate = useNavigate()
  const location = useLocation()
  const notifRef = useRef(null)

  const demoUser = (() => {
    try { return JSON.parse(localStorage.getItem('demo_user') || '{}') } catch { return {} }
  })()
  const activeRole = demoUser.role || localStorage.getItem('user_role_mode') || 'customer'
  const navItems = activeRole === 'admin' ? ADMIN_NAV : activeRole === 'agent' ? AGENT_NAV : CUSTOMER_NAV

  const userName = demoUser.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = typeof userName === 'string' && userName.trim()
    ? userName.trim().slice(0, 2).toUpperCase()
    : 'US'

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('tf_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    if (notifications.length === 0) {
      const seeded = [
        { id: 1, icon: 'ticket', title: 'Ticket Submitted', text: 'Your ticket has been received and is being triaged.', time: 'Just now', read: false },
        { id: 2, icon: 'ai', title: 'AI Triage Complete', text: 'Neural priority classifier predicted ticket priority.', time: '5m ago', read: false },
        { id: 3, icon: 'check', title: 'System Operational', text: 'All TicketFlow AI services running normally.', time: '1h ago', read: true },
      ]
      setNotifications(seeded)
      saveNotifications(seeded)
    }
  }, [])

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    saveNotifications(updated)
  }

  const removeNotif = (id) => {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    saveNotifications(updated)
  }

  const handleLogout = async () => {
    localStorage.removeItem('demo_user')
    localStorage.removeItem('user_role_mode')
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    navigate('/home')
  }

  const getIcon = (icon) => {
    if (icon === 'ticket') return <Ticket size={14} color="#3b82f6" />
    if (icon === 'check') return <CheckCircle2 size={14} color="#10b981" />
    return <AlertCircle size={14} color="#f59e0b" />
  }

  return (
    <header className="topbar" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 62, background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)', sticky: 'top', zIndex: 1000
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
          }}>
            <Zap size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              TicketFlow <span style={{ color: 'var(--accent)' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: activeRole === 'admin' ? '#ef4444' : activeRole === 'agent' ? '#10b981' : 'var(--text-muted)' }}>
              {activeRole === 'admin' ? 'Admin Portal' : activeRole === 'agent' ? 'Agent Workspace' : 'Customer Portal'}
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 10 }}>
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, fontSize: '0.84rem',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  transition: 'all 0.15s ease',
                  border: isActive ? '1px solid rgba(37,99,235,0.2)' : '1px solid transparent'
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="search-bar" style={{ width: 220 }}>
          <Search className="search-icon" size={14} />
          <input
            id="topbar-search"
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '6px 12px 6px 32px' }}
          />
        </div>

        {/* Language Selector Dropdown */}
        <select
          className="form-select"
          value={localStorage.getItem('tf_lang') || 'en'}
          onChange={e => {
            localStorage.setItem('tf_lang', e.target.value)
            window.dispatchEvent(new Event('languageChange'))
          }}
          style={{
            fontSize: '0.78rem', padding: '4px 8px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-input)',
            color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'
          }}
        >
          <option value="en">🇺🇸 EN</option>
          <option value="es">🇪🇸 ES</option>
          <option value="fr">🇫🇷 FR</option>
          <option value="de">🇩🇪 DE</option>
          <option value="hi">🇮🇳 HI</option>
        </select>

        {/* Dark/Light Mode Toggle */}
        <button
          className="icon-btn"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={() => setIsDark(d => !d)}
        >
          {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
        </button>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="icon-btn" title="Notifications" onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={17} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 3, right: 3,
                background: '#ef4444', borderRadius: '50%',
                width: 15, height: 15, fontSize: '0.62rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: 44, right: 0, width: 320, zIndex: 2000,
              background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)', borderRadius: 14, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Notifications {unreadCount > 0 && <span style={{ background: '#ef4444', borderRadius: 10, padding: '1px 6px', fontSize: '0.7rem', marginLeft: 4, color: '#fff' }}>{unreadCount}</span>}
                </span>
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>Mark read</button>
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '10px 14px', borderBottom: '1px solid var(--border)',
                      background: n.read ? 'transparent' : 'rgba(59,130,246,0.05)',
                      display: 'flex', gap: 10, alignItems: 'flex-start'
                    }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {getIcon(n.icon)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{n.text}</div>
                      </div>
                      <button onClick={() => removeNotif(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6, borderLeft: '1px solid var(--border)' }}>
          <div
            className="topbar-avatar"
            title={userName}
            style={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700 }}
          >
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {userName}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {activeRole}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8, marginLeft: 4,
              background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer'
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}
