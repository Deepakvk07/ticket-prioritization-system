import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTicket } from '../services/api'
import { useTranslation } from '../lib/i18n'
import { Search, Search as SearchIcon, CheckCircle2, Clock, Cpu, ShieldCheck, AlertCircle, ArrowLeft, Tag } from 'lucide-react'

const statusSteps = ['Open', 'In Progress', 'Resolved']
const priorityClass = { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' }

export default function TrackTicket({ user }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialCode = searchParams.get('id') || ''

  const [ticketIdInput, setTicketIdInput] = useState(initialCode)
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!ticketIdInput.trim()) return

    setLoading(true)
    setError('')
    setTicket(null)

    try {
      const data = await getTicket(ticketIdInput.trim())
      if (data && data.id) {
        setTicket(data)
      } else {
        setError(t('ticket_not_found_sub') || 'No ticket found matching that ticket number or ID.')
      }
    } catch (err) {
      setError(t('check_id_hint') || 'Ticket not found. Please check your ticket number and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialCode) {
      handleSearch()
    }
  }, [initialCode])

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder={t('search_placeholder')} />

        <div className="page-body animate-fade">
          
          {/* Header Banner */}
          <div className="card" style={{ padding: '28px 32px', marginBottom: 24, background: 'linear-gradient(135deg, #091325 0%, #0f1c35 100%)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, marginBottom: 10 }}>
              <SearchIcon size={14} /> LIVE TICKET TRACKING
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>{t('track_title')}</h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
              {t('track_subtitle')}
            </p>
          </div>

          {/* Search Box */}
          <div className="card" style={{ padding: 28, marginBottom: 28, background: 'var(--bg-surface)', border: '1px solid var(--border-active)' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 14 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 44, fontSize: '1rem', height: 48, fontFamily: 'monospace' }}
                  placeholder={t('ticket_id_placeholder')}
                  value={ticketIdInput}
                  onChange={e => setTicketIdInput(e.target.value)}
                  required
                />
                <SearchIcon size={20} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || !ticketIdInput.trim()} style={{ padding: '0 28px', height: 48, fontWeight: 700 }}>
                {loading ? t('searching_ticket') : t('track_now_btn')}
              </button>
            </form>

            {error && (
              <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem' }}>
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}
          </div>

          {/* Ticket Results */}
          {ticket && (
            <div className="card" style={{ padding: 32, background: 'var(--bg-surface)', border: '1px solid var(--border-active)' }}>
              
              {/* Top Meta Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>
                      #{ticket.id?.slice(0, 8).toUpperCase() || 'TK-8842'}
                    </span>
                    <span className={`badge badge-${statusSteps.includes(ticket.status) ? ticket.status.toLowerCase().replace(' ', '') : 'open'}`}>
                      ● {ticket.status || 'Open'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {ticket.subject}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>AI Auto-Priority</div>
                  <span className={`badge badge-${priorityClass[ticket.priority] || 'medium'}`} style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                    {ticket.priority || 'High'} Priority
                  </span>
                </div>
              </div>

              {/* Status Progress Stepper */}
              <div style={{ marginBottom: 32, padding: '24px', background: 'var(--bg-card-hover)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16 }}>
                  PROGRESS STAGE
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {['Received & Triaged', 'In Engineer Queue', 'Under Investigation', 'Resolved'].map((step, idx) => {
                    const isDone = idx <= (ticket.status === 'Resolved' ? 3 : ticket.status === 'In Progress' ? 2 : 1)
                    return (
                      <div key={step} style={{ textAlign: 'center', flex: 1, zIndex: 2 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: isDone ? '#10b981' : 'var(--bg-card)',
                          border: `2px solid ${isDone ? '#10b981' : 'var(--border-active)'}`,
                          color: isDone ? '#ffffff' : 'var(--text-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto 8px', fontWeight: 700, fontSize: '0.85rem',
                          boxShadow: isDone ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                        }}>
                          {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: isDone ? 700 : 500, color: isDone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {step}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Ticket Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Issue Details
                  </h4>
                  <div style={{ background: 'var(--bg-input)', padding: 18, borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6, minHeight: 100, border: '1px solid var(--border)' }}>
                    {ticket.description}
                  </div>
                </div>

                <div style={{ background: 'rgba(59,130,246,0.05)', padding: 18, borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)' }}>
                  <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Cpu size={15} /> AI Triage Metadata
                  </h4>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Category: <strong style={{ color: 'var(--text-primary)' }}>{ticket.category || 'Technical Support'}</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Customer: <strong style={{ color: 'var(--text-primary)' }}>{ticket.customer_name || 'Valued Customer'}</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Submitted: <strong style={{ color: 'var(--text-primary)' }}>{ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Recently'}</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Confidence Score: <strong style={{ color: '#10b981' }}>{ticket.confidence_score || 92}%</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                  View Full Discussion & Timeline →
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
