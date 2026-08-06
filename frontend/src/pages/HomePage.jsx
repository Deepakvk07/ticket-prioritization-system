import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { createTicket, uploadToImgBB } from '../services/api'
import { useTranslation } from '../lib/i18n'
import {
  Sparkles, PlusCircle, CheckCircle2, AlertCircle,
  Cpu, Send, Pencil, Bold, Italic, List, Link2, AtSign,
  HelpCircle, MessageSquare, Upload, X, ShieldCheck, Activity, RotateCcw,
  Copy, ExternalLink
} from 'lucide-react'

export default function HomePage({ user }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const email = user?.email || ''
  const userName = user?.name || user?.user_metadata?.full_name || (email ? email.split('@')[0] : 'Valued Customer')

  // Modal Popup Toggle State
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Custom Category State
  const [isCustomCategory, setIsCustomCategory] = useState(false)

  // Form State
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Technical Support')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState(email)
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)

  const textareaRef = useRef(null)

  // Status & Messaging
  const [submitting, setSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(null) // {id, subject}

  // Active Formatting Toolbar Actions
  const insertFormatting = (syntaxStart, syntaxEnd = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = description.substring(start, end) || 'text'
    const replacement = `${syntaxStart}${selectedText}${syntaxEnd}`
    const newText = description.substring(0, start) + replacement + description.substring(end)
    setDescription(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + syntaxStart.length, start + syntaxStart.length + selectedText.length)
    }, 50)
  }

  // Drag & drop file handler
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(f => [...f, ...dropped])
  }

  // Handle Form Submit
  const handleSubmit = async (e, forceSubmit = false) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!subject.trim() || !description.trim()) return

    setSubmitting(true)
    setErrorMsg('')
    setSubmittedTicket(null)

    // Check for duplicate tickets (similar subject, open status) unless forceSubmit is true
    if (!forceSubmit) {
      try {
        const { getTickets } = await import('../services/api')
        const existing = await getTickets({ status: 'Open' })
        const subjLower = subject.toLowerCase().trim()
        const dup = existing.find(t =>
          t.status !== 'Resolved' && t.status !== 'Closed' &&
          t.subject && (
            t.subject.toLowerCase().includes(subjLower.slice(0, 20)) ||
            subjLower.includes(t.subject.toLowerCase().slice(0, 20))
          )
        )
        if (dup) {
          setDuplicateWarning({ id: dup.id, subject: dup.subject })
          setSubmitting(false)
          return
        }
      } catch { /* ignore errors in duplicate check */ }
    }

    setDuplicateWarning(null)

    // Generate human-readable ticket code e.g. TK-8842
    const generatedCode = `TK-${Math.floor(1000 + Math.random() * 9000)}`

    try {
      // Process attached files — upload images to ImgBB, read text files as text
      const attachmentData = await Promise.all(
        files.map(async (f) => {
          const sizeStr = `${(f.size / 1024).toFixed(1)} KB`
          if (f.type.startsWith('image/')) {
            try {
              const imgbb = await uploadToImgBB(f)
              return { name: f.name, size: sizeStr, type: 'image', url: imgbb.url }
            } catch {
              // If ImgBB fails, store image as base64 data URL
              return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => resolve({ name: f.name, size: sizeStr, type: 'image', url: e.target.result })
                reader.readAsDataURL(f)
              })
            }
          } else {
            // For text/log files, read as text content
            return new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = (e) => resolve({ name: f.name, size: sizeStr, type: 'text', content: e.target.result, url: null })
              reader.onerror = () => resolve({ name: f.name, size: sizeStr, type: 'text', content: '', url: null })
              reader.readAsText(f)
            })
          }
        })
      )

      const payload = {
        subject: subject,
        description: description,
        category: category || 'Technical Support',
        product_module: category || 'Technical Support',
        customer_name: userName,
        customer_email: contactEmail || email || '',
        priority: 'High',
        ai_priority: 'High',
        confidence_score: 90.0,
        attachments: attachmentData
      }

      const ticket = await createTicket(payload)
      const ticketIdCode = ticket.code || (ticket.id ? (ticket.id.length < 10 ? ticket.id.toUpperCase() : `TK-${ticket.id.slice(0, 5).toUpperCase()}`) : generatedCode)

      setSubmittedTicket({
        id: ticket.id,
        code: ticketIdCode,
        subject: subject
      })

      // Reset form
      setSubject('')
      setDescription('')
      setFiles([])
    } catch (err) {
      setErrorMsg(`Submission error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search knowledge base, documentation, tickets..." />

        <div className="page-body animate-fade">

          <style>{`
            .home-hero-card {
              position: relative;
              border-radius: 20px;
              padding: 44px 48px;
              margin-bottom: 28px;
              background: linear-gradient(135deg, rgba(13, 22, 41, 0.95) 0%, rgba(17, 28, 51, 0.95) 100%);
              border: 1px solid rgba(59, 130, 246, 0.25);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
              overflow: hidden;
            }

            .hero-badge-pill {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 6px 14px;
              border-radius: 20px;
              background: rgba(59, 130, 246, 0.12);
              border: 1px solid rgba(59, 130, 246, 0.35);
              color: #60a5fa;
              font-size: 0.8rem;
              font-weight: 700;
              letter-spacing: 0.04em;
              margin-bottom: 18px;
            }

            .query-card {
              border-radius: 16px;
              padding: 28px 36px;
              margin-bottom: 28px;
              background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 22, 41, 0.9) 100%);
              border: 1px solid rgba(16, 185, 129, 0.3);
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
              display: flex;
              align-items: center;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 20px;
              transition: transform 0.2s ease, border-color 0.2s ease;
            }

            .query-card:hover {
              border-color: rgba(16, 185, 129, 0.5);
            }

            .query-btn {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              padding: 14px 30px;
              border-radius: 12px;
              font-size: 0.95rem;
              font-weight: 700;
              color: #ffffff;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              border: none;
              cursor: pointer;
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
              transition: all 0.25s ease;
            }

            .query-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 26px rgba(16, 185, 129, 0.45);
            }

            .modal-backdrop {
              position: fixed;
              inset: 0;
              z-index: 1100;
              background: rgba(5, 10, 22, 0.7);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding: 60px 24px 30px;
              overflow-y: auto;
              animation: fadeIn 0.2s ease;
            }

            .modal-content-card {
              width: 100%;
              max-width: 820px;
              margin-top: 10px;
              max-height: calc(100vh - 100px);
              overflow-y: auto;
              background: #0b1220;
              border: 1px solid rgba(59, 130, 246, 0.35);
              border-radius: 20px;
              padding: 36px 40px;
              box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75);
              animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            @keyframes scaleUp {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }

            .modal-field-label {
              font-size: 0.88rem;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 8px;
              display: block;
            }

            .modal-input {
              width: 100%;
              padding: 13px 16px;
              border-radius: 10px;
              border: 1px solid var(--border);
              background: var(--bg-input);
              color: var(--text-primary);
              font-size: 0.94rem;
              outline: none;
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            .modal-input:focus {
              border-color: var(--accent);
              box-shadow: 0 0 0 3px var(--accent-glow);
            }

            .feature-glass-card {
              border-radius: 16px;
              padding: 26px;
              background: #0d1525;
              border: 1px solid rgba(255, 255, 255, 0.08);
              transition: all 0.25s ease;
            }

            .feature-glass-card:hover {
              border-color: rgba(59, 130, 246, 0.35);
              transform: translateY(-3px);
            }
          `}</style>

          {/* ── High-Impact Hero Banner ────────────────────────────────────────── */}
          <div className="home-hero-card">
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <img src="/ticketflow_logo.jpg" alt="TicketFlow AI Logo" style={{ width: 76, height: 76, borderRadius: 20, border: '2px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="hero-badge-pill">
                  <Sparkles size={14} /> TicketFlow AI Customer Portal
                </div>

                <h1 style={{
                  fontSize: '2.4rem', fontWeight: 800, color: '#ffffff',
                  lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: 10
                }}>
                  {t('resolution_hub')}
                </h1>

                <p style={{
                  fontSize: '0.98rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 0
                }}>
                  {t('welcome_back')}, <strong style={{ color: '#f8fafc' }}>{userName}</strong>. {t('track_or_submit')}
                </p>
              </div>
            </div>
          </div>

          {/* ── Embedded Submit Support Ticket Form Section ─────────────────── */}
          <div className="card" style={{ padding: '36px 40px', marginBottom: 32, background: 'var(--bg-surface)', border: '1px solid var(--border-active)', borderRadius: 20, boxShadow: 'var(--shadow-md)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageSquare size={22} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {submittedTicket ? t('submitted_success') : t('submit_support_ticket')}
                </h3>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {submittedTicket ? t('analyzed_by_ai') : t('need_help_sub')}
                </div>
              </div>
            </div>

            {/* Thank You & Ticket Code Confirmation Container */}
            {submittedTicket ? (
              <div style={{ padding: '32px 24px', borderRadius: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {t('submitted_success')}
                </h3>
                <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  {t('analyzed_by_ai')}
                </p>

                {/* Displayed Ticket Code Box */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 14,
                  padding: '14px 28px', borderRadius: 12,
                  background: 'var(--bg-input)', border: '1px solid rgba(16, 185, 129, 0.4)',
                  marginBottom: 26
                }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                    {submittedTicket.code}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => copyToClipboard(submittedTicket.code)}
                    style={{ color: '#2563eb' }}
                  >
                    <Copy size={16} /> {copied ? t('copied') : t('copy_id')}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/track?id=${submittedTicket.code}`)}
                    style={{ padding: '12px 26px', fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    <ExternalLink size={16} /> {t('track_status_btn')}
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/tickets')}
                    style={{ padding: '12px 26px' }}
                  >
                    {t('view_my_queue')}
                  </button>

                  <button
                    className="btn btn-ghost"
                    onClick={() => setSubmittedTicket(null)}
                    style={{ padding: '12px 20px' }}
                  >
                    {t('submit_another')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div style={{ padding: '14px 18px', borderRadius: 10, fontSize: '0.88rem', marginBottom: 20, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertCircle size={18} /> <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  {/* Subject Field */}
                  <div style={{ marginBottom: 20 }}>
                    <label className="modal-field-label">{t('ticket_subject_req')}</label>
                    <input
                      id="ticket-subject-input"
                      type="text"
                      className="modal-input"
                      placeholder={t('subject_placeholder')}
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  {/* Detailed Description */}
                  <div style={{ marginBottom: 22 }}>
                    <label className="modal-field-label">{t('detailed_desc_req')}</label>
                    
                    {/* Formatting Toolbar */}
                    <div style={{
                      display: 'flex', gap: 6, padding: '8px 12px',
                      background: 'var(--bg-input)',
                      borderRadius: '10px 10px 0 0',
                      border: '1px solid var(--border)',
                      borderBottom: 'none'
                    }}>
                      <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} title="Bold" onClick={() => insertFormatting('**', '**')}>
                        <Bold size={14} />
                      </button>
                      <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} title="Italic" onClick={() => insertFormatting('*', '*')}>
                        <Italic size={14} />
                      </button>
                      <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} title="Bulleted List" onClick={() => insertFormatting('- ')}>
                        <List size={14} />
                      </button>
                      <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} title="Insert Link" onClick={() => insertFormatting('[', '](https://)')}>
                        <Link2 size={14} />
                      </button>
                      <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} title="Mention User" onClick={() => insertFormatting('@')}>
                        <AtSign size={14} />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      id="ticket-desc-input"
                      className="modal-input"
                      style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, minHeight: 140, padding: 14, resize: 'vertical' }}
                      placeholder={t('desc_placeholder')}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  {/* File Upload Zone */}
                  <div style={{ marginBottom: 24 }}>
                    <label className="modal-field-label">{t('file_attachments')}</label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onClick={() => document.getElementById('file-input-homepage').click()}
                      style={{
                        border: `2px dashed ${dragOver ? '#3b82f6' : 'var(--border)'}`,
                        borderRadius: 12,
                        padding: '24px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragOver ? 'var(--accent-dim)' : 'var(--bg-input)',
                        transition: 'all 0.2s ease',
                      }}>
                      <Upload size={24} color="#64748b" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#cbd5e1', marginBottom: 2 }}>{t('drag_drop_text')}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{t('upload_hint')}</div>
                      <input id="file-input-homepage" type="file" multiple hidden onChange={e => setFiles(f => [...f, ...Array.from(e.target.files)])} />
                    </div>
                    {files.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {files.map((f, i) => (
                          <span key={i} className="chip">
                            {f.name}
                            <X size={12} style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Duplicate Ticket Warning */}
                  {duplicateWarning && (
                    <div style={{ marginBottom: 16, padding: '14px 18px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fbbf24', marginBottom: 3 }}>Possible Duplicate Ticket Detected</div>
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                            You already have a similar open ticket: <strong style={{ color: '#f1f5f9' }}>{duplicateWarning.subject}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(`/tickets/${duplicateWarning.id}`)} style={{ padding: '5px 12px' }}>
                              View Existing Ticket
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => handleSubmit(e, true)} style={{ padding: '5px 12px' }}>
                              Submit Anyway
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
                    <button
                      type="submit"
                      className="query-btn"
                      disabled={submitting}
                      style={{ padding: '14px 36px', fontSize: '1rem', fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <Send size={18} /> {submitting ? t('submitting') : t('submit_btn')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>





        </div>
      </div>
    </div>
  )
}
