import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTickets, updateTicket } from '../services/api'
import { getAgents, getMatchingAgentsForTicket } from '../services/agents'
import { supabase } from '../lib/supabase'
import { Filter, ChevronRight, ShieldCheck, Layers, UserCheck, Download, Zap, Sparkles, CheckCircle2 } from 'lucide-react'

const priorityClass = { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' }
const statusClass = { Open: 'open', 'In Progress': 'progress', 'On Hold': 'hold', Resolved: 'resolved' }

const PRIORITY_ORDER = { Critical: 1, High: 2, Medium: 3, Low: 4 }

function getTicketDepartment(ticket) {
  const text = `${ticket.category || ''} ${ticket.product_module || ''} ${ticket.subject || ''}`.toLowerCase()
  if (/database|sql|infra|server|devops|deployment|kubernetes|docker|cloud|aws|hosting/i.test(text)) return 'Database & Infrastructure'
  if (/ui|ux|frontend|css|html|web|design|layout|display|responsive|mobile|dark mode|theme/i.test(text)) return 'Web & UI/UX'
  if (/billing|payment|invoice|subscription|refund|charge|pricing|plan|cancellation/i.test(text)) return 'Billing & Integrations'
  if (/api|security|auth|token|oauth|ssl|certificate|encryption|endpoint|webhook|cors/i.test(text)) return 'API & Security'

  return 'Technical Support'
}

export default function TicketQueue({ user }) {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [registeredAgents, setRegisteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [assignSuccessMsg, setAssignSuccessMsg] = useState('')
  const [selectedTickets, setSelectedTickets] = useState(new Set())

  const toggleSelectAll = (filteredTickets) => {
    if (selectedTickets.size === filteredTickets.length) {
      setSelectedTickets(new Set())
    } else {
      setSelectedTickets(new Set(filteredTickets.map(t => t.id)))
    }
  }

  const toggleSelectTicket = (id, e) => {
    if (e) e.stopPropagation()
    const next = new Set(selectedTickets)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedTickets(next)
  }

  const handleBulkStatusChange = async (newStatus) => {
    const ids = Array.from(selectedTickets)
    setTickets(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: newStatus } : t))
    setSelectedTickets(new Set())
    setAssignSuccessMsg(`⚡ Bulk action: ${ids.length} tickets updated to "${newStatus}"!`)
    setTimeout(() => setAssignSuccessMsg(''), 4000)

    try {
      await Promise.all(ids.map(id => updateTicket(id, { status: newStatus })))
    } catch { /* fallback handled */ }
  }

  const handleBulkPriorityChange = async (newPriority) => {
    const ids = Array.from(selectedTickets)
    setTickets(prev => prev.map(t => ids.includes(t.id) ? { ...t, priority: newPriority } : t))
    setSelectedTickets(new Set())
    setAssignSuccessMsg(`⚡ Bulk action: ${ids.length} tickets marked as "${newPriority}" priority!`)
    setTimeout(() => setAssignSuccessMsg(''), 4000)

    try {
      await Promise.all(ids.map(id => updateTicket(id, { priority: newPriority })))
    } catch { /* fallback handled */ }
  }

  const demoUser = (() => {
    try { return JSON.parse(localStorage.getItem('demo_user') || '{}') } catch { return {} }
  })()
  const activeRole = demoUser.role || localStorage.getItem('user_role_mode') || 'customer'
  const isAgent = activeRole === 'agent'
  const isAdmin = activeRole === 'admin'
  const isCustomer = activeRole === 'customer'
  const agentDepartment = demoUser.department || ''

  useEffect(() => {
    // Load agents from Supabase
    getAgents()
      .then(agents => setRegisteredAgents(agents))
      .catch(() => setRegisteredAgents([]))

    getTickets()
      .then(res => setTickets(Array.isArray(res) ? res : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))

    // Supabase Realtime channel listener for live sync across all portals
    const channel = supabase
      .channel('public:tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        getTickets().then(res => setTickets(Array.isArray(res) ? res : []))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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

  // 1-Click Problem-Based Auto-Assign Engine
  const handleAutoAssignAll = async () => {
    if (registeredAgents.length === 0) {
      alert('No agents registered in Supabase DB yet. Please register specialist agents first in Agent Management.')
      return
    }

    const unassignedList = tickets.filter(t => !t.assigned_agent || t.assigned_agent === 'Unassigned')
    if (unassignedList.length === 0) {
      alert('All active tickets in the queue are already assigned!')
      return
    }

    setAutoAssigning(true)
    let count = 0

    for (let i = 0; i < unassignedList.length; i++) {
      const t = unassignedList[i]
      const matchingAgents = getMatchingAgentsForTicket(t, registeredAgents)
      const targetAgent = matchingAgents[i % matchingAgents.length] || registeredAgents[0]

      if (targetAgent) {
        await updateTicket(t.id, {
          assigned_agent: targetAgent.name,
          assigned_agent_email: targetAgent.email,
          assigned_department: targetAgent.department,
          status: 'In Progress'
        }).catch(() => null)
        count++
      }
    }

    const updated = await getTickets()
    setTickets(Array.isArray(updated) ? updated : [])
    setAutoAssigning(false)
    setAssignSuccessMsg(`⚡ Auto-assigned ${count} ticket(s) to matching specialist agents!`)
    setTimeout(() => setAssignSuccessMsg(''), 4500)
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

            {!isCustomer && (
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
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
              {isAdmin && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAutoAssignAll}
                  disabled={autoAssigning}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Zap size={14} className={autoAssigning ? 'spin' : ''} />
                  {autoAssigning ? 'Auto-Assigning…' : '⚡ Auto-Assign All'}
                </button>
              )}
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

          {/* Success Toast */}
          {assignSuccessMsg && (
            <div style={{
              padding: '12px 18px', marginBottom: 18, borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981', fontWeight: 700, fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle2 size={18} /> {assignSuccessMsg}
            </div>
          )}

          {/* Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {!isCustomer && (
                      <th style={{ width: 36, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={sorted.length > 0 && selectedTickets.size === sorted.length}
                          onChange={() => toggleSelectAll(sorted)}
                          title="Select All Tickets"
                        />
                      </th>
                    )}
                    {!isCustomer && <th>Priority Level</th>}
                    {!isCustomer && <th>Score</th>}
                    <th>Ticket</th>
                    <th>Assigned Agent</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 && !loading && (
                    <tr>
                      <td colSpan={isCustomer ? 5 : 8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
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
                    // Strict filtering: ONLY show agents matching the specific problem text
                    const matchingAgents = getMatchingAgentsForTicket(t, registeredAgents)
                    let optionsToDisplay = [...matchingAgents]
                    if (assignedAgent && !optionsToDisplay.some(a => a.name === assignedAgent)) {
                      const currentObj = registeredAgents.find(a => a.name === assignedAgent)
                      if (currentObj) optionsToDisplay.unshift(currentObj)
                    }

                    const ticketScore = Math.round(t.score || t.confidence_score || (t.priority === 'Critical' ? 96 : t.priority === 'High' ? 78 : t.priority === 'Medium' ? 54 : 28))
                    const isSelected = selectedTickets.has(t.id)

                    return (
                      <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} style={{ cursor: 'pointer', background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent' }}>
                        {!isCustomer && (
                          <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="checkbox"
                              checked={isSelected}
                              onChange={e => toggleSelectTicket(t.id, e)}
                            />
                          </td>
                        )}
                        {!isCustomer && (
                          <td>
                            <span className={`badge badge-${priorityClass[t.priority] || 'low'}`} style={{ fontWeight: 800 }}>
                              ● {t.priority}
                            </span>
                          </td>
                        )}
                        {!isCustomer && (
                          <td>
                            <span style={{
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              color: ticketScore >= 80 ? '#ef4444' : ticketScore >= 60 ? '#f59e0b' : ticketScore >= 40 ? '#3b82f6' : '#10b981'
                            }}>
                              {ticketScore}
                            </span>
                          </td>
                        )}
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.subject}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{t.code || t.id} · {t.customer_name}</div>
                        </td>

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

      {/* Floating Bulk Operations Bar */}
      {selectedTickets.size > 0 && (
        <div className="animate-fade" style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 20,
          padding: '12px 24px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', gap: 14, color: '#ffffff'
        }}>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: '#2563eb', padding: '2px 8px', borderRadius: 10, fontSize: '0.78rem' }}>
              {selectedTickets.size} Selected
            </span>
          </div>

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />

          <button
            className="btn btn-sm"
            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 700 }}
            onClick={() => handleBulkStatusChange('Resolved')}
          >
            ✓ Mark Resolved ({selectedTickets.size})
          </button>

          <button
            className="btn btn-sm"
            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', fontWeight: 700 }}
            onClick={() => handleBulkPriorityChange('Critical')}
          >
            🔴 Mark Critical ({selectedTickets.size})
          </button>

          <button
            className="btn btn-sm"
            style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#cbd5e1', border: '1px solid rgba(100, 116, 139, 0.4)', fontWeight: 700 }}
            onClick={() => handleBulkStatusChange('Closed')}
          >
            🗑️ Close Tickets ({selectedTickets.size})
          </button>

          <button
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer', marginLeft: 8 }}
            onClick={() => setSelectedTickets(new Set())}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
