import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTickets } from '../services/api'
import { Clock, ChevronRight, Search, CalendarDays, CheckCircle2, XCircle, Layers, Filter, Download } from 'lucide-react'

const priorityClass = { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' }

/**
 * Determines which agent department should handle a ticket.
 */
function getTicketDepartment(ticket) {
  const text = `${ticket.category || ''} ${ticket.subject || ''}`.toLowerCase()
  if (/database|sql|infra|server|devops|deployment|kubernetes|docker|cloud|aws|hosting/i.test(text)) return 'Database & Infrastructure'
  if (/ui|ux|frontend|css|html|web|design|layout|display|responsive|mobile|dark mode|theme/i.test(text)) return 'Web & UI/UX'
  if (/billing|payment|invoice|subscription|refund|charge|pricing|plan|cancellation/i.test(text)) return 'Billing & Integrations'
  if (/api|security|auth|token|oauth|ssl|certificate|encryption|endpoint|webhook|cors/i.test(text)) return 'API & Security'
  return 'Technical Support'
}

export default function TicketHistory({ user }) {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [dateRange, setDateRange] = useState('all') // all, 7d, 30d, 90d

  const demoUser = (() => {
    try { return JSON.parse(localStorage.getItem('demo_user') || '{}') } catch { return {} }
  })()
  const agentDepartment = demoUser.department || ''
  const isAgent = demoUser.role === 'agent'
  const userRoleMode = localStorage.getItem('user_role_mode')

  useEffect(() => {
    getTickets()
      .then(res => setTickets(Array.isArray(res) ? res : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [])

  // Filter for resolved/closed tickets only (history = completed work)
  const historyTickets = tickets.filter(t => {
    const isResolved = ['Resolved', 'Closed'].includes(t.status)
    if (!isResolved) return false

    // Agent specialist filter
    if (isAgent && agentDepartment && userRoleMode === 'agent') {
      const dept = getTicketDepartment(t)
      if (dept !== agentDepartment) return false
    }

    // Priority filter
    if (priorityFilter && t.priority !== priorityFilter) return false

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (t.subject || '').toLowerCase().includes(q) ||
        (t.customer_name || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.id || '').toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    // Date range filter
    if (dateRange !== 'all' && t.created_at) {
      const ticketDate = new Date(t.created_at)
      const now = new Date()
      const daysAgo = parseInt(dateRange)
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      if (ticketDate < cutoff) return false
    }

    return true
  })

  // Stats
  const allResolved = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status))
  const criticalResolved = allResolved.filter(t => t.priority === 'Critical').length
  const highResolved = allResolved.filter(t => t.priority === 'High').length
  const avgScore = allResolved.length > 0
    ? Math.round(allResolved.reduce((sum, t) => sum + (t.confidence_score || t.score || 50), 0) / allResolved.length)
    : 0

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search ticket history..." />
        <div className="page-body animate-fade">
          <style>{`
            .history-stat-card {
              padding: 18px 22px;
              border-radius: 14px;
              background: var(--bg-card);
              border: 1px solid var(--border);
              flex: 1;
              min-width: 150px;
              transition: all 0.2s ease;
            }
            .history-stat-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(0,0,0,0.08);
            }
            .history-stat-value {
              font-size: 1.6rem;
              font-weight: 800;
              letter-spacing: -0.02em;
              margin-bottom: 2px;
            }
            .history-stat-label {
              font-size: 0.76rem;
              color: var(--text-muted);
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .history-row {
              display: grid;
              grid-template-columns: 60px 2fr 1fr 100px 100px 120px 70px;
              align-items: center;
              gap: 12px;
              padding: 14px 20px;
              border-bottom: 1px solid var(--border);
              cursor: pointer;
              transition: all 0.15s ease;
            }
            .history-row:hover {
              background: rgba(16,185,129,0.04);
            }
            .history-row:last-child {
              border-bottom: none;
            }
            .resolution-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 3px 10px;
              border-radius: 6px;
              font-size: 0.74rem;
              font-weight: 700;
            }
            .resolution-badge.resolved {
              background: rgba(16,185,129,0.1);
              color: #059669;
              border: 1px solid rgba(16,185,129,0.2);
            }
            .resolution-badge.closed {
              background: rgba(100,116,139,0.1);
              color: #64748b;
              border: 1px solid rgba(100,116,139,0.2);
            }
          `}</style>

          <div className="page-header" style={{ marginBottom: 20 }}>
            <h2>Ticket History</h2>
            <p>Resolved and closed tickets — your completed work log and resolution archive.</p>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div className="history-stat-card">
              <div className="history-stat-value" style={{ color: '#10b981' }}>{allResolved.length}</div>
              <div className="history-stat-label">Total Resolved</div>
            </div>
            <div className="history-stat-card">
              <div className="history-stat-value" style={{ color: '#ef4444' }}>{criticalResolved}</div>
              <div className="history-stat-label">Critical Fixed</div>
            </div>
            <div className="history-stat-card">
              <div className="history-stat-value" style={{ color: '#f59e0b' }}>{highResolved}</div>
              <div className="history-stat-label">High Resolved</div>
            </div>
            <div className="history-stat-card">
              <div className="history-stat-value" style={{ color: '#3b82f6' }}>{avgScore}%</div>
              <div className="history-stat-label">Avg AI Confidence</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="card" style={{ padding: 14, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={15} color="var(--text-muted)" />

            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by subject, customer, category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 34px',
                  borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: '0.84rem', outline: 'none',
                }}
              />
            </div>

            <select
              className="form-select"
              style={{ width: 140 }}
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              className="form-select"
              style={{ width: 130 }}
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>

            <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} /> {historyTickets.length} resolved tickets
            </div>
          </div>

          {/* History List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div className="history-row" style={{ background: 'var(--bg-input)', fontWeight: 700, fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'default', borderBottom: '1px solid var(--border)' }}>
              <div>Score</div>
              <div>Ticket</div>
              <div>Category</div>
              <div>Priority</div>
              <div>Status</div>
              <div>Resolved</div>
              <div></div>
            </div>

            {/* Empty State */}
            {historyTickets.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>📋</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4, color: 'var(--text-primary)' }}>No resolved tickets yet</div>
                <div style={{ fontSize: '0.84rem', maxWidth: 400, margin: '0 auto' }}>
                  {isAgent && agentDepartment
                    ? `Tickets resolved in your "${agentDepartment}" specialist queue will appear here.`
                    : 'Resolved and closed tickets will appear here once agents complete their work.'}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                Loading ticket history...
              </div>
            )}

            {/* Ticket Rows */}
            {historyTickets.map(t => {
              const dept = getTicketDepartment(t)
              const resolvedDate = t.updated_at ? new Date(t.updated_at).toLocaleDateString() : t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'
              return (
                <div
                  key={t.id}
                  className="history-row"
                  onClick={() => navigate(`/tickets/${t.id}`)}
                >
                  <div>
                    <span style={{
                      fontWeight: 700, fontSize: '0.86rem',
                      color: (t.confidence_score || t.score || 50) > 85 ? 'var(--critical)' : (t.confidence_score || t.score || 50) > 60 ? 'var(--high)' : 'var(--text-secondary)'
                    }}>
                      {t.confidence_score || t.score || 50}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                      {t.subject}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>#{(t.id || '').slice(0, 8)}</span>
                      <span>·</span>
                      <span>{t.customer_name || 'Customer'}</span>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#059669', fontSize: '0.7rem' }}>
                        <Layers size={10} /> {dept}
                      </span>
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {t.category || 'General'}
                  </div>

                  <div>
                    <span className={`badge badge-${priorityClass[t.priority] || 'low'}`} style={{ fontSize: '0.72rem' }}>
                      ● {t.priority}
                    </span>
                  </div>

                  <div>
                    <span className={`resolution-badge ${t.status === 'Resolved' ? 'resolved' : 'closed'}`}>
                      {t.status === 'Resolved' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {t.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarDays size={12} /> {resolvedDate}
                  </div>

                  <div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
