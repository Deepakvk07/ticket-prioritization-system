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

  let rawName = isAdmin ? 'Administrator' : (demoUser?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User')
  if (rawName.toLowerCase() === 'customer' && isAdmin) rawName = 'Administrator'
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

          {/* Welcome Banner Card */}
          <div className="card" style={{
            background: isAdmin
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
              : 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
            border: `1px solid ${isAdmin ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
            borderRadius: 18,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 24, padding: '28px 32px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)'
          }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px',
                borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: 12,
                background: 'rgba(255,255,255,0.12)', color: '#ffffff', backdropFilter: 'blur(4px)',
                letterSpacing: '0.04em'
              }}>
                {isAdmin ? <ShieldCheck size={14} color="#60a5fa" /> : <UserCheck size={14} color="#34d399" />}
                {isAdmin ? 'ADMINISTRATOR CONTROL PANEL' : 'SUPPORT WORKSPACE'}
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {greetingText}, {greetingName} 👋
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 580, lineHeight: 1.6, fontSize: '0.92rem', margin: 0 }}>
                {isAdmin
                  ? 'Overview of AI priority classification, specialist agent routing, and SLA queue health.'
                  : 'Welcome to your support portal. Track active assigned tickets and SLA resolution progress.'}
              </p>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/tickets/new')}
              style={{
                background: isAdmin ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#10b981',
                padding: '12px 24px', borderRadius: 12, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
              }}
            >
              <Plus size={18} /> {isAdmin ? t('create_internal_ticket') : t('create_ticket')}
            </button>
          </div>

          {/* Toast Notification */}
          {assignmentSuccess && (
            <div style={{
              padding: '12px 18px', borderRadius: 10, background: '#f0fdf4',
              color: '#16a34a', border: '1px solid #bbf7d0', marginBottom: 24,
              fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <Check size={16} /> {assignmentSuccess}
            </div>
          )}

          {/* KPI Summary Cards Grid */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            <div className="card" style={{ padding: 22, borderRadius: 16, background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>SYSTEM TOTAL TICKETS</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{stats.total}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>Total tickets processed</div>
            </div>

            <div className="card" style={{ padding: 22, borderRadius: 16, background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #ef4444', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', marginBottom: 8, letterSpacing: '0.05em' }}>OPEN QUEUE</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>{stats.open}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>Awaiting agent assignment</div>
            </div>

            <div className="card" style={{ padding: 22, borderRadius: 16, background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', marginBottom: 8, letterSpacing: '0.05em' }}>IN PROGRESS</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#d97706', lineHeight: 1 }}>{stats.inProgress}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>Assigned to specialists</div>
            </div>

            <div className="card" style={{ padding: 22, borderRadius: 16, background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', marginBottom: 8, letterSpacing: '0.05em' }}>RESOLVED RATE</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100}%
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>SLA resolution efficiency</div>
            </div>
          </div>

          {/* Structured Workstream Portal Card */}
          <div className="card" style={{
            padding: '24px 28px', marginBottom: 28, borderRadius: 16,
            background: '#ffffff', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ maxWidth: 640 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Ticket size={16} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    AI Priority Ordered Ticket Stream
                  </h3>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                  Incoming tickets are automatically analyzed by NLP, assigned an AI urgency score (Critical → High → Medium → Low), and mapped to specialist agents. Manage your active queue in the dedicated workspace.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10 }}
                >
                  <Download size={15} /> Export CSV
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/tickets')}
                  style={{
                    padding: '11px 22px', fontSize: '0.88rem', fontWeight: 800,
                    borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', flexShrink: 0
                  }}
                >
                  <span>Open Ticket Queue Workspace</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Registered Agents by Category Section */}
          {isAdmin && (
            <div style={{ marginBottom: 28 }}>
              <div className="section-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="section-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Headphones size={18} color="#2563eb" /> Registered Specialist Roster
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: 10, fontWeight: 500 }}>
                    ({registeredAgents.length} active registered agents)
                  </span>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate('/agent-login')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, fontWeight: 600 }}
                >
                  <UserPlus size={14} /> Register New Agent
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                {CATEGORIES_LIST.map(catItem => {
                  const catAgents = registeredAgents.filter(a => (a.department || '').toLowerCase() === catItem.name.toLowerCase())

                  return (
                    <div
                      key={catItem.name}
                      className="card"
                      style={{
                        padding: 20,
                        borderRadius: 14,
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: '1.5rem' }}>{catItem.icon}</span>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 12,
                          background: catAgents.length > 0 ? 'rgba(37,99,235,0.08)' : '#f1f5f9',
                          color: catAgents.length > 0 ? '#2563eb' : '#94a3b8'
                        }}>
                          {catAgents.length} agent{catAgents.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {catItem.name}
                      </div>

                      {catAgents.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                          {catAgents.map(ag => (
                            <div key={ag.email} style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <UserCheck size={13} color="#059669" /> {ag.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 10 }}>
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
