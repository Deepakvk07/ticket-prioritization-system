import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTickets, updateTicket, getSynchronizedPriorityAndScore } from '../services/api'
import { getAgents, getMatchingAgentsForTicket, getDirectMessages, sendDirectMessage } from '../services/agents'
import { supabase } from '../lib/supabase'
import { Filter, ChevronRight, ShieldCheck, Layers, UserCheck, Download, Zap, Sparkles, CheckCircle2, MessageSquare, Send, X, RefreshCw, Paperclip } from 'lucide-react'

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

  const demoUser = (() => {
    try { return JSON.parse(localStorage.getItem('demo_user') || '{}') } catch { return {} }
  })()
  const activeRole = demoUser.role || localStorage.getItem('user_role_mode') || 'customer'
  const isAgent = activeRole === 'agent'
  const isAdmin = activeRole === 'admin'
  const isCustomer = activeRole === 'customer'
  const agentDepartment = demoUser.department || ''

  const agentEmail = (demoUser.email || user?.email || 'agent@ticketflow.ai').toLowerCase()
  const agentName = demoUser.name || user?.user_metadata?.full_name || 'Support Agent'

  const [tickets, setTickets] = useState([])
  const [registeredAgents, setRegisteredAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [assignSuccessMsg, setAssignSuccessMsg] = useState('')
  const [selectedTickets, setSelectedTickets] = useState(new Set())

  // Agent Direct Admin Chat State
  const [showAdminChatModal, setShowAdminChatModal] = useState(false)
  const [agentChatMsgs, setAgentChatMsgs] = useState([])
  const [agentInputText, setAgentInputText] = useState('')
  const [agentSending, setAgentSending] = useState(false)
  const [agentChatFile, setAgentChatFile] = useState(null)
  const agentFileInputRef = useRef(null)
  const agentChatEndRef = useRef(null)

  const handleAgentChatFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setAgentChatFile({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: (file.size / 1024).toFixed(1) + ' KB',
        url: evt.target?.result
      })
    }
    reader.readAsDataURL(file)
  }

  // Poll for real incoming admin messages every 2 seconds when chat is open
  useEffect(() => {
    if (!showAdminChatModal || !isAgent) return
    let isMounted = true

    const loadRealAgentMessages = async () => {
      try {
        const msgs = await getDirectMessages(agentEmail, 'admin@ticketflow.ai')
        if (isMounted) {
          setAgentChatMsgs(msgs)
        }
      } catch { /* ignore */ }
    }

    loadRealAgentMessages()
    const interval = setInterval(loadRealAgentMessages, 2000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [showAdminChatModal, isAgent, agentEmail])

  useEffect(() => {
    if (showAdminChatModal) {
      agentChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [agentChatMsgs, showAdminChatModal])

  const openAdminChatDrawer = async () => {
    setShowAdminChatModal(true)
    try {
      const msgs = await getDirectMessages(agentEmail, 'admin@ticketflow.ai')
      setAgentChatMsgs(msgs)
    } catch {
      setAgentChatMsgs([])
    }
  }

  const handleSendAgentReply = async (e) => {
    if (e) e.preventDefault()
    if ((!agentInputText.trim() && !agentChatFile) || agentSending) return

    const textToSend = agentInputText.trim()
    const fileToSend = agentChatFile
    setAgentInputText('')
    setAgentChatFile(null)
    setAgentSending(true)

    try {
      const sentMsg = await sendDirectMessage({
        senderEmail: agentEmail,
        senderName: agentName,
        receiverEmail: 'admin@ticketflow.ai',
        text: textToSend,
        fileAttachment: fileToSend
      })
      setAgentChatMsgs(prev => [...prev, sentMsg])
    } catch (err) {
      console.error('Failed to send agent reply:', err)
    } finally {
      setAgentSending(false)
    }
  }

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

    // If logged in as an Agent, ONLY show tickets explicitly assigned to this agent.
    // Unassigned tickets are NEVER shown to agents (Admin only until assigned).
    if (isAgent) {
      if (!t.assigned_agent || t.assigned_agent === 'Unassigned') return false
      const isDirectlyAssigned = (t.assigned_agent && t.assigned_agent.toLowerCase().includes(demoUser.name?.toLowerCase() || '___')) ||
                                 (t.assigned_agent_email && t.assigned_agent_email === demoUser.email)
      if (!isDirectlyAssigned) return false
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
                  Showing tickets explicitly assigned to you. Unassigned tickets are managed by Administrator.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={openAdminChatDrawer}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff', fontWeight: 700, fontSize: '0.8rem',
                    padding: '6px 14px', borderRadius: 8, boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                  }}
                >
                  <MessageSquare size={14} /> 💬 Direct Admin Messages
                </button>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 8,
                  background: 'rgba(16,185,129,0.12)', color: '#059669',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  <Layers size={13} /> {sorted.length} active
                </div>
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

                    const { priority, score: ticketScore } = getSynchronizedPriorityAndScore(t)
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
                            <span className={`badge badge-${priorityClass[priority] || 'low'}`} style={{ fontWeight: 800 }}>
                              ● {priority}
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

      {/* 💬 Agent Direct Admin Chat Modal */}
      {showAdminChatModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            width: '100%', maxWidth: 540, height: 620, background: '#ffffff',
            borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', background: '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.95rem', color: '#fff'
                }}>
                  AD
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Administrator (Master Admin)
                    <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 700 }}>
                      🟢 Direct Channel
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    admin@ticketflow.ai &bull; Master Operations
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAdminChatModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Body */}
            <div style={{
              flex: 1, padding: 20, overflowY: 'auto', background: '#f8fafc',
              display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
                <span style={{ fontSize: '0.72rem', background: '#e2e8f0', color: '#64748b', padding: '4px 12px', borderRadius: 12, fontWeight: 600 }}>
                  🔒 Direct Encrypted Admin Channel
                </span>
              </div>

              {agentChatMsgs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748b', marginBottom: 4 }}>
                    Direct Communication with Administrator
                  </div>
                  <div style={{ fontSize: '0.78rem' }}>
                    No messages yet from Administrator. You can send a direct update below.
                  </div>
                </div>
              ) : (
                agentChatMsgs.map(msg => {
                  const isMe = msg.sender_email?.toLowerCase() === agentEmail.toLowerCase()
                  const senderLabel = isMe ? 'You' : 'Administrator'
                  const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        maxWidth: '82%', padding: '12px 16px', borderRadius: 16,
                        borderBottomRightRadius: isMe ? 4 : 16,
                        borderBottomLeftRadius: !isMe ? 4 : 16,
                        background: isMe ? 'linear-gradient(135deg, #10b981, #059669)' : '#ffffff',
                        color: isMe ? '#ffffff' : '#0f172a',
                        border: isMe ? 'none' : '1px solid #e2e8f0',
                        boxShadow: isMe ? '0 4px 12px rgba(16,185,129,0.2)' : '0 2px 6px rgba(0,0,0,0.03)',
                        fontSize: '0.88rem', lineHeight: 1.5
                      }}>
                        {msg.text && <div>{msg.text}</div>}
                        {msg.file_attachment && (
                          <div style={{ marginTop: msg.text ? 8 : 0 }}>
                            {msg.file_attachment.type?.startsWith('image/') ? (
                              <img
                                src={msg.file_attachment.url}
                                alt={msg.file_attachment.name}
                                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginTop: 4 }}
                              />
                            ) : (
                              <a
                                href={msg.file_attachment.url}
                                download={msg.file_attachment.name}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                                  background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)', borderRadius: 8, color: 'inherit',
                                  fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600, marginTop: 4
                                }}
                              >
                                <Paperclip size={14} /> {msg.file_attachment.name} ({msg.file_attachment.size})
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4, padding: '0 4px', fontWeight: 500 }}>
                        {senderLabel} &bull; {timeStr}
                      </div>
                    </div>
                  )
                })
              )}

              <div ref={agentChatEndRef} />
            </div>

            {/* Selected File Chip */}
            {agentChatFile && (
              <div style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.08)', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600 }}>
                  <Paperclip size={14} /> Attached: {agentChatFile.name} ({agentChatFile.size})
                </div>
                <button type="button" onClick={() => setAgentChatFile(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>✕ Remove</button>
              </div>
            )}

            {/* Input Footer */}
            <form
              onSubmit={handleSendAgentReply}
              style={{
                padding: '14px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', gap: 10
              }}
            >
              <label
                title="Import/Attach File or Image"
                style={{
                  cursor: 'pointer', padding: '8px 10px', borderRadius: 10, background: '#f8fafc',
                  border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                }}
              >
                <Paperclip size={18} />
                <input
                  type="file"
                  ref={agentFileInputRef}
                  onChange={handleAgentChatFileSelect}
                  style={{ display: 'none' }}
                />
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Message Administrator..."
                value={agentInputText}
                onChange={e => setAgentInputText(e.target.value)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: '0.88rem',
                  border: '1px solid #cbd5e1', background: '#f8fafc'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={(!agentInputText.trim() && !agentChatFile) || agentSending}
                style={{
                  padding: '10px 18px', borderRadius: 10, display: 'inline-flex',
                  alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.86rem',
                  background: '#10b981', border: 'none'
                }}
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
