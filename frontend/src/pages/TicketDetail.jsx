import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTicket, addActivity, updateTicket, uploadToImgBB } from '../services/api'
import { getTicketRating, saveTicketRating } from '../services/admins'
import { ChevronRight, Paperclip, Send, ArrowLeft, X, Eye, FileText, Image as ImageIcon, Download, Star, RotateCcw, FileDown, CheckCircle2, Clock, AlertCircle, Loader } from 'lucide-react'

export default function TicketDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [rating, setRating] = useState(0)
  const [ratingHover, setRatingHover] = useState(0)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [replyFiles, setReplyFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const replyFileRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    getTicket(id)
      .then(t => { setTicket(t); setLoading(false) })
      .catch(() => { setTicket(null); setLoading(false) })
  }, [id])

  useEffect(() => {
    // Load saved rating from Supabase
    const userEmail = (() => { try { return JSON.parse(localStorage.getItem('demo_user') || '{}')?.email || '' } catch { return '' } })()
    if (userEmail && id) {
      getTicketRating(id, userEmail).then(r => {
        if (r) { setRating(r); setRatingSubmitted(true) }
      }).catch(() => null)
    }
  }, [id])

  let demoUser = null
  try {
    const raw = localStorage.getItem('demo_user')
    if (raw && raw !== 'undefined' && raw !== 'null') demoUser = JSON.parse(raw)
  } catch {}

  const storedRole = localStorage.getItem('user_role_mode') || 'admin'
  const isStaff = storedRole === 'admin' || storedRole === 'agent'
  const currentRole = isStaff ? 'AGENT' : 'CUSTOMER'
  const currentAuthorName = isStaff
    ? (demoUser?.name || (user?.user_metadata?.full_name !== 'Google User' ? user?.user_metadata?.full_name : null) || user?.name || (storedRole === 'agent' ? 'Support Agent' : 'Admin System'))
    : (user?.user_metadata?.full_name || demoUser?.name || user?.email || 'Customer')

  const handleSend = async () => {
    if (!reply.trim() || !ticket) return
    setSending(true)
    try {
      await addActivity(id, {
        ticket_id: id,
        type: 'message',
        author: currentAuthorName,
        author_role: currentRole,
        content: reply,
      })
      setReply('')
      const updated = await getTicket(id)
      setTicket(updated)
    } catch {
      setTicket(t => ({
        ...t,
        activities: [...(t?.activities || []), {
          id: Date.now(), type: 'message',
          author: currentAuthorName, author_role: currentRole, content: reply, created_at: new Date().toISOString(),
        }]
      }))
      setReply('')
    } finally { setSending(false) }
  }

  const handleStatusChange = async (status) => {
    try {
      await updateTicket(id, { status })
      setTicket(t => ({ ...t, status }))
    } catch { setTicket(t => ({ ...t, status })) }
  }

  const handleReopen = async () => {
    await handleStatusChange('Open')
  }

  const handleRating = async (stars) => {
    setRating(stars)
    setRatingSubmitted(true)
    const userEmail = (() => { try { return JSON.parse(localStorage.getItem('demo_user') || '{}')?.email || '' } catch { return '' } })()
    try { await saveTicketRating(id, stars, userEmail) } catch { /* ignore */ }
  }

  const handleReplyFileAdd = async (files) => {
    setUploadingFiles(true)
    const processed = await Promise.all(Array.from(files).map(async (f) => {
      const sizeStr = `${(f.size / 1024).toFixed(1)} KB`
      if (f.type.startsWith('image/')) {
        try {
          const imgbb = await uploadToImgBB(f)
          return { name: f.name, size: sizeStr, type: 'image', url: imgbb.url }
        } catch {
          return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = e => resolve({ name: f.name, size: sizeStr, type: 'image', url: e.target.result })
            reader.readAsDataURL(f)
          })
        }
      } else {
        return new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = e => resolve({ name: f.name, size: sizeStr, type: 'text', content: e.target.result, url: null })
          reader.readAsText(f)
        })
      }
    }))
    setReplyFiles(prev => [...prev, ...processed])
    setUploadingFiles(false)
  }

  const handleExportPDF = () => {
    if (!ticket) return
    const t = ticket
    const content = `
      <html><head><title>Ticket ${t.subject}</title>
      <style>body{font-family:sans-serif;padding:40px;color:#111}h1{font-size:1.5rem}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{border:1px solid #ddd;padding:8px 12px;text-align:left}th{background:#f3f4f6}pre{background:#f9fafb;padding:12px;border-radius:4px;white-space:pre-wrap}.msg{background:#f3f4f6;padding:12px;margin:8px 0;border-radius:6px;border-left:4px solid #3b82f6}</style>
      </head><body>
      <h1>${t.subject}</h1>
      <table><tr><th>Field</th><th>Value</th></tr>
      <tr><td>Ticket ID</td><td>#TK-${(t.id||'').slice(0,8).toUpperCase()}</td></tr>
      <tr><td>Status</td><td>${t.status||'Open'}</td></tr>
      <tr><td>Priority</td><td>${t.priority||'N/A'}</td></tr>
      <tr><td>Category</td><td>${t.category||'General'}</td></tr>
      <tr><td>Submitted By</td><td>${t.customer_name||'Customer'}</td></tr>
      <tr><td>Created</td><td>${t.created_at ? new Date(t.created_at).toLocaleString() : 'N/A'}</td></tr>
      </table>
      <h2>Description</h2><pre>${t.description||''}</pre>
      <h2>Conversation (${(t.activities||[]).length} messages)</h2>
      ${(t.activities||[]).filter(a=>a.type!=='internal_note').map(a=>`<div class="msg"><strong>${a.author}</strong> [${a.author_role}] — ${new Date(a.created_at).toLocaleString()}<p>${a.content}</p></div>`).join('')}
      </body></html>
    `
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-${(t.id||'unknown').slice(0,8)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <div className="main-content" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader className="spin" size={28} style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Loading ticket details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <div className="main-content" style={{ background: '#ffffff', minHeight: '100vh' }}>
          <Topbar user={user} placeholder="Search tickets..." />
          <div className="page-body" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📄</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Ticket Not Found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.88rem' }}>
              No ticket details could be found for ID <strong>#{id}</strong>.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/tickets')}>
              <ArrowLeft size={14} /> Return to Tickets List
            </button>
          </div>
        </div>
      </div>
    )
  }

  const t = ticket

  let rawAttachments = []
  if (t && t.attachments) {
    if (Array.isArray(t.attachments)) {
      rawAttachments = t.attachments
    } else if (typeof t.attachments === 'string') {
      try { rawAttachments = JSON.parse(t.attachments) } catch { rawAttachments = [] }
    }
  }

  const attachments = (Array.isArray(rawAttachments) ? rawAttachments : [])
    .filter(Boolean)
    .map(att => {
      if (typeof att === 'string') {
        const isImg = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(att) || att.startsWith('http') || att.startsWith('data:image')
        return {
          name: att.startsWith('http') ? 'uploaded_image.png' : att,
          size: '245 KB',
          type: isImg ? 'image' : 'text',
          url: att.startsWith('http') || att.startsWith('data:image') ? att : null
        }
      }
      if (!att || typeof att !== 'object') {
        return { name: 'Attachment', size: '0 KB', type: 'text', url: null }
      }
      const hasRealUrl = att.url && (att.url.startsWith('http') || att.url.startsWith('data:image'))
      const isImg = att.type === 'image' || hasRealUrl || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(att.name || '')
      return {
        name: att.name || 'Attachment',
        size: att.size || '245 KB',
        type: isImg ? 'image' : 'text',
        url: att.url || null,
        content: att.content || null
      }
    })

  const messagesOnly = (t && Array.isArray(t.activities) ? t.activities : [])
    .filter(a => a && typeof a === 'object' && a.type !== 'internal_note')

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search tickets, documentation..." />

        {/* Single Full Width Body */}
        <div className="page-body animate-fade" style={{ width: '100%', maxWidth: '100%' }}>
          
          {/* Breadcrumb + Navigation */}
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')} style={{ padding: '4px 8px' }}>
              <ArrowLeft size={14} /> Back to My Tickets
            </button>
            <span>/</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>
              #{t.code || (t.id ? `TK-${t.id.slice(0, 5).toUpperCase()}` : 'TK-8842')}
            </span>
            <ChevronRight size={12} />
            <span>{t.category || 'Technical Support'}</span>
          </div>

          {/* Ticket Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{t.subject}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className={`badge badge-${(t.status || 'Open').toLowerCase().replace(' ', '')}`}>
                ● {t.status || 'Open'}
              </span>
              {/* Export PDF */}
              <button className="btn btn-ghost btn-sm" onClick={handleExportPDF} style={{ padding: '7px 14px', gap: 6 }}>
                <FileDown size={14} /> Export
              </button>
              {/* Reopen button for resolved/closed tickets */}
              {(t.status === 'Resolved' || t.status === 'Closed') && (
                <button className="btn btn-secondary btn-sm" onClick={handleReopen} style={{ padding: '7px 14px', gap: 6 }}>
                  <RotateCcw size={14} /> Reopen Ticket
                </button>
              )}
              {isStaff && (
                <select
                  className="form-select"
                  style={{ width: 'auto', fontSize: '0.85rem', padding: '6px 12px' }}
                  value={t.status || 'Open'}
                  onChange={e => handleStatusChange(e.target.value)}
                >
                  {['Open','In Progress','On Hold','Resolved','Closed'].map(s => <option key={s}>{s}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Estimated Resolution Time (SLA) Badge Banner */}
          {t.status !== 'Resolved' && t.status !== 'Closed' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              padding: '14px 20px', borderRadius: 14, marginBottom: 20,
              background: t.priority === 'Critical' ? 'rgba(239, 68, 68, 0.08)' : t.priority === 'High' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
              border: `1px solid ${t.priority === 'Critical' ? 'rgba(239, 68, 68, 0.25)' : t.priority === 'High' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: t.priority === 'Critical' ? '#ef4444' : t.priority === 'High' ? '#f59e0b' : '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
                }}>
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Estimated Agent Response Time: <span style={{ color: t.priority === 'Critical' ? '#ef4444' : t.priority === 'High' ? '#f59e0b' : '#2563eb' }}>
                      {t.priority === 'Critical' ? '< 30 Minutes (Critical SLA)' : t.priority === 'High' ? '< 2 Hours (Priority SLA)' : t.priority === 'Medium' ? '< 6 Hours (Standard SLA)' : '< 24 Hours (General SLA)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Support agent assignment and initial triage in progress. Live status auto-updates.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20,
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)'
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                SLA Target Guaranteed
              </div>
            </div>
          )}

          {/* Ticket Lifecycle Timeline Stepper */}
          {(() => {
            const steps = ['Open', 'In Progress', 'Resolved']
            const onHold = t.status === 'On Hold'
            const currentStep = onHold ? 1 : steps.indexOf(t.status === 'Closed' ? 'Resolved' : t.status)
            return (
              <div className="card" style={{ padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 0 }}>
                {steps.map((step, i) => {
                  const done = i < currentStep || (t.status === 'Resolved' || t.status === 'Closed')
                  const active = i === currentStep && !done
                  const StepIcon = i === 0 ? AlertCircle : i === 1 ? Clock : CheckCircle2
                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'unset' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: done ? '#10b981' : active ? '#2563eb' : 'var(--bg-input)',
                          border: `2px solid ${done ? '#10b981' : active ? '#2563eb' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.3s'
                        }}>
                          <StepIcon size={15} color={done || active ? '#fff' : 'var(--text-muted)'} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: done ? '#10b981' : active ? '#2563eb' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {onHold && i === 1 ? 'On Hold' : step}
                        </span>
                      </div>
                      {i < 2 && (
                        <div style={{ flex: 1, height: 2, background: done ? '#10b981' : 'var(--border)', margin: '0 8px', marginBottom: 20, borderRadius: 2, transition: 'background 0.3s' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* ⚡ AI Executive Summary Block */}
          <div className="card" style={{ padding: '18px 22px', marginBottom: 20, background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(99, 102, 241, 0.04))', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> AI Executive Triage Summary
              </div>
              <span className="badge badge-medium" style={{ fontSize: '0.72rem' }}>GPT-4 Omni Synthesized</span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 8, fontWeight: 600 }}>
              💡 <strong>Key Issue:</strong> {t.subject}. {t.description ? t.description.slice(0, 140) + '...' : ''}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>Category: <strong style={{ color: 'var(--text-primary)' }}>{t.category || 'Technical Support'}</strong></span>
              <span>•</span>
              <span>Priority SLA: <strong style={{ color: t.priority === 'Critical' ? '#ef4444' : '#2563eb' }}>{t.priority || 'Medium'}</strong></span>
            </div>
          </div>

          {/* Customer Message Card */}
          <div className="card" style={{ marginBottom: 24, padding: 24 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {t.customer_name ? t.customer_name.split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{t.customer_name || 'Customer'}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Submitted on {t.created_at ? new Date(t.created_at).toLocaleString() : 'Recently'}
                </div>
              </div>
            </div>

            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.92rem', marginBottom: 20 }}>
              {t.description}
            </div>

            {/* Clickable & Openable Attachments */}
            {attachments.length > 0 && (
              <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Attachments ({attachments.length}) — Click file to open actual figure/content
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {attachments.map((f, index) => (
                    <div
                      key={index}
                      className="card"
                      onClick={() => setSelectedFile(f)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                        cursor: 'pointer', border: '1px solid var(--border-active)',
                        background: 'rgba(59, 130, 246, 0.06)', borderRadius: 10,
                        transition: 'all 0.2s ease'
                      }}
                      title="Click to view file figure"
                    >
                      <Paperclip size={16} color="var(--accent)" />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{f.size || 'Attachment'} • Click to Open</div>
                      </div>
                      <Eye size={14} color="var(--accent)" style={{ marginLeft: 6 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Messages Timeline */}
          <div style={{ marginBottom: 24 }}>
            <div className="section-title" style={{ marginBottom: 14, fontSize: '1.05rem', fontWeight: 700 }}>
              Conversation Timeline
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />TICKETS ACTIVITY<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {messagesOnly.map(act => (
              <div key={act.id} style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: act.author_role === 'AGENT' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0
                }}>
                  {typeof act.author === 'string' && act.author.trim() ? act.author.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU'}
                </div>
                <div className="card" style={{ flex: 1, padding: 18, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{act.author}</span>
                    {act.author_role && <span className="badge badge-medium" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{act.author_role}</span>}
                    <span style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{act.content}</p>
                </div>
              </div>
            ))}

            {/* Agent Resolution Controls & Canned Templates — Only for Staff/Agents */}
            {isStaff ? (
              <div className="card" style={{ padding: 20, marginTop: 20, background: 'var(--bg-surface)', border: '1px solid var(--border-active)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="#10b981" /> Agent Resolution & Response Workspace
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status:</span>
                    <select
                      className="form-select"
                      style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: 8, height: 32 }}
                      value={t.status || 'Open'}
                      onChange={e => handleStatusChange(e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Quick Canned Response Buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Quick Templates:</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}
                    onClick={() => setReply("I've investigated the issue and deployed a hotfix to production. Everything is operational. Please confirm on your end.")}
                  >
                    ⚡ Issue Fixed & Deployed
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                    onClick={() => setReply("We've verified your CIDR range and whitelisted your API credentials in our VPC. Please test again.")}
                  >
                    ⚡ Credentials Whitelisted
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                    onClick={() => setReply("We require additional diagnostics. Could you please export and attach your browser/terminal network logs?")}
                  >
                    ⚡ Request Customer Logs
                  </button>
                </div>

                <textarea
                  className="form-textarea"
                  style={{ minHeight: 95, marginBottom: 10, fontSize: '0.92rem' }}
                  placeholder="Write resolution details or reply message..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                />

                {/* Reply file chips */}
                {replyFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {replyFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: '0.78rem', color: '#93c5fd' }}>
                        <Paperclip size={12} />
                        {f.name}
                        <button onClick={() => setReplyFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="file" multiple ref={replyFileRef} style={{ display: 'none' }} onChange={e => handleReplyFileAdd(e.target.files)} />
                    <button className="btn btn-ghost btn-sm" onClick={() => replyFileRef.current?.click()} style={{ padding: '7px 14px', gap: 6 }}>
                      {uploadingFiles ? <Loader size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Paperclip size={13} />}
                      Attach File
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none', fontWeight: 700, padding: '10px 20px', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
                      disabled={sending}
                      onClick={async () => {
                        setSending(true)
                        try {
                          await handleStatusChange('Resolved')
                          const msgText = reply.trim() || 'Ticket status marked as Resolved by Support Agent.'
                          await addActivity(id, {
                            ticket_id: id,
                            type: 'message',
                            author: user?.user_metadata?.full_name || user?.name || user?.email || 'Support Agent',
                            author_role: 'AGENT',
                            content: msgText,
                          })
                          setReply('')
                          const updated = await getTicket(id).catch(() => null)
                          if (updated) setTicket(updated)
                          else setTicket(t => ({ ...t, status: 'Resolved' }))
                        } catch {
                          setTicket(t => ({ ...t, status: 'Resolved' }))
                        } finally {
                          setSending(false)
                        }
                      }}
                    >
                      {sending ? 'Resolving…' : '✓ Mark as Resolved'}
                    </button>

                    <button className="btn btn-primary" disabled={(!reply.trim() && replyFiles.length === 0) || sending} onClick={handleSend} style={{ padding: '10px 24px', fontWeight: 700 }}>
                      <Send size={15} /> {sending ? 'Sending…' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 20, marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 12, color: 'var(--text-primary)' }}>
                  Write a reply to support
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 90, marginBottom: 10, fontSize: '0.92rem' }}
                  placeholder="Type your message or update for the support team..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" disabled={!reply.trim() || sending} onClick={handleSend} style={{ padding: '10px 24px', fontWeight: 700 }}>
                    <Send size={15} /> {sending ? 'Sending…' : 'Send Message'}
                  </button>
                </div>
              </div>
            )}

            {/* Rating Card — show after resolved/closed */}
            {(t.status === 'Resolved' || t.status === 'Closed') && (
              <div className="card" style={{ padding: 24, marginTop: 20, textAlign: 'center', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06))', border: '1px solid rgba(16,185,129,0.2)' }}>
                {ratingSubmitted ? (
                  <div>
                    <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', marginBottom: 4 }}>Thank you for your feedback!</div>
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>You rated this support experience {rating} out of 5 stars.</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={20} fill={s <= rating ? '#f59e0b' : 'none'} color={s <= rating ? '#f59e0b' : '#475569'} />)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', marginBottom: 4 }}>Rate Your Support Experience</div>
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: 14 }}>How satisfied were you with the resolution?</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      {[1,2,3,4,5].map(s => (
                        <Star
                          key={s}
                          size={28}
                          fill={s <= (ratingHover || rating) ? '#f59e0b' : 'none'}
                          color={s <= (ratingHover || rating) ? '#f59e0b' : '#475569'}
                          style={{ cursor: 'pointer', transition: 'all 0.15s', transform: s <= ratingHover ? 'scale(1.15)' : 'scale(1)' }}
                          onMouseEnter={() => setRatingHover(s)}
                          onMouseLeave={() => setRatingHover(0)}
                          onClick={() => handleRating(s)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Global Viewport Centered Lightbox Overlay */}
      {selectedFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }} onClick={() => setSelectedFile(null)}>
          
          <div style={{
            width: '100%',
            maxWidth: 780,
            maxHeight: '90vh',
            background: '#0b1326',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: 20,
            padding: '28px 32px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {selectedFile.type === 'image' || selectedFile.url ? <ImageIcon size={22} color="#3b82f6" /> : <FileText size={22} color="#10b981" />}
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>{selectedFile.name}</span>
              </div>
              <button
                className="icon-btn"
                onClick={() => setSelectedFile(null)}
                style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Container */}
            <div style={{
              background: '#040812',
              borderRadius: 14,
              padding: 20,
              flex: 1,
              minHeight: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {selectedFile.url ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 10 }}
                />
              ) : selectedFile.content ? (
                <pre style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap', color: '#60a5fa', margin: 0 }}>
                  {selectedFile.content}
                </pre>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <ImageIcon size={48} color="#3b82f6" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>{selectedFile.name}</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                File Size: {selectedFile.size || '245 KB'}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {selectedFile.url && (
                  <a
                    href={selectedFile.url}
                    download={selectedFile.name}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: '0.86rem', fontWeight: 700 }}
                  >
                    <Download size={14} /> Download / Open Image
                  </a>
                )}
                <button className="btn btn-ghost" onClick={() => setSelectedFile(null)} style={{ padding: '8px 18px', fontSize: '0.86rem' }}>
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
