import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, CheckCircle, Clock, Plus, Filter, Download, ChevronRight, Sparkles, ArrowRight, ShieldCheck, UserCheck, UserPlus, User, Check, Layers, Headphones } from 'lucide-react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTickets, updateTicket, getSynchronizedPriorityAndScore } from '../services/api'
import { getAgents, getMatchingAgentsForTicket } from '../services/agents'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTranslation } from '../lib/i18n'

const statusClass = { Open: 'open', 'In Progress': 'progress', 'On Hold': 'hold', Resolved: 'resolved' }
const priorityClass = { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' }

const PRIORITY_ORDER = { Critical: 1, High: 2, Medium: 3, Low: 4 }

const CATEGORIES_LIST = [
  { name: 'Database & Infrastructure', icon: '🗄️' },
  { name: 'Web & UI/UX', icon: '🎨' },
  { name: 'Billing & Integrations', icon: '💳' },
  { name: 'API & Security', icon: '⚡' },
  { name: 'Technical Support', icon: '🛠️' },
]


function getAgentsForCategory(ticketCategory, registeredAgents) {
  const cat = (ticketCategory || '').toLowerCase()

  const matched = registeredAgents.filter(agent => {
    const dept = (agent.department || '').toLowerCase()
    if (cat.includes('database') || cat.includes('infra') || cat.includes('server')) return dept.includes('database')
    if (cat.includes('web') || cat.includes('ui') || cat.includes('ux') || cat.includes('frontend')) return dept.includes('web')
    if (cat.includes('billing') || cat.includes('payment') || cat.includes('integration')) return dept.includes('billing')
    if (cat.includes('api') || cat.includes('security') || cat.includes('auth')) return dept.includes('api')
    if (cat.includes('support') || cat.includes('technical')) return dept.includes('support')
    return dept === cat || dept.includes(cat) || cat.includes(dept)
  })

  return matched.length > 0 ? matched : registeredAgents
}


export default function Dashboard({ user }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [registeredAgents, setRegisteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)
  const [assignmentSuccess, setAssignmentSuccess] = useState('')

  const demoUser = localStorage.getItem('demo_user') ? JSON.parse(localStorage.getItem('demo_user')) : null
  const activeRole = demoUser?.role || localStorage.getItem('user_role_mode') || 'customer'
  const isAdmin = activeRole === 'admin'

  useEffect(() => {
    getAgents().then(setRegisteredAgents).catch(() => setRegisteredAgents([]))
    getTickets()
      .then(res => setTickets(Array.isArray(res) ? res : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [])

  const sortedTickets = [...tickets].sort((a, b) => {
    const pA = PRIORITY_ORDER[a.priority] || 99
    const pB = PRIORITY_ORDER[b.priority] || 99
    if (pA !== pB) return pA - pB
    return (b.score || b.confidence_score || 0) - (a.score || a.confidence_score || 0)
  })

  const handleAssignAgent = async (ticketId, agentObj) => {
    setAssigningId(ticketId)
    try {
      await updateTicket(ticketId, {
        assigned_agent: agentObj.name,
        assigned_agent_email: agentObj.email,
        assigned_department: agentObj.department,
        status: 'In Progress'
      }).catch(() => null)

      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            assigned_agent: agentObj.name,
            assigned_agent_email: agentObj.email,
            assigned_department: agentObj.department,
            status: 'In Progress'
          }
        }
        return t
      }))

      setAssignmentSuccess(`Ticket assigned to ${agentObj.name} (${agentObj.department})`)
      setTimeout(() => setAssignmentSuccess(''), 3500)
    } finally {
      setAssigningId(null)
    }
  }

  const stats = {
    total: sortedTickets.length,
    open: sortedTickets.filter(t => t.status === 'Open').length,
    resolved: sortedTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length,
    inProgress: sortedTickets.filter(t => t.status === 'In Progress').length
  }

  let rawName = demoUser?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Administrator'
  if (rawName.includes('(')) rawName = rawName.split('(')[0].trim()
  const greetingName = rawName || 'Administrator'

  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? 'good_morning' : hour < 17 ? 'good_afternoon' : 'good_evening'
  const greetingText = t(greetingKey)

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder={t('search_placeholder')} />
        <div className="page-body animate-fade">

          {/* Welcome Banner */}
          <div className="card" style={{
            background: isAdmin
              ? 'linear-gradient(135deg, #0f1f3d 0%, #1a2f54 100%)'
              : 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
            border: `1px solid ${isAdmin ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 24, padding: '28px 32px'
          }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: 10,
                background: 'rgba(255,255,255,0.15)', color: 'white'
              }}>
                {isAdmin ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
                {isAdmin ? t('admin_portal').toUpperCase() : t('customer_portal').toUpperCase()}
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
                {greetingText}, {greetingName}.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 540, lineHeight: 1.6, fontSize: '0.92rem' }}>
                {isAdmin
                  ? 'Welcome back to your TicketFlow AI Admin Dashboard. Review AI priority predictions, link tickets to registered agents, and monitor queue SLA.'
                  : 'Welcome to your customer portal. Submit new support tickets and track real-time resolution progress.'}
              </p>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/tickets/new')}
              style={{ background: isAdmin ? 'var(--accent)' : '#10b981' }}
            >
              <Plus size={18} /> {isAdmin ? t('create_internal_ticket') : t('create_ticket')}
            </button>
          </div>

          {/* Toast Notification */}
          {assignmentSuccess && (
            <div style={{
              padding: '12px 18px', borderRadius: 10, background: '#f0fdf4',
              color: '#16a34a', border: '1px solid #bbf7d0', marginBottom: 20,
              fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <Check size={16} /> {assignmentSuccess}
            </div>
          )}

          {/* Essential KPI Summary Bar */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 20, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{t('total_tickets').toUpperCase()}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.total}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>System total</div>
            </div>

            <div className="card" style={{ padding: 20, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>OPEN TICKETS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--critical)' }}>{stats.open}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Awaiting assignment</div>
            </div>

            <div className="card" style={{ padding: 20, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>IN PROGRESS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{stats.inProgress}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Assigned to agents</div>
            </div>

            <div className="card" style={{ padding: 20, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>RESOLVED RATE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Resolution efficiency</div>
            </div>
          </div>

          {/* Executive Live Queue Summary & Workstream Portal Card */}
          <div className="card" style={{ padding: '28px 32px', marginBottom: 28, background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Ticket size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    AI Priority Ordered Ticket Stream
                  </h3>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                  Real-time NLP Triage, SLA Enforcement & Specialist Agent Routing Workspace
                </p>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (!sortedTickets || sortedTickets.length === 0) {
                    alert('No tickets available to export.')
                    return
                  }
                  const headers = ['Ticket ID', 'Subject', 'Category', 'Priority', 'AI Score', 'Status', 'Assigned Agent', 'Customer Name', 'Customer Email', 'Created Date']
                  const csvRows = [
                    headers.join(','),
                    ...sortedTickets.map(t => [
                      `"${t.code || t.id || ''}"`,
                      `"${(t.subject || '').replace(/"/g, '""')}"`,
                      `"${(t.category || t.product_module || '').replace(/"/g, '""')}"`,
                      `"${t.priority || ''}"`,
                      `"${t.score || t.confidence_score || 50}"`,
                      `"${t.status || ''}"`,
                      `"${(t.assigned_agent || 'Unassigned').replace(/"/g, '""')}"`,
                      `"${(t.customer_name || '').replace(/"/g, '""')}"`,
                      `"${(t.customer_email || '').replace(/"/g, '""')}"`,
                      `"${t.created_at ? new Date(t.created_at).toLocaleString() : ''}"`
                    ].join(','))
                  ]
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.setAttribute('download', `ticketflow_admin_export_${new Date().toISOString().slice(0, 10)}.csv`)
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> {t('export_csv')}
              </button>
            </div>

            {/* Live Queue Health Breakdown Pill Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🔴 Critical Priority
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#991b1b', marginTop: 4 }}>
                  {sortedTickets.filter(t => t.priority === 'Critical').length} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Tickets</span>
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🟠 High Priority
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b45309', marginTop: 4 }}>
                  {sortedTickets.filter(t => t.priority === 'High').length} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Tickets</span>
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🔵 Medium Priority
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1d4ed8', marginTop: 4 }}>
                  {sortedTickets.filter(t => t.priority === 'Medium').length} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Tickets</span>
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🟢 Low Priority
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: 4 }}>
                  {sortedTickets.filter(t => t.priority === 'Low').length} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Tickets</span>
                </div>
              </div>
            </div>

            {/* Description & Action Callout */}
            <div style={{ background: '#f1f5f9', padding: '18px 24px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ maxWidth: 620 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  📋 Dedicated Ticket Queue Workspace
                </div>
                <div style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                  All incoming tickets are automatically processed by the AI Triage Engine, prioritized by urgency score, and routed to domain specialists. Open the full Ticket Queue workspace to manage active tickets, perform 1-click auto-assignments, or reassign support agents.
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => navigate('/tickets')}
                style={{
                  padding: '12px 24px', fontSize: '0.92rem', fontWeight: 800,
                  borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)', flexShrink: 0
                }}
              >
                <span>View Full Ticket Queue Workspace</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Registered Agents by Category View Section */}
          {isAdmin && (
            <div style={{ marginBottom: 28 }}>
              <div className="section-header" style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="section-title" style={{ fontSize: '1.1rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Headphones size={18} color="#2563eb" /> Registered Agent Roster by Category
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 10 }}>
                    ({registeredAgents.length} registered agents)
                  </span>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate('/agent-login')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <UserPlus size={14} /> Register New Agent
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                {CATEGORIES_LIST.map(catItem => {
                  // Filter agents belonging to this category
                  const catAgents = registeredAgents.filter(a => (a.department || '').toLowerCase() === catItem.name.toLowerCase())

                  return (
                    <div
                      key={catItem.name}
                      className="card"
                      style={{
                        padding: 18,
                        borderRadius: 14,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: '1.4rem' }}>{catItem.icon}</span>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: catAgents.length > 0 ? 'rgba(37,99,235,0.1)' : 'var(--bg-input)',
                          color: catAgents.length > 0 ? '#2563eb' : 'var(--text-muted)'
                        }}>
                          {catAgents.length} agent{catAgents.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {catItem.name}
                      </div>

                      {catAgents.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                          {catAgents.map(ag => (
                            <div key={ag.email} style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <UserCheck size={12} color="#059669" /> {ag.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 8 }}>
                          No agent registered
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
