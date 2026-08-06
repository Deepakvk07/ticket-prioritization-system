import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTickets } from '../services/api'
import { getAgents, removeAgent } from '../services/agents'
import { Headphones, Mail, Layers, UserPlus, Trash2, Calendar } from 'lucide-react'


const DEPT_COLORS = {
  'Database & Infrastructure': { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', icon: '🗄️' },
  'Web & UI/UX': { bg: 'rgba(236,72,153,0.1)', color: '#ec4899', icon: '🎨' },
  'Billing & Integrations': { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: '💳' },
  'API & Security': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: '⚡' },
  'Technical Support': { bg: 'rgba(16,185,129,0.1)', color: '#10b981', icon: '🛠️' },
}

function getDeptStyle(department) {
  return DEPT_COLORS[department] || { bg: 'rgba(100,116,139,0.1)', color: '#64748b', icon: '👤' }
}

export default function SpecialistAgents({ user }) {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [registeredAgents, setRegisteredAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load agents from Supabase
    getAgents()
      .then(agents => setRegisteredAgents(agents))
      .catch(() => setRegisteredAgents([]))
      .finally(() => setLoading(false))

    getTickets()
      .then(res => setTickets(Array.isArray(res) ? res : []))
      .catch(() => setTickets([]))
  }, [])

  const handleRemoveAgent = async (email) => {
    try {
      await removeAgent(email)
      setRegisteredAgents(prev => prev.filter(a => a.email !== email))
    } catch (err) {
      console.error('Failed to remove agent:', err)
    }
  }

  const getAgentTicketCount = (agentEmail, agentName) => {
    return tickets.filter(t =>
      (t.assigned_agent_email && t.assigned_agent_email.toLowerCase() === agentEmail.toLowerCase()) ||
      (t.assigned_agent && agentName && t.assigned_agent.toLowerCase().includes(agentName.toLowerCase()))
    ).length
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search registered agents..." />
        <div className="page-body animate-fade">

          {/* Header */}
          <div className="page-header" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Headphones size={22} color="var(--accent)" /> Agent Management
              </h2>
              <p>All registered support agents and their assigned departments.</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/agent-login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <UserPlus size={15} /> Register New Agent
            </button>
          </div>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Agents', value: registeredAgents.length, color: 'var(--accent)', icon: '👥' },
              { label: 'Online Now', value: registeredAgents.filter(a => a.status === 'Online').length, color: '#10b981', icon: '🟢' },
              { label: 'Departments', value: [...new Set(registeredAgents.map(a => a.department).filter(Boolean))].length, color: '#f59e0b', icon: '🏷️' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '18px 20px', textAlign: 'center', borderRadius: 14 }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Agent Cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading agents...</div>
          ) : registeredAgents.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎧</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No Agents Registered Yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                Agents appear here after they register through the Agent Portal.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/agent-login')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <UserPlus size={15} /> Go to Agent Registration
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {registeredAgents.map(agent => {
                const deptStyle = getDeptStyle(agent.department)
                const ticketCount = getAgentTicketCount(agent.email, agent.name)
                const initials = agent.name.trim().split(/\s+/).map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'AG'
                const joinedDate = agent.registered_at ? new Date(agent.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

                return (
                  <div
                    key={agent.email}
                    className="card"
                    style={{ padding: 20, borderRadius: 16, position: 'relative', overflow: 'hidden' }}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveAgent(agent.email)}
                      title="Remove agent"
                      style={{
                        position: 'absolute', top: 14, right: 14,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                        display: 'flex', alignItems: 'center', transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={15} />
                    </button>

                    {/* Avatar + Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff', fontWeight: 800, fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, position: 'relative'
                      }}>
                        {initials}
                        <span style={{
                          position: 'absolute', bottom: 1, right: 1,
                          width: 10, height: 10, borderRadius: '50%',
                          background: '#10b981', border: '2px solid var(--bg-card)'
                        }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {agent.name}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Mail size={11} /> {agent.email}
                        </div>
                      </div>
                    </div>

                    {/* Department Badge */}
                    <div style={{ marginBottom: 14 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                        background: deptStyle.bg, color: deptStyle.color,
                        border: `1px solid ${deptStyle.color}30`
                      }}>
                        {deptStyle.icon} {agent.department || 'No Department Assigned'}
                      </span>
                    </div>

                    {/* Stats Row */}
                    <div style={{ display: 'flex', gap: 10, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Layers size={12} /> {ticketCount} tickets
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> Joined {joinedDate}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
