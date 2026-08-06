import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, BarChart2, Cpu,
  LogOut, Plus, Zap, Home, Search, BookOpen, User, Clock, Headphones, ChevronDown, ChevronUp, Layers
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const ADMIN_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets', icon: Ticket, label: 'Ticket Queue (Admin)' },
  { to: '/agents', icon: Headphones, label: 'Agent Management' },
  { to: '/history', icon: Clock, label: 'Ticket History' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/model', icon: Cpu, label: 'Model Management' },
]

const AGENT_NAV = [
  { to: '/tickets', icon: Ticket, label: 'Assigned Tickets' },
  { to: '/history', icon: Clock, label: 'Ticket History' },
]

const CUSTOMER_NAV = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/tickets', icon: Ticket, label: 'My Tickets' },
  { to: '/track', icon: Search, label: 'Track Ticket' },
  { to: '/faq', icon: BookOpen, label: 'FAQ / Help' },
]


function getSafeDemoUser() {
  try {
    const val = localStorage.getItem('demo_user')
    if (!val || val === 'undefined' || val === 'null') return null
    return JSON.parse(val)
  } catch {
    return null
  }
}

export default function Sidebar({ user }) {
  const navigate = useNavigate()
  const [showRoster, setShowRoster] = useState(true)

  // Determine current active mode cleanly from logged in user profile
  const demoUser = getSafeDemoUser()
  const activeRole = demoUser?.role || localStorage.getItem('user_role_mode') || 'customer'

  const isAdmin = activeRole === 'admin'
  const isAgent = activeRole === 'agent'
  const isCustomer = activeRole === 'customer'

  const navItems = isAdmin ? ADMIN_NAV : isAgent ? AGENT_NAV : CUSTOMER_NAV

  const handleSignOut = async () => {
    localStorage.removeItem('demo_user')
    await supabase.auth.signOut()
    navigate('/login')
  }

  const rawName = demoUser?.name || user?.user_metadata?.full_name || (typeof user?.email === 'string' ? user.email.split('@')[0] : '') || (isAdmin ? 'Admin' : isAgent ? 'Support Agent' : 'Customer')
  const name = String(rawName)
  const initials = name.trim().split(/\s+/).map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'US'

  const themeGradient = isAdmin
    ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
    : isAgent
      ? 'linear-gradient(135deg, #10b981, #059669)'
      : 'linear-gradient(135deg, #f59e0b, #ec4899)'

  const roleTitle = isAdmin
    ? '🛡️ ADMIN PORTAL'
    : isAgent
      ? '🎧 AGENT WORKSPACE'
      : '👤 CUSTOMER PORTAL'

  const roleColor = isAdmin ? 'var(--accent)' : isAgent ? '#10b981' : 'var(--success)'

  return (
    <aside className="sidebar">
      {/* Logo & Mode Banner */}
      <div className="sidebar-logo">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/ticketflow_logo.jpg" alt="TicketFlow AI" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
          TicketFlow AI
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div className="tier-badge" style={{ color: roleColor, fontWeight: 700 }}>
            {roleTitle}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" style={{ marginTop: 12 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <button className="nav-item" style={{ width: '100%' }} onClick={handleSignOut}>
          <LogOut size={17} />
          Sign Out
        </button>

        <div className="sidebar-user">
          <div className="avatar" style={{ background: themeGradient }}>
            {initials}
            <span className="online-dot" />
          </div>
            <div className="user-info">
            <div className="name" style={{ fontSize: '0.78rem' }}>{name}</div>
            <div className="role" style={{ color: roleColor }}>
              {isAdmin ? 'ADMIN / TRIAGE ENGINE' : isAgent ? (demoUser?.department ? demoUser.department.toUpperCase() : 'SUPPORT AGENT') : 'CUSTOMER USER'}
            </div>
          </div>
        </div>

        {isAdmin && (
          <button className="new-ticket-btn" onClick={() => navigate('/tickets/new')} style={{ background: 'var(--accent)' }}>
            <Plus size={15} />
            New Internal Ticket
          </button>
        )}
      </div>
    </aside>
  )
}
