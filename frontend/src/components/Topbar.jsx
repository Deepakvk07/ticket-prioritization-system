import { useState, useEffect, useRef } from 'react'
import { Search, Bell, HelpCircle, Sun, Moon, X, Ticket, CheckCircle2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function getNotifications() {
  try { return JSON.parse(localStorage.getItem('tf_notifications') || '[]') } catch { return [] }
}
function saveNotifications(notifs) {
  localStorage.setItem('tf_notifications', JSON.stringify(notifs))
}

export default function Topbar({ user, placeholder = 'Search tickets, agents, or knowledge base...' }) {
  const [query, setQuery] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState(getNotifications())
  const [isDark, setIsDark] = useState(() => localStorage.getItem('tf_theme') === 'dark')
  const navigate = useNavigate()
  const notifRef = useRef(null)

  const initials = typeof user?.name === 'string' && user.name.trim()
    ? user.name.trim().slice(0, 2).toUpperCase()
    : typeof user?.email === 'string' && user.email.trim()
      ? user.email.trim().slice(0, 2).toUpperCase()
      : 'US'

  const unreadCount = notifications.filter(n => !n.read).length

  // Apply theme on mount and toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('tf_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Seed initial notifications if none exist
  useEffect(() => {
    if (notifications.length === 0) {
      const seeded = [
        { id: 1, icon: 'ticket', title: 'Ticket Submitted', text: 'Your ticket has been received and is being triaged.', time: 'Just now', read: false },
        { id: 2, icon: 'ai', title: 'AI Triage Complete', text: 'Neural priority classifier has categorized your latest ticket as High.', time: '5m ago', read: false },
        { id: 3, icon: 'check', title: 'System Operational', text: 'All TicketFlow AI services are running normally.', time: '1h ago', read: true },
      ]
      setNotifications(seeded)
      saveNotifications(seeded)
    }
  }, [])

  // Close notif panel on outside click
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

  const getIcon = (icon) => {
    if (icon === 'ticket') return <Ticket size={14} color="#3b82f6" />
    if (icon === 'check') return <CheckCircle2 size={14} color="#10b981" />
    return <AlertCircle size={14} color="#f59e0b" />
  }

  return (
    <header className="topbar" style={{ position: 'relative' }}>
      <div className="search-bar">
        <Search className="search-icon" />
        <input
          id="topbar-search"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="topbar-right">

        {/* Dark/Light Mode Toggle */}
        <button
          className="icon-btn"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={() => setIsDark(d => !d)}
          style={{ transition: 'all 0.2s' }}
        >
          {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="icon-btn"
            title="Notifications"
            onClick={() => { setShowNotifs(!showNotifs); }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                background: '#ef4444', borderRadius: '50%',
                width: 16, height: 16, fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: 46, right: 0, width: 340, zIndex: 2000,
              background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)', borderRadius: 14,
              overflow: 'hidden', animation: 'scaleUp 0.15s ease'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Notifications {unreadCount > 0 && <span style={{ background: '#ef4444', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem', marginLeft: 6, color: '#fff' }}>{unreadCount}</span>}
                </span>
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '12px 16px', borderBottom: '1px solid var(--border)',
                      background: n.read ? 'transparent' : 'rgba(59,130,246,0.05)',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      transition: 'background 0.2s'
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        {getIcon(n.icon)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                          {n.title}
                          {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', marginLeft: 6, verticalAlign: 'middle' }} />}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.text}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, opacity: 0.7 }}>{n.time}</div>
                      </div>
                      <button onClick={() => removeNotif(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0 }}>
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          )}
        </div>

        {/* Help → FAQ */}
        <button className="icon-btn" title="Help / FAQ" onClick={() => navigate('/faq')}>
          <HelpCircle size={18} />
        </button>

        <div
          className="topbar-avatar"
          title={user?.email || 'User Account'}
          onClick={() => {
            const role = localStorage.getItem('user_role_mode') || 'admin'
            if (role === 'admin') navigate('/profile')
          }}
          style={{ cursor: localStorage.getItem('user_role_mode') === 'admin' ? 'pointer' : 'default' }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
