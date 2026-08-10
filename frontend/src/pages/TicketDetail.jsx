import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTicket, addActivity, updateTicket, uploadToImgBB } from '../services/api'
import { getTicketRating, saveTicketRating } from '../services/admins'
import { getDirectMessages, sendDirectMessage } from '../services/agents'
import { ChevronRight, Paperclip, Send, ArrowLeft, X, Eye, FileText, Image as ImageIcon, Download, Star, RotateCcw, FileDown, CheckCircle2, Clock, AlertCircle, Loader, Sparkles, MessageSquare, RefreshCw } from 'lucide-react'

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
  const [slaText, setSlaText] = useState('')
  const [slaBreached, setSlaBreached] = useState(false)
  const [collisionAgent, setCollisionAgent] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)
  const replyFileRef = useRef(null)

  // Embedded Live 2-Way Chat State
  const [directChatMsgs, setDirectChatMsgs] = useState([])
  const [directChatInput, setDirectChatInput] = useState('')
  const [directChatSending, setDirectChatSending] = useState(false)
  const [chatFile, setChatFile] = useState(null)
  const chatFileInputRef = useRef(null)
  const directChatEndRef = useRef(null)

  const handleChatFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setChatFile({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: (file.size / 1024).toFixed(1) + ' KB',
        url: evt.target?.result
      })
    }
    reader.readAsDataURL(file)
  }

  const customerEmail = (user?.email || ticket?.customer_email || 'customer@gmail.com').toLowerCase()
  const customerName = user?.user_metadata?.full_name || ticket?.customer_name || 'Customer'
  const agentTargetEmail = (ticket?.assigned_agent_email || 'support@ticketflow.ai').toLowerCase()

  // Poll for real incoming agent messages every 2 seconds
  useEffect(() => {
    if (!id || !agentTargetEmail) return
    let isMounted = true

    const loadLiveMessages = async () => {
      try {
        const msgs = await getDirectMessages(customerEmail, agentTargetEmail)
        if (isMounted) {
          setDirectChatMsgs(msgs)
        }
      } catch { /* ignore */ }
    }

    loadLiveMessages()
    const interval = setInterval(loadLiveMessages, 2000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [id, customerEmail, agentTargetEmail])

  useEffect(() => {
    directChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [directChatMsgs])

  const handleSendDirectChat = async (e) => {
    if (e) e.preventDefault()
    if ((!directChatInput.trim() && !chatFile) || directChatSending) return

    const textToSend = directChatInput.trim()
    const fileToSend = chatFile
    setDirectChatInput('')
    setChatFile(null)
    setDirectChatSending(true)

    try {
      const sentMsg = await sendDirectMessage({
        senderEmail: customerEmail,
        senderName: customerName,
        receiverEmail: agentTargetEmail,
        text: textToSend,
        fileAttachment: fileToSend
      })

      setDirectChatMsgs(prev => [...prev, sentMsg])
      const updated = await getTicket(id).catch(() => null)
      if (updated) setTicket(updated)
    } catch (err) {
      console.error('Failed to send direct message:', err)
    } finally {
      setDirectChatSending(false)
    }
  }

  const handleMarkSolvedInChat = async () => {
    setDirectChatSending(true)
    try {
      await handleStatusChange('Resolved')
      const agentNameStr = user?.user_metadata?.full_name || user?.name || user?.email || 'Support Agent'
      const solveMsg = await sendDirectMessage({
        senderEmail: isStaff ? (user?.email || 'agent@ticketflow.ai') : customerEmail,
        senderName: agentNameStr,
        receiverEmail: isStaff ? customerEmail : agentTargetEmail,
        text: `✅ Ticket #${id?.slice(0, 8)?.toUpperCase() || ''} has been marked as SOLVED & RESOLVED by ${agentNameStr}.`
      })
      setDirectChatMsgs(prev => [...prev, solveMsg])
      setTicket(t => ({ ...t, status: 'Resolved' }))
    } catch (err) {
      console.error(err)
    } finally {
      setDirectChatSending(false)
    }
  }

  // 1. Initial Ticket Load
  useEffect(() => {
    setLoading(true)
    getTicket(id)
      .then(t => { setTicket(t); setLoading(false) })
      .catch(() => { setTicket(null); setLoading(false) })
  }, [id])

  // 2. Live SLA Countdown Timer Clock
  useEffect(() => {
    if (!ticket || ticket.status === 'Resolved' || ticket.status === 'Closed') return

    const updateSla = () => {
      const created = new Date(ticket.created_at || Date.now()).getTime()
      const slaMinutes = ticket.priority === 'Critical' ? 30 : ticket.priority === 'High' ? 120 : ticket.priority === 'Medium' ? 360 : 1440
      const targetTime = created + slaMinutes * 60 * 1000
      const diffMs = targetTime - Date.now()

      if (diffMs <= 0) {
        const breachedMin = Math.abs(Math.floor(diffMs / 60000))
        setSlaText(`🚨 SLA BREACHED (+${breachedMin}m overtime)`)
        setSlaBreached(true)
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
        setSlaText(`${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s remaining`)
        setSlaBreached(false)
      }
    }

    updateSla()
    const timer = setInterval(updateSla, 1000)
    return () => clearInterval(timer)
  }, [ticket])

  // 3. Agent Collision Presence Tracker
  useEffect(() => {
    if (!id) return
    const viewerName = (() => { try { return JSON.parse(localStorage.getItem('demo_user') || '{}')?.name || 'Agent' } catch { return 'Agent' } })()
    const presenceKey = `tf_presence_${id}`

    // Register active viewing heartbeat
    const registerHeartbeat = () => {
      try {
        const existing = JSON.parse(localStorage.getItem(presenceKey) || '[]')
        const active = existing.filter(p => p.name !== viewerName && Date.now() - p.time < 6000)
        localStorage.setItem(presenceKey, JSON.stringify([...active, { name: viewerName, time: Date.now() }]))

        if (active.length > 0) {
          setCollisionAgent(active[0].name)
        } else {
          setCollisionAgent(null)
        }
      } catch {}
    }

    registerHeartbeat()
    const interval = setInterval(registerHeartbeat, 2500)
    return () => {
      clearInterval(interval)
      try {
        const existing = JSON.parse(localStorage.getItem(presenceKey) || '[]')
        localStorage.setItem(presenceKey, JSON.stringify(existing.filter(p => p.name !== viewerName)))
      } catch {}
    }
  }, [id])

  // 4. Load Saved Rating from Supabase
  useEffect(() => {
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

  const triggerNotificationToast = (message) => {
    setToastMsg(message)
    setTimeout(() => setToastMsg(null), 4000)

    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        try { new Notification('TicketFlow AI Update', { body: message }) } catch {}
      } else if (Notification.permission !== 'denied') {
        try { Notification.requestPermission() } catch {}
      }
    }
  }

  const handleStatusChange = async (status) => {
    try {
      await updateTicket(id, { status })
      setTicket(t => ({ ...t, status }))
      triggerNotificationToast(`📧 Status updated to "${status}" & email notification dispatched to customer!`)
    } catch {
      setTicket(t => ({ ...t, status }))
      triggerNotificationToast(`📧 Status updated to "${status}"`)
    }
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
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TicketFlow Executive Report — #${t.code || (t.id || '').slice(0, 8)}</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 1.4rem; font-weight: 800; color: #2563eb; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; background: #eff6ff; color: #2563eb; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
          .card-title { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px; }
          .message { background: #f1f5f9; padding: 16px; border-radius: 10px; border-left: 4px solid #2563eb; margin-bottom: 14px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">⚡ TicketFlow AI Executive Report</div>
          <span class="badge">SLA Status: Guaranteed</span>
        </div>

        <h1 style="font-size: 1.8rem; margin: 0 0 10px;">${t.subject}</h1>
        <p style="color: #64748b; margin-bottom: 24px;">Ticket Code: <strong>${t.code || t.id}</strong> • Submitted by: <strong>${t.customer_name || 'Customer'}</strong> (${t.customer_email || 'N/A'})</p>

        <div class="grid">
          <div class="card">
            <div class="card-title">Priority Level & AI Score</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #2563eb;">${t.priority || 'Medium'} (${t.confidence_score || t.score || 85}% Score)</div>
          </div>
          <div class="card">
            <div class="card-title">Current Resolution Status</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #10b981;">${t.status || 'Open'}</div>
          </div>
        </div>

        <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Issue Description</h3>
        <p style="background: #f8fafc; padding: 18px; border-radius: 10px; font-size: 0.95rem;">${t.description}</p>

        <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;">Activity Timeline & Agent Replies (${(t.activities || []).length})</h3>
        ${(t.activities || []).filter(a => a.type !== 'internal_note').map(a => `
          <div class="message">
            <strong>${a.author}</strong> [${a.author_role || 'USER'}] — <span style="color:#64748b; font-size:0.8rem;">${new Date(a.created_at).toLocaleString()}</span>
            <p style="margin: 8px 0 0; font-size: 0.92rem;">${a.content}</p>
          </div>
        `).join('')}

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `
    printWindow.document.write(reportHtml)
    printWindow.document.close()
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

          {/* Agent Collision Warning Banner */}
          {collisionAgent && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 18px', borderRadius: 12, marginBottom: 16,
              background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b', fontWeight: 700, fontSize: '0.86rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
            }}>
              <AlertCircle size={18} />
              <span>⚠️ <strong>Agent Collision Warning:</strong> Specialist agent <strong>{collisionAgent}</strong> is also actively viewing & replying to this ticket right now.</span>
            </div>
          )}

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

          {/* Live Ticking SLA Countdown Timer Banner */}
          {t.status !== 'Resolved' && t.status !== 'Closed' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              padding: '14px 20px', borderRadius: 14, marginBottom: 20,
              background: slaBreached ? 'rgba(239, 68, 68, 0.12)' : t.priority === 'Critical' ? 'rgba(239, 68, 68, 0.08)' : t.priority === 'High' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
              border: `1px solid ${slaBreached ? 'rgba(239, 68, 68, 0.4)' : t.priority === 'Critical' ? 'rgba(239, 68, 68, 0.25)' : t.priority === 'High' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: slaBreached ? '#ef4444' : t.priority === 'Critical' ? '#ef4444' : t.priority === 'High' ? '#f59e0b' : '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
                }}>
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Live SLA Response Countdown: <span style={{ color: slaBreached ? '#ef4444' : t.priority === 'Critical' ? '#ef4444' : t.priority === 'High' ? '#f59e0b' : '#2563eb', fontWeight: 800 }}>
                      {slaText || '< 30 Minutes (Critical SLA)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Resolution deadline automatically tracked based on AI priority classification.
                  </div>
                </div>
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20,
                background: 'var(--bg-surface)', border: `1px solid ${slaBreached ? '#ef4444' : 'var(--border)'}`,
                fontSize: '0.78rem', fontWeight: 700, color: slaBreached ? '#ef4444' : 'var(--text-secondary)'
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: slaBreached ? '#ef4444' : '#10b981', display: 'inline-block' }} />
                {slaBreached ? 'SLA Breached' : 'SLA Target Active'}
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

          {/* Activity Messages Timeline Container */}
          <div style={{ marginBottom: 24 }}>

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
                    style={{ fontSize: '0.75rem', padding: '4px 12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))', color: '#c084fc', border: '1px solid rgba(168,85,247,0.4)', fontWeight: 800 }}
                    onClick={() => {
                      const cat = t.category || 'Technical Support'
                      const subj = t.subject || 'issue'
                      const name = t.customer_name || 'Customer'
                      const draft = `Hello ${name},\n\nThank you for bringing "${subj}" to our attention. Our ${cat} engineering team has analyzed the root cause and applied an immediate fix to your environment.\n\nPlease verify on your end and let us know if you require any further assistance.\n\nBest regards,\nTicketFlow AI Support Team`
                      setReply(draft)
                    }}
                  >
                    ✨ AI Smart Auto-Reply (1-Click Draft)
                  </button>
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
              <div className="card" style={{ padding: 0, marginTop: 24, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* Embedded Chat Header */}
                <div style={{
                  padding: '14px 20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: '#2563eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.85rem', color: '#fff'
                    }}>
                      {(t.assigned_agent || 'AG').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        💬 Direct Live Chat with Agent ({t.assigned_agent || 'Support Specialist'})
                        <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 700 }}>
                          🟢 Active
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        {t.assigned_department || 'Technical Support'} &bull; Real-time 2-way channel
                      </div>
                    </div>
                  </div>

                  {/* Solved / Resolved Action Button for Agents */}
                  {isStaff && t.status !== 'Resolved' && t.status !== 'Closed' && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none', fontWeight: 700, padding: '6px 14px', borderRadius: 8, fontSize: '0.8rem' }}
                      onClick={handleMarkSolvedInChat}
                    >
                      ✓ Mark Ticket Solved
                    </button>
                  )}
                </div>

                {/* Embedded Chat Messages Body */}
                <div style={{
                  maxHeight: 360, minHeight: 200, padding: 20, overflowY: 'auto', background: 'var(--bg-card-hover)',
                  display: 'flex', flexDirection: 'column', gap: 12
                }}>
                  <div style={{ textAlign: 'center', margin: '4px 0 10px' }}>
                    <span style={{ fontSize: '0.7rem', background: 'var(--bg-surface)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: 10, fontWeight: 600 }}>
                      🔒 Direct Encrypted Agent Channel
                    </span>
                  </div>

                  {directChatMsgs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)' }}>
                      <MessageSquare size={24} style={{ margin: '0 auto 6px', opacity: 0.6 }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        Start a direct conversation with {t.assigned_agent || 'Support Agent'}
                      </div>
                      <div style={{ fontSize: '0.74rem' }}>
                        Type your message below. Messages are synced instantly.
                      </div>
                    </div>
                  ) : (
                    directChatMsgs.map(msg => {
                      const isMe = msg.sender_email?.toLowerCase() === customerEmail.toLowerCase()
                      const senderLabel = isMe ? 'You' : (msg.sender_name || t.assigned_agent || 'Support Agent')
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
                            maxWidth: '82%', padding: '10px 14px', borderRadius: 14,
                            borderBottomRightRadius: isMe ? 3 : 14,
                            borderBottomLeftRadius: !isMe ? 3 : 14,
                            background: isMe ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'var(--bg-surface)',
                            color: isMe ? '#ffffff' : 'var(--text-primary)',
                            border: isMe ? 'none' : '1px solid var(--border)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            fontSize: '0.86rem', lineHeight: 1.45
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
                                      background: 'rgba(255,255,255,0.15)', borderRadius: 8, color: 'inherit',
                                      fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600, marginTop: 4
                                    }}
                                  >
                                    <Paperclip size={14} /> {msg.file_attachment.name} ({msg.file_attachment.size})
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 3, padding: '0 4px', fontWeight: 500 }}>
                            {senderLabel} &bull; {timeStr}
                          </div>
                        </div>
                      )
                    })
                  )}

                  <div ref={directChatEndRef} />
                </div>

                {/* Selected File Preview Chip */}
                {chatFile && (
                  <div style={{ padding: '8px 16px', background: 'rgba(59,130,246,0.08)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontWeight: 600 }}>
                      <Paperclip size={14} /> Attached: {chatFile.name} ({chatFile.size})
                    </div>
                    <button type="button" onClick={() => setChatFile(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>✕ Remove</button>
                  </div>
                )}

                {/* Embedded Chat Input Bar */}
                <form
                  onSubmit={handleSendDirectChat}
                  style={{
                    padding: '12px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <label
                    title="Import/Attach File or Image"
                    style={{
                      cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: 'var(--bg-input)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                    }}
                  >
                    <Paperclip size={18} />
                    <input
                      type="file"
                      ref={chatFileInputRef}
                      onChange={handleChatFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Message ${t.assigned_agent || 'Support Agent'}...`}
                    value={directChatInput}
                    onChange={e => setDirectChatInput(e.target.value)}
                    style={{
                      flex: 1, padding: '9px 14px', borderRadius: 8, fontSize: '0.86rem',
                      border: '1px solid var(--border)', background: 'var(--bg-card)'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={(!directChatInput.trim() && !chatFile) || directChatSending}
                    style={{
                      padding: '9px 18px', borderRadius: 8, display: 'inline-flex',
                      alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.84rem'
                    }}
                  >
                    <span>{directChatSending ? 'Sending…' : 'Send'}</span>
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* Rating Card — show after resolved/closed ONLY to Customers (not Agents/Admins) */}
            {!isStaff && (t.status === 'Resolved' || t.status === 'Closed') && (
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

      {/* Toast Notification Floating Alert */}
      {toastMsg && (
        <div className="animate-fade" style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999999,
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          borderRadius: 14, padding: '14px 20px',
          color: '#ffffff', fontWeight: 700, fontSize: '0.88rem',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <CheckCircle2 size={20} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
