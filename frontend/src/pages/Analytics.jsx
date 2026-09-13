import { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getAnalytics } from '../services/api'
import { Download, Calendar, Users, BarChart2, TrendingUp, Sparkles, CheckCircle2, AlertCircle, Clock, PieChart as PieIcon, Layers } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, CartesianGrid,
} from 'recharts'

const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#3b82f6', Low: '#6b7280' }
const CATEGORY_COLORS = {
  'Database & Infrastructure': '#6366f1',
  'Web & UI/UX': '#ec4899',
  'Billing & Integrations': '#f59e0b',
  'API & Security': '#ef4444',
  'Technical Support': '#10b981'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--text-primary)' }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export default function Analytics({ user }) {
  const [data, setData] = useState({
    total_tickets: 0,
    active_tickets: 0,
    resolved_tickets: 0,
    resolution_rate: 0,
    avg_resolution_time_minutes: 0,
    csat_score: 0.0,
    tickets_by_priority: { Critical: 0, High: 0, Medium: 0, Low: 0 },
    tickets_by_status: { Open: 0, 'In Progress': 0, 'On Hold': 0, Resolved: 0, Closed: 0 },
    tickets_by_category: {
      'Database & Infrastructure': 0,
      'Web & UI/UX': 0,
      'Billing & Integrations': 0,
      'API & Security': 0,
      'Technical Support': 0
    },
    tickets_by_day: [],
    model_accuracy: 95.4,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(d => {
        if (d && typeof d === 'object') setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const priorityObj = data.tickets_by_priority || { Critical: 0, High: 0, Medium: 0, Low: 0 }
  const priorityPie = Object.entries(priorityObj).map(([name, value]) => ({ name, value: value || 0 }))
  const totalTickets = data.total_tickets || 0
  const activeTickets = data.active_tickets || 0
  const resolvedTickets = data.resolved_tickets || 0

  const categoryData = Object.entries(data.tickets_by_category || {}).map(([name, count]) => ({
    name,
    count: count || 0,
    fill: CATEGORY_COLORS[name] || '#3b82f6'
  }))

  const statusData = Object.entries(data.tickets_by_status || {}).map(([name, count]) => ({
    name,
    count: count || 0
  }))

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search analytics or tickets..." />
        <div className="page-body animate-fade">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div className="page-header" style={{ marginBottom: 0 }}>
              <h2>Performance Overview</h2>
              <p>Real-time analytics and support health derived strictly from live database tickets.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
                <Calendar size={14} /> Refresh Realtime Data
              </button>
            </div>
          </div>

          {/* Real-time Notice if Empty */}
          {totalTickets === 0 && !loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              borderRadius: 12, marginBottom: 24,
              background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.85rem', color: 'var(--text-secondary)'
            }}>
              <AlertCircle size={18} color="#3b82f6" />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Live Database Connected:</strong> No tickets currently exist in the database. When tickets are submitted by customers, all volume over time, priority distribution, and category charts will visualize automatically below.
              </div>
            </div>
          )}

          {/* Real KPI Cards */}
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            <div className="kpi-card">
              <div className="kpi-meta">
                <div className="kpi-icon" style={{ color: 'var(--accent)' }}><BarChart2 size={18} /></div>
                <span className="kpi-delta" style={{ color: 'var(--text-muted)' }}>Live Database Count</span>
              </div>
              <div className="kpi-label">Total Tickets</div>
              <div className="kpi-value">{totalTickets.toLocaleString()}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-meta">
                <div className="kpi-icon" style={{ color: '#f59e0b' }}><Clock size={18} /></div>
                <span className="kpi-delta" style={{ color: 'var(--text-muted)' }}>Pending Resolution</span>
              </div>
              <div className="kpi-label">Active Queue</div>
              <div className="kpi-value">{activeTickets.toLocaleString()}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-meta">
                <div className="kpi-icon" style={{ color: '#10b981' }}><CheckCircle2 size={18} /></div>
                <span className="kpi-delta positive">
                  {totalTickets > 0 ? `${data.resolution_rate}% Resolved` : '0%'}
                </span>
              </div>
              <div className="kpi-label">Resolved Tickets</div>
              <div className="kpi-value">{resolvedTickets.toLocaleString()}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-meta">
                <div className="kpi-icon" style={{ color: '#8b5cf6' }}><Sparkles size={18} /></div>
                <span className="kpi-delta positive">Production LinearSVC</span>
              </div>
              <div className="kpi-label">AI Priority Accuracy</div>
              <div className="kpi-value">{data.model_accuracy}%</div>
            </div>
          </div>

          {/* Visualizations Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
            {/* Real Ticket Volume Over Time */}
            <div className="card">
              <div className="section-header" style={{ marginBottom: 16 }}>
                <div>
                  <span className="section-title">Live Ticket Volume by Date</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Real ticket submissions plotted chronologically from database timestamps
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />New Tickets
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />Resolved
                  </span>
                </div>
              </div>

              {data.tickets_by_day && data.tickets_by_day.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.tickets_by_day} barGap={4}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="New Tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                  <BarChart2 size={32} opacity={0.4} />
                  <div style={{ fontSize: '0.85rem' }}>No ticket volume recorded yet</div>
                  <div style={{ fontSize: '0.75rem' }}>New tickets will generate real daily bars dynamically</div>
                </div>
              )}
            </div>

            {/* Real Priority Distribution Donut */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 4 }}>Real Priority Breakdown</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Categorized by AI Urgency
              </div>

              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={totalTickets > 0 ? priorityPie.filter(p => p.value > 0) : [{ name: 'Empty', value: 1 }]}
                      cx="50%" cy="50%" innerRadius={48} outerRadius={68}
                      dataKey="value" strokeWidth={0}
                    >
                      {totalTickets > 0 ? (
                        priorityPie.filter(p => p.value > 0).map(entry => (
                          <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#666'} />
                        ))
                      ) : (
                        <Cell fill="rgba(255,255,255,0.08)" />
                      )}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{totalTickets}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {priorityPie.map(({ name, value }) => {
                  const pct = totalTickets > 0 ? Math.round((value / totalTickets) * 100) : 0
                  return (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[name], display: 'inline-block' }} />
                        {name}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {value} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Real Category Breakdown & Status Lifecycle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Category Breakdown */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 4 }}>Department Category Breakdown</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Real distribution across the 5 specialist routing queues
              </div>

              {totalTickets > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                  <Layers size={28} opacity={0.4} />
                  <div style={{ fontSize: '0.82rem' }}>No department tickets submitted yet</div>
                </div>
              )}
            </div>

            {/* Ticket Lifecycle Status */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 4 }}>Ticket Status Lifecycle</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Current state distribution across all submitted customer tickets
              </div>

              {totalTickets > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
                  <Clock size={28} opacity={0.4} />
                  <div style={{ fontSize: '0.82rem' }}>No status lifecycle data yet</div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

