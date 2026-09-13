import { useState, useEffect, useRef } from 'react'
import { Search, Bell, HelpCircle, Sun, Moon, X, Ticket, CheckCircle2, AlertCircle, LayoutDashboard, Headphones, BarChart2, Cpu, Home, LogOut, Zap, Menu, MessageSquare, Trash2 } from 'lucide-react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../lib/i18n'

function getNotifications() {
  try { return JSON.parse(localStorage.getItem('tf_notifications') || '[]') } catch { return [] }
}
function saveNotifications(notifs) {
  localStorage.setItem('tf_notifications', JSON.stringify(notifs))
}

export default function Topbar({ user, placeholder }) {
  const { t, lang } = useTranslation()
  const [query, setQuery] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(getNotifications())
  const [isDark, setIsDark] = useState(() => localStorage.getItem('tf_theme') === 'dark')
  const navigate = useNavigate()
  const location = useLocation()
  const notifRef = useRef(null)

  const demoUser = (() => {
    try { return JSON.parse(localStorage.getItem('demo_user') || '{}') } catch { return {} }
  })()
  const activeRole = demoUser.role || localStorage.getItem('user_role_mode') || 'customer'
  
  const ADMIN_NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/tickets', icon: Ticket, label: t('ticket_queue') },
    { to: '/agents', icon: Headphones, label: t('agent_management') },
    { to: '/analytics', icon: BarChart2, label: t('analytics') },
    { to: '/model', icon: Cpu, label: t('model') },
  ]

  const AGENT_NAV = [
    { to: '/tickets', icon: Ticket, label: t('assigned_tickets') || 'Assigned Tickets' },
  ]

  const CUSTOMER_NAV = [
    { to: '/home', icon: Home, label: t('home') },
    { to: '/tickets', icon: Ticket, label: t('my_tickets') },
    { to: '/track', icon: Search, label: t('track_ticket') },
    { to: '/faq', icon: HelpCircle, label: t('faq_help') },
  ]

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

  // Live Supabase notification sync: fetch all tickets & activities continuously
  useEffect(() => {
    let isMounted = true

    const loadLiveNotifications = async () => {
      try {
        const localNotifs = getNotifications()
        const { data: tickets } = await supabase
          .from('tickets')
          .select('id, subject, priority, status, created_at, customer_name, customer_email, activities')
          .order('created_at', { ascending: false })
          .limit(25)

        if (isMounted && Array.isArray(tickets)) {
          const liveNotifs = []
          tickets.forEach(t => {
            const tTime = t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
            const isUrgent = t.priority === 'CRITICAL' || t.priority === 'HIGH'
            const cEmail = (t.customer_email || '').toLowerCase()

            // 1. Ticket Creation Notification:
            // Admin and Agents get notified of incoming tickets; Customer does not get self-notified
            if (activeRole !== 'customer') {
              liveNotifs.push({
                id: `t_${t.id}`,
                ticketId: t.id,
                icon: isUrgent ? 'urgent' : 'ticket',
                title: `${t.priority || 'NEW'} Ticket: ${t.subject ? t.subject.slice(0, 32) : 'Untitled'}`,
                text: `From ${t.customer_name || t.customer_email || 'Customer'} • Status: ${t.status || 'OPEN'}`,
                time: tTime,
                read: false,
                link: `/ticket/${t.id}`
              })
            }

            // 2. Chat Activity Notifications:
            if (Array.isArray(t.activities)) {
              t.activities.slice(-3).forEach(act => {
                if (act && (act.text || act.content)) {
                  const actSender = (act.sender_email || '').toLowerCase()
                  const actRole = (act.author_role || '').toUpperCase()
                  const actAuthor = (act.author || act.sender_name || '').toLowerCase()

                  const isSentByAdmin = actRole === 'ADMIN' || actSender === 'admin@ticketflow.ai' || actSender === 'ticketflowai@gmail.com' || actAuthor.includes('admin')
                  const isSentByAgent = actRole === 'AGENT' || actSender.includes('agent') || ['vedprakash@gmail.com', 'amar@gmail.com', 'deepak@gmail.com', 'siddharth@gmail.com'].includes(actSender)
                  const isSentByCustomer = actRole === 'CUSTOMER' || actSender === cEmail || actSender.includes('customer')

                  let isSelfAction = false
                  if (activeRole === 'admin') {
                    isSelfAction = isSentByAdmin || actSender === currentUserEmail
                  } else if (activeRole === 'agent') {
                    isSelfAction = (isSentByAgent && (actSender === currentUserEmail || actSender === 'vedprakash@gmail.com')) || actSender === currentUserEmail
                  } else {
                    isSelfAction = isSentByCustomer || actSender === currentUserEmail
                  }

                  // ONLY notify if action was performed by SOMEONE ELSE
                  if (!isSelfAction) {
                    const actTime = act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
                    liveNotifs.push({
                      id: act.id || `act_${act.created_at}`,
                      ticketId: t.id,
                      icon: 'chat',
                      title: `Message from ${act.sender_name || act.author || 'User'}`,
                      text: (act.text || act.content).slice(0, 42) + '...',
                      time: actTime,
                      read: false,
                      link: `/ticket/${t.id}`
                    })
                  }
                }
              })
            }
          })

          const map = new Map()
          localNotifs.forEach(n => map.set(String(n.id), n))
          liveNotifs.forEach(n => {
            if (!map.has(String(n.id))) map.set(String(n.id), n)
          })

          const combined = Array.from(map.values())
          setNotifications(combined)
          saveNotifications(combined)
        }
      } catch { /* ignore */ }
    }

    loadLiveNotifications()
    const interval = setInterval(loadLiveNotifications, 4000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false) }
    const handleStorage = () => { setNotifications(getNotifications()) }
    
    document.addEventListener('mousedown', handler)
    window.addEventListener('storage', handleStorage)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    saveNotifications(updated)
  }

  const clearAllNotifs = () => {
    setNotifications([])
    saveNotifications([])
  }

  const removeNotif = (id, e) => {
    if (e) e.stopPropagation()
    const updated = notifications.filter(n => String(n.id) !== String(id))
    setNotifications(updated)
    saveNotifications(updated)
  }

  const handleLogout = async () => {
    const currentPath = window.location.pathname
    const userRole = user?.role || localStorage.getItem('user_role_mode')

    localStorage.removeItem('demo_user')
    localStorage.removeItem('user_role_mode')
    localStorage.removeItem('user_email')
    try { await supabase.auth.signOut() } catch { /* ignore */ }

    // Redirect to specific portal based on section / user role
    if (currentPath.includes('/admin') || currentPath.includes('/models') || userRole === 'admin') {
      window.location.href = '/admin'
    } else if (
      currentPath.includes('/queue') ||
      currentPath.includes('/dashboard') ||
      currentPath.includes('/analytics') ||
      currentPath.includes('/agents') ||
      userRole === 'agent' ||
      userRole === 'manager'
    ) {
      window.location.href = '/agent-login'
    } else {
      window.location.href = '/login'
    }
  }

  const getIcon = (icon) => {
    if (icon === 'ticket') return <Ticket size={14} color="#3b82f6" />
    if (icon === 'check') return <CheckCircle2 size={14} color="#10b981" />
    return <AlertCircle size={14} color="#f59e0b" />
  }

  const handleLogoClick = () => {
    if (activeRole === 'admin') {
      if (location.pathname === '/dashboard') {
        window.location.reload()
      } else {
        navigate('/dashboard')
      }
    } else if (activeRole === 'agent') {
      if (location.pathname === '/tickets') {
        window.location.reload()
      } else {
        navigate('/tickets')
      }
    } else {
      if (location.pathname === '/home') {
        window.location.reload()
      } else {
        navigate('/home')
      }
    }
  }

  return (
    <header className="topbar" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 62, background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)', sticky: 'top', zIndex: 1000
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
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

        {/* Horizontal Navigation Tabs (Desktop) */}
        <nav className="topbar-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 10 }}>
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
        {/* Mobile Hamburger Toggle Button */}
        <button
          className="topbar-mobile-toggle icon-btn"
          title="Toggle Navigation Menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {/* If Customer Panel: Show Language Switch Button instead of Search Bar */}
        {activeRole === 'customer' ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const current = localStorage.getItem('tf_lang') || 'en'
              const next = current === 'hi' ? 'en' : 'hi'
              localStorage.setItem('tf_lang', next)
              window.dispatchEvent(new Event('languageChange'))
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--accent)', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            title="Switch Language (English / हिंदी)"
          >
            🌐 {lang === 'hi' ? '🇮🇳 हिंदी (HI)' : '🇺🇸 English (EN)'}
          </button>
        ) : (
          /* Admin / Agent Portals: Show Search Bar */
          <div className="search-bar" style={{ width: 220 }}>
            <Search className="search-icon" size={14} />
            <input
              id="topbar-search"
              type="text"
              placeholder={placeholder || t('search_placeholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '6px 12px 6px 32px' }}
            />
          </div>
        )}

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
              position: 'absolute', top: 44, right: 0, width: 360, zIndex: 2000,
              background: 'var(--bg-surface)', border: '1px solid var(--border-active)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)', borderRadius: 14, overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Notifications ({notifications.length})
                  {unreadCount > 0 && <span style={{ background: '#ef4444', borderRadius: 10, padding: '1px 6px', fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>{unreadCount} new</span>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>Mark read</button>
                  <button onClick={clearAllNotifs} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Trash2 size={12} /> Clear
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.link) {
                          setShowNotifs(false)
                          navigate(n.link)
                        }
                      }}
                      style={{
                        padding: '12px 14px', borderBottom: '1px solid var(--border)',
                        background: n.read ? 'transparent' : 'rgba(59,130,246,0.06)',
                        display: 'flex', gap: 10, alignItems: 'flex-start', cursor: n.link ? 'pointer' : 'default',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        {getIcon(n.icon)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</span>
                          {n.time && <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0, marginLeft: 6 }}>{n.time}</span>}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.35, wordBreak: 'break-word' }}>{n.text}</div>
                      </div>
                      <button onClick={(e) => removeNotif(n.id, e)} title="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                        <X size={13} />
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

      {/* Mobile Slide-down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer animate-fade">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', borderRadius: 10, fontSize: '0.92rem',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  background: isActive ? 'var(--accent-dim)' : 'var(--bg-input)',
                  border: isActive ? '1px solid rgba(37,99,235,0.3)' : '1px solid var(--border)'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 10, fontSize: '0.92rem',
              fontWeight: 700, color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', width: '100%', marginTop: 8
            }}
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </header>
  )
}
