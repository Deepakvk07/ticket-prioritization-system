import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTickets, updateTicket } from '../services/api'
import { Filter, ChevronRight, ShieldCheck, Layers, UserCheck, Download } from 'lucide-react'

const priorityClass = { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' }
const statusClass = { Open: 'open', 'In Progress': 'progress', 'On Hold': 'hold', Resolved: 'resolved' }

const PRIORITY_ORDER = { Critical: 1, High: 2, Medium: 3, Low: 4 }

const CATEGORY_TO_DEPARTMENT = {
  'Database & Infrastructure': ['Database & Infrastructure'],
  'Infrastructure': ['Database & Infrastructure'],
  'Server': ['Database & Infrastructure'],
  'DevOps': ['Database & Infrastructure'],

  'Web & UI/UX': ['Web & UI/UX'],
  'Frontend': ['Web & UI/UX'],
  'UI/UX': ['Web & UI/UX'],
  'Design': ['Web & UI/UX'],

  'Billing & Integrations': ['Billing & Integrations'],
  'Billing': ['Billing & Integrations'],
  'Payment': ['Billing & Integrations'],
  'Integrations': ['Billing & Integrations'],

  'API & Security': ['API & Security'],
  'API': ['API & Security'],
  'Security': ['API & Security'],
  'Authentication': ['API & Security'],

  'Technical Support': ['Technical Support'],
  'General': ['Technical Support'],
  'Other': ['Technical Support'],
}

function getTicketDepartment(ticket) {
  const cat = (ticket.category || ticket.product_module || '').trim()
  if (CATEGORY_TO_DEPARTMENT[cat]) {
    return CATEGORY_TO_DEPARTMENT[cat]
  }

  const text = `${cat} ${ticket.subject || ''}`.toLowerCase()
  if (/database|sql|infra|server|devops|deployment|kubernetes|docker|cloud|aws|hosting/i.test(text)) return ['Database & Infrastructure']
  if (/ui|ux|frontend|css|html|web|design|layout|display|responsive|mobile|dark mode|theme/i.test(text)) return ['Web & UI/UX']
  if (/billing|payment|invoice|subscription|refund|charge|pricing|plan|cancellation/i.test(text)) return ['Billing & Integrations']
  if (/api|security|auth|token|oauth|ssl|certificate|encryption|endpoint|webhook|cors/i.test(text)) return ['API & Security']

  return ['Technical Support']
}

function getRegisteredAgentsFromStorage() {
  try {
    const raw = localStorage.getItem('registered_agents')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(item => {
      if (typeof item === 'string') {
        return { name: item, email: `${item.toLowerCase().replace(/\s+/g, '.')}@omnisupport.ai`, department: 'Technical Support' }
      }
      if (item && typeof item === 'object') {
        return {
          name: item.name || (item.email ? item.email.split('@')[0] : 'Support Specialist'),
          email: item.email || `agent_${Math.random().toString(36).substring(2, 7)}@omnisupport.ai`,
          department: item.department || 'Technical Support'
        }
      }
      return null
    }).filter(Boolean)
  } catch {
    return []
  }
}

export default function TicketQueue({ user }) {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [registeredAgents, setRegisteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const demoUser = (() => {
    try { return JSON.parse(localStorage.getItem('demo_user') || '{}') } catch { return {} }
  })()
  const activeRole = demoUser.role || localStorage.getItem('user_role_mode') || 'customer'
  const isAgent = activeRole === 'agent'
  const isAdmin = activeRole === 'admin'
  const agentDepartment = demoUser.department || ''

  useEffect(() => {
    setRegisteredAgents(getRegisteredAgentsFromStorage())

    getTickets()
      .then(res => setTickets(Array.isArray(res) ? res : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAssignAgent = async (ticketId, agentObj) => {
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
    } catch {}
  }

  // Filter tickets by agent linkage / department + filters
  const filtered = tickets.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false
    if (priorityFilter && t.priority !== priorityFilter) return false

    // If logged in as an Agent, only show tickets assigned specifically to them OR matching their department
    if (isAgent) {
      const isDirectlyAssigned = (t.assigned_agent && t.assigned_agent.toLowerCase().includes(demoUser.name?.toLowerCase() || '___')) ||
                                 (t.assigned_agent_email && t.assigned_agent_email === demoUser.email)
      const ticketDepts = getTicketDepartment(t)
      const isDeptMatch = agentDepartment && ticketDepts.includes(agentDepartment)

      if (!isDirectlyAssigned && !isDeptMatch) return false
    }

    return true
  })

  // Sort strictly by Priority Order (Critical -> High -> Medium -> Low), then score
  const sorted = [...filtered].sort((a, b) => {
    const pA = PRIORITY_ORDER[a.priority] || 5
    const pB = PRIORITY_ORDER[b.priority] || 5
    if (pA !== pB) return pA - pB
    const sA = a.score || 0
    const sB = b.score || 0
    return sB - sA
  })

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search tickets in queue..." />
        <div className="page-body animate-fade">
          <div className="page-header" style={{ marginBottom: 20 }}>
            <h2>AI-Ranked Ticket Queue</h2>
            <p>Tickets sorted in strict priority order (Critical → High → Medium → Low) with Admin-to-Agent assignment linkage.</p>
          </div>

          {/* Agent Specialist Banner */}
          {isAgent && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px', marginBottom: 20, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheck size={18} color="#ffffff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Assigned Workspace: {demoUser.name || 'Support Specialist'} {agentDepartment ? `(${agentDepartment})` : ''}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Showing tickets linked specifically to you or routed to your specialist category.
                </div>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8,
                background: 'rgba(16,185,129,0.12)', color: '#059669',
                fontSize: '0.78rem', fontWeight: 700,
              }}>
                <Layers size={13} /> {sorted.length} active
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-select"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              className="form-select"
              style={{ width: 160 }}
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (!sorted || sorted.length === 0) {
                    alert('No tickets available to export.')
                    return
                  }
                  const headers = ['Ticket ID', 'Subject', 'Category', 'Priority', 'AI Score', 'Status', 'Assigned Agent', 'Customer Name', 'Customer Email', 'Created Date']
                  const csvRows = [
                    headers.join(','),
                    ...sorted.map(t => [
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
                  link.setAttribute('download', `ticketflow_export_${new Date().toISOString().slice(0, 10)}.csv`)
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Export CSV
              </button>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing {sorted.length} of {tickets.length} tickets
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Priority Level</th>
                    <th>Score</th>
                    <th>Ticket</th>
                    <th>Category</th>
                    <th>Assigned Agent</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📭</div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>No tickets in your workspace queue</div>
                        <div style={{ fontSize: '0.82rem' }}>
                          {isAgent
                            ? 'No tickets currently assigned to you or matching your department.'
                            : 'No tickets match the current filters.'}
                        </div>
                      </td>
                    </tr>
                  )}
                  {sorted.map(t => {
                    const assignedAgent = t.assigned_agent || ''
                    // Filter ONLY agents registered by the user
                    const categoryAgents = registeredAgents.filter(agent => {
                      const cat = (t.category || t.product_module || '').toLowerCase()
                      const dept = (agent.department || '').toLowerCase()
                      if (cat.includes('database') || cat.includes('infra')) return dept.includes('database')
                      if (cat.includes('web') || cat.includes('ui') || cat.includes('ux') || cat.includes('frontend')) return dept.includes('web')
                      if (cat.includes('billing') || cat.includes('payment') || cat.includes('integration')) return dept.includes('billing')
                      if (cat.includes('api') || cat.includes('security')) return dept.includes('api')
                      if (cat.includes('support') || cat.includes('technical')) return dept.includes('support')
                      return dept === cat || dept.includes(cat) || cat.includes(dept)
                    })

                    const optionsToDisplay = categoryAgents.length > 0 ? categoryAgents : registeredAgents

                    return (
                      <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} style={{ cursor: 'pointer' }}>
                        <td>
                          <span className={`badge badge-${priorityClass[t.priority] || 'low'}`} style={{ fontWeight: 800 }}>
                            ● {t.priority}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: t.score > 85 ? 'var(--critical)' : t.score > 60 ? 'var(--high)' : 'var(--text-secondary)'
                          }}>
                            {t.score || 50}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.subject}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{t.id} · {t.customer_name}</div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{t.category}</td>

                        {/* Assigned Agent Selector / Badge */}
                        <td onClick={(e) => e.stopPropagation()}>
                          {isAdmin ? (
                            <select
                              className="form-select"
                              style={{
                                fontSize: '0.78rem',
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: assignedAgent ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
                                background: assignedAgent ? 'rgba(16,185,129,0.08)' : 'var(--bg-input)',
                                color: assignedAgent ? '#059669' : 'var(--text-primary)',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              value={assignedAgent}
                              onChange={(e) => {
                                const selected = registeredAgents.find(a => a.name === e.target.value)
                                if (selected) {
                                  handleAssignAgent(t.id, selected)
                                }
                              }}
                            >
                              <option value="">
                                {registeredAgents.length === 0 ? '⚠️ No agents registered yet' : '👤 Unassigned'}
                              </option>
                              {optionsToDisplay.map(agent => (
                                <option key={agent.email} value={agent.name}>
                                  {agent.name} ({agent.department})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 8px', borderRadius: 6,
                              fontSize: '0.74rem', fontWeight: 600,
                              background: assignedAgent ? 'rgba(16,185,129,0.1)' : 'var(--bg-card-hover)',
                              color: assignedAgent ? '#059669' : 'var(--text-muted)',
                              border: assignedAgent ? '1px solid rgba(16,185,129,0.2)' : 'none',
                            }}>
                              <UserCheck size={12} /> {assignedAgent || 'Unassigned'}
                            </span>
                          )}
                        </td>

                        <td>
                          <span className={`badge badge-${statusClass[t.status] || 'open'}`}>
                            ● {t.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Today'}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm">View <ChevronRight size={14} /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
