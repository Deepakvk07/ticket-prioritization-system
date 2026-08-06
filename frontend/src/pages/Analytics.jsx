import { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getAnalytics } from '../services/api'
import { Download, Calendar, Users, BarChart2, TrendingUp, Sparkles, Zap } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, CartesianGrid, Legend,
} from 'recharts'

const COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#3b82f6', Low: '#6b7280' }

const MOCK_ANALYTICS = {
  total_tickets: 12842, avg_resolution_time_minutes: 135, csat_score: 4.8,
  active_tickets: 2411, model_accuracy: 98.2,
  tickets_by_priority: { Critical: 365, High: 675, Medium: 1085, Low: 1327 },
  tickets_by_status: { Open: 412, 'In Progress': 620, 'On Hold': 189, Resolved: 11621 },
  tickets_by_day: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(5, 10),
    count: 200 + Math.floor(Math.random() * 300),
    resolved: 150 + Math.floor(Math.random() * 200),
  })),
}

const ACCURACY_DATA = [
  { week: 'Week 1', accuracy: 84 }, { week: 'Week 2', accuracy: 88 },
  { week: 'Week 3', accuracy: 93 }, { week: 'Week 4', accuracy: 98.2 },
]

const INSIGHTS = [
  { type: 'System Alert', time: 'Just now', color: 'var(--critical)', msg: 'Detected 24% spike in "API Timeout" related tickets in EMEA region. Suggesting knowledge base update.' },
  { type: 'Optimization', time: '2h ago', color: 'var(--accent)', msg: 'Auto-categorization accuracy for Billing tickets improved by 4% after yesterday\'s training cycle.' },
  { type: 'Periodic Report', time: '5h ago', color: 'var(--text-muted)', msg: 'Weekly CSAT forecast: Trending towards 4.85 based on current resolution patterns.' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export default function Analytics({ user }) {
  const [data, setData] = useState(MOCK_ANALYTICS)
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const analyticsData = data && typeof data === 'object' ? { ...MOCK_ANALYTICS, ...data } : MOCK_ANALYTICS
  const priorityObj = analyticsData.tickets_by_priority || MOCK_ANALYTICS.tickets_by_priority
  const priorityPie = Object.entries(priorityObj).map(([name, value]) => ({ name, value }))
  const totalActive = analyticsData.active_tickets || Object.values(priorityObj).reduce((a, b) => a + b, 0)
  const ticketsByDay = Array.isArray(analyticsData.tickets_by_day) ? analyticsData.tickets_by_day : MOCK_ANALYTICS.tickets_by_day

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search analytics or tickets..." />
        <div className="page-body animate-fade">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div className="page-header" style={{ marginBottom: 0 }}>
              <h2>Performance Overview</h2>
              <p>Detailed breakdown of support health and AI model performance.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm"><Calendar size={14} /> Last 30 days</button>
              <button className="btn btn-ghost btn-sm"><Users size={14} /> All Agents</button>
              <button className="btn btn-primary btn-sm"><Download size={14} /> Export</button>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            <div className="kpi-card">
              <div className="kpi-meta">
                <div className="kpi-icon"><BarChart2 size={18} /></div>
                <span className="kpi-delta positive">↑ +14.2% from last month</span>
              </div>
              <div className="kpi-label">Total Tickets</div>
              <div className="kpi-value">{data.total_tickets?.toLocaleString()}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-meta">
                <div className="kpi-icon"><TrendingUp size={18} /></div>
                <span className="kpi-delta positive">↓ -12m improvement</span>
              </div>
              <div className="kpi-label">Avg Resolution Time</div>
              <div className="kpi-value">{Math.floor(data.avg_resolution_time_minutes / 60)}h {data.avg_resolution_time_minutes % 60}m</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-meta">
                <div className="kpi-icon"><Sparkles size={18} /></div>
                <span className="kpi-delta positive">✓ Above target (4.5)</span>
              </div>
              <div className="kpi-label">CSAT Score</div>
              <div className="kpi-value">{data.csat_score}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/5.0</span></div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
            {/* Bar chart */}
            <div className="card">
              <div className="section-header" style={{ marginBottom: 16 }}>
                <span className="section-title">Ticket Volume Over Time</span>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />Resolved
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />New
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.tickets_by_day.slice(-12)} barGap={2}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="resolved" name="Resolved" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.9} />
                  <Bar dataKey="count" name="New" fill="rgba(255,255,255,0.12)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Distribution Donut */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Priority Distribution</div>
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={priorityPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      dataKey="value" strokeWidth={0}>
                      {priorityPie.map(entry => (
                        <Cell key={entry.name} fill={COLORS[entry.name] || '#666'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalActive?.toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {priorityPie.map(({ name, value }) => {
                  const total = priorityPie.reduce((s, p) => s + p.value, 0)
                  return (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[name], display: 'inline-block' }} />
                        {name} {name === 'Critical' ? '(Critical)' : ''}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{Math.round(value / total * 100)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Accuracy Trend */}
            <div className="card">
              <div className="section-header" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Sparkles size={15} color="var(--accent)" />
                    <span className="section-title">Model Accuracy Trend</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 25 }}>GPT-4 Omni Fine-tuned</div>
                </div>
                <span className="badge badge-success">{data.model_accuracy}% Accurate</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={ACCURACY_DATA}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[75, 100]} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="var(--accent)"
                    strokeWidth={2} dot={{ fill: 'var(--accent)', strokeWidth: 0, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* AI Insight Stream */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>
                <Zap size={16} color="var(--accent)" /> AI Insight Stream
              </div>
              {INSIGHTS.map(({ type, time, color, msg }) => (
                <div key={type} style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color }}>{type}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{time}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{msg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row 3 — CSAT Trend & Resolution Histogram */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
            {/* CSAT Trend Graph */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>
                ⭐ CSAT Satisfaction Score Trend (Last 4 Weeks)
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={[
                  { week: 'W1', csat: 4.5 },
                  { week: 'W2', csat: 4.6 },
                  { week: 'W3', csat: 4.7 },
                  { week: 'W4', csat: 4.85 },
                ]}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[4.0, 5.0]} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="csat" name="CSAT Rating" stroke="#f59e0b"
                    strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 0, r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Resolution Time Histogram */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>
                ⏱️ Resolution Time Histogram (Minutes)
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[
                  { range: '< 15m', count: 420 },
                  { range: '15-60m', count: 860 },
                  { range: '1-3h', count: 640 },
                  { range: '3-6h', count: 310 },
                  { range: '> 6h', count: 180 },
                ]}>
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Tickets" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
