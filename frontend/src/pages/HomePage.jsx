import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { createTicket, uploadToImgBB, getTickets } from '../services/api'
import {
  Settings, RefreshCw, HelpCircle, Send, Copy, ExternalLink,
  Search, CheckCircle2, AlertCircle, Upload, X, Bold, Italic, List, Link2, AtSign,
  MessageSquare, ShieldCheck, FileText, ArrowRight, User
} from 'lucide-react'

export default function HomePage({ user }) {
  const navigate = useNavigate()
  const email = user?.email || ''
  const userName = user?.name || user?.user_metadata?.full_name || (email ? email.split('@')[0] : 'Valued Customer')

  // Form State
  const [activeTab, setActiveTab] = useState('home') // 'home' | 'new-ticket' | 'status-check' | 'faq'
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Technical Support')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState(email)
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)

  // Ticket Search / Track State
  const [searchCode, setSearchCode] = useState('')

  const textareaRef = useRef(null)

  // Status & Messaging
  const [submitting, setSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  // Formatting Toolbar
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

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(f => [...f, ...dropped])
  }

  // Handle Ticket Submit
  const handleSubmit = async (e, forceSubmit = false) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!subject.trim() || !description.trim()) return

    setSubmitting(true)
    setErrorMsg('')

    if (!forceSubmit) {
      try {
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
      } catch { /* ignore */ }
    }

    setDuplicateWarning(null)

    try {
      const attachmentData = await Promise.all(
        files.map(async (f) => {
          const sizeStr = `${(f.size / 1024).toFixed(1)} KB`
          if (f.type.startsWith('image/')) {
            try {
              const imgbb = await uploadToImgBB(f)
              return { name: f.name, size: sizeStr, type: 'image', url: imgbb.url }
            } catch {
              return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = (ev) => resolve({ name: f.name, size: sizeStr, type: 'image', url: ev.target.result })
                reader.readAsDataURL(f)
              })
            }
          } else {
            return new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = (ev) => resolve({ name: f.name, size: sizeStr, type: 'text', content: ev.target.result, url: null })
              reader.onerror = () => resolve({ name: f.name, size: sizeStr, type: 'text', content: '', url: null })
              reader.readAsText(f)
            })
          }
        })
      )

      const payload = {
        subject,
        description,
        category: category || 'Technical Support',
        product_module: category || 'Technical Support',
        customer_name: userName,
        customer_email: contactEmail || email || '',
        priority: 'High',
        attachments: attachmentData
      }

      const ticket = await createTicket(payload)
      setSubmittedTicket(ticket)
      setSubject('')
      setDescription('')
      setFiles([])
    } catch (err) {
      setErrorMsg(`Submission error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTrackSearch = (e) => {
    e.preventDefault()
    if (!searchCode.trim()) return
    navigate(`/track?id=${encodeURIComponent(searchCode.trim())}`)
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
        <Topbar user={user} placeholder="Search knowledge base, tickets..." />

        <div className="page-body animate-fade">

          <style>{`
            .helpdesk-header-bar {
              background: #0f172a;
              color: #f8fafc;
              border-radius: 12px 12px 0 0;
              padding: 12px 24px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 0.88rem;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-bottom: none;
            }

            .helpdesk-nav-link {
              color: #94a3b8;
              text-decoration: none;
              font-weight: 500;
              cursor: pointer;
              transition: color 0.2s;
              background: none;
              border: none;
              font-size: 0.86rem;
            }

            .helpdesk-nav-link:hover, .helpdesk-nav-link.active {
              color: #38bdf8;
            }

            .portal-hero-banner {
              position: relative;
              background: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.95) 100%), url('/login_hero_bg.jpg') center/cover;
              border-radius: 0 0 16px 16px;
              padding: 48px 40px;
              text-align: center;
              color: #ffffff;
              border: 1px solid rgba(255, 255, 255, 0.1);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
              margin-bottom: 32px;
            }

            .portal-hero-title {
              font-size: 2.2rem;
              font-weight: 900;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              color: #ffffff;
              margin-bottom: 14px;
              text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }

            .portal-hero-desc {
              font-size: 0.94rem;
              color: #cbd5e1;
              line-height: 1.7;
              max-width: 820px;
              margin: 0 auto;
            }

            .helpdesk-card-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 24px;
              margin-bottom: 36px;
            }

            @media (max-width: 900px) {
              .helpdesk-card-grid {
                grid-template-columns: 1fr;
              }
            }

            .portal-action-card {
              background: var(--bg-card);
              border: 1px solid var(--border);
              border-radius: 16px;
              padding: 32px 28px;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
              box-shadow: var(--shadow-sm);
            }

            .portal-action-card:hover {
              transform: translateY(-5px);
              border-color: #6366f1;
              box-shadow: 0 16px 32px rgba(99, 102, 241, 0.15);
            }

            .card-icon-badge {
              width: 58px;
              height: 58px;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 18px;
              transition: transform 0.3s ease;
            }

            .portal-action-card:hover .card-icon-badge {
              transform: scale(1.1) rotate(4deg);
            }

            .action-btn-primary {
              background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
              color: #ffffff;
              font-weight: 700;
              font-size: 0.9rem;
              padding: 11px 24px;
              border-radius: 10px;
              border: none;
              cursor: pointer;
              box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
              transition: all 0.2s ease;
              width: 100%;
              margin-top: 18px;
            }

            .action-btn-primary:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 22px rgba(99, 102, 241, 0.45);
            }

            .helpdesk-footer-bar {
              background: var(--bg-card);
              border: 1px solid var(--border);
              border-radius: 14px;
              padding: 20px 28px;
              text-align: center;
              color: var(--text-muted);
              font-size: 0.84rem;
              margin-top: 32px;
            }

            .modal-input {
              width: 100%;
              padding: 12px 16px;
              border-radius: 10px;
              border: 1px solid var(--border);
              background: var(--bg-input);
              color: var(--text-primary);
              font-size: 0.92rem;
              outline: none;
            }

            .modal-input:focus {
              border-color: #6366f1;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
            }
          `}</style>

          {/* ── Top Dark Navigation Header Bar ───────────────────────────────── */}
          <div className="helpdesk-header-bar">
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/ticketflow_logo.jpg" alt="Logo" style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover' }} />
              <span>TicketFlow.ai : Support Helpdesk</span>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <button
                className={`helpdesk-nav-link ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                Support Center Home
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <button
                className={`helpdesk-nav-link ${activeTab === 'new-ticket' ? 'active' : ''}`}
                onClick={() => setActiveTab('new-ticket')}
              >
                Open a New Ticket
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <button
                className={`helpdesk-nav-link ${activeTab === 'status-check' ? 'active' : ''}`}
                onClick={() => setActiveTab('status-check')}
              >
                Check Ticket Status
              </button>
            </div>
          </div>

          {/* ── Main Hero Banner (Matching requested Customer Portal design) ──── */}
          <div className="portal-hero-banner">
            <h1 className="portal-hero-title">CUSTOMER-TICKET PORTAL</h1>
            <p className="portal-hero-desc">
              In order to streamline support requests and better serve you, we utilize a support ticket system.
              Every support request is assigned a unique ticket number which you can use to track the progress
              and responses online. For your reference we provide complete archives and history of all your support requests.
              A valid email address is required to submit a ticket.
            </p>
          </div>

          {/* ── 3 Main Portal Action Cards Grid ─────────────────────────────── */}
          <div className="helpdesk-card-grid">

            {/* Card 1: Open a New Ticket */}
            <div className="portal-action-card">
              <div className="card-icon-badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                <Settings size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                Open a New Ticket
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>
                Please provide as much detail as possible so we can best assist you. To update a previously submitted ticket, please sign in.
              </p>
              <button
                className="action-btn-primary"
                onClick={() => setActiveTab('new-ticket')}
              >
                Open a New Ticket
              </button>
            </div>

            {/* Card 2: Check Ticket Status */}
            <div className="portal-action-card">
              <div className="card-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <RefreshCw size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                Check Ticket Status
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>
                We provide archives and history of all your current and past support requests complete with specialist responses.
              </p>
              <button
                className="action-btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
                onClick={() => setActiveTab('status-check')}
              >
                Check Ticket Status
              </button>
            </div>

            {/* Card 3: Frequently Asked Questions */}
            <div className="portal-action-card">
              <div className="card-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <HelpCircle size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                Frequently Asked Questions
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>
                Be sure to browse our Frequently Asked Questions and documentation articles before opening a new ticket.
              </p>
              <button
                className="action-btn-primary"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}
                onClick={() => navigate('/faq')}
              >
                Search FAQ & Knowledge Base
              </button>
            </div>

          </div>

          {/* ── Active Tab View: Open New Ticket Form ──────────────────────── */}
          {activeTab === 'new-ticket' && (
            <div className="card" style={{ padding: '36px 40px', borderRadius: 20, marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Settings size={22} color="#6366f1" />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Submit a Support Ticket
                  </h2>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('home')}>Close Form</button>
              </div>

              {submittedTicket ? (
                <div style={{ padding: 32, borderRadius: 16, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                  <CheckCircle2 size={54} color="#10b981" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Thank you! Your ticket has been registered.
                  </h3>
                  <div style={{ background: 'var(--bg-input)', padding: '14px 24px', borderRadius: 12, display: 'inline-block', margin: '16px 0', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>YOUR UNIQUE TICKET ID</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                      {submittedTicket.ticket_code || submittedTicket.code || 'TK-NEW'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={() => navigate(`/tickets/${submittedTicket.id}`)}>
                      View Ticket Details
                    </button>
                    <button className="btn btn-secondary" onClick={() => setSubmittedTicket(null)}>
                      Submit Another Ticket
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {errorMsg && (
                    <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', marginBottom: 20, fontSize: '0.88rem' }}>
                      {errorMsg}
                    </div>
                  )}

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                      Ticket Subject *
                    </label>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="Brief summary of the issue..."
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div>
                      <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                        Category
                      </label>
                      <select
                        className="modal-input"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                      >
                        <option>Database & Infrastructure</option>
                        <option>Web & UI/UX</option>
                        <option>Billing & Integrations</option>
                        <option>API & Security</option>
                        <option>Technical Support</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                        Your Contact Email *
                      </label>
                      <input
                        type="email"
                        className="modal-input"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                      Detailed Description *
                    </label>
                    <div style={{ display: 'flex', gap: 6, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '10px 10px 0 0', border: '1px solid var(--border)', borderBottom: 'none' }}>
                      <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => insertFormatting('**', '**')}><Bold size={13} /></button>
                      <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => insertFormatting('*', '*')}><Italic size={13} /></button>
                      <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => insertFormatting('- ')}><List size={13} /></button>
                      <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => insertFormatting('[', '](https://)')}><Link2 size={13} /></button>
                    </div>
                    <textarea
                      ref={textareaRef}
                      className="modal-input"
                      style={{ borderRadius: '0 0 10px 10px', minHeight: 130, padding: 14, resize: 'vertical' }}
                      placeholder="Please provide full error codes, steps to reproduce, or specific questions..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                      Attachments (Logs, Screenshots)
                    </label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onClick={() => document.getElementById('file-input-helpdesk').click()}
                      style={{
                        border: `2px dashed ${dragOver ? '#6366f1' : 'var(--border)'}`,
                        borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer',
                        background: dragOver ? 'rgba(99,102,241,0.08)' : 'var(--bg-input)',
                      }}
                    >
                      <Upload size={22} color="#64748b" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>Click to upload or drag & drop files here</div>
                      <input id="file-input-helpdesk" type="file" multiple hidden onChange={e => setFiles(f => [...f, ...Array.from(e.target.files)])} />
                    </div>
                    {files.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {files.map((f, i) => (
                          <span key={i} className="chip">
                            {f.name} <X size={12} style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {duplicateWarning && (
                    <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, marginBottom: 20 }}>
                      <div style={{ fontSize: '0.86rem', color: '#fbbf24', fontWeight: 700, marginBottom: 4 }}>Possible Duplicate Detected</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Similar open ticket found: {duplicateWarning.subject}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => handleSubmit(e, true)}>Submit Anyway</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('home')}>Cancel</button>
                    <button type="submit" className="action-btn-primary" style={{ width: 'auto', padding: '12px 32px' }} disabled={submitting}>
                      {submitting ? 'Creating Ticket...' : 'Submit Ticket'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Active Tab View: Check Ticket Status Search ─────────────────── */}
          {activeTab === 'status-check' && (
            <div className="card" style={{ padding: '36px 40px', borderRadius: 20, marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <RefreshCw size={22} color="#10b981" />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Check Ticket Status
                  </h2>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('home')}>Close</button>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 24 }}>
                Enter your unique ticket number (e.g. <strong>TK-8842</strong>) to track real-time resolution progress and responses.
              </p>

              <form onSubmit={handleTrackSearch} style={{ display: 'flex', gap: 12, maxWidth: 540 }}>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Enter Ticket ID (e.g. TK-8842)..."
                  value={searchCode}
                  onChange={e => setSearchCode(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
                <button type="submit" className="action-btn-primary" style={{ width: 'auto', padding: '11px 24px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <Search size={16} /> Track Status
                </button>
              </form>

              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
                <button className="btn btn-secondary" onClick={() => navigate('/tickets')}>
                  View All My Submitted Tickets
                </button>
              </div>
            </div>
          )}

          {/* ── Bottom Helpdesk Footer Bar ──────────────────────────────────── */}
          <div className="helpdesk-footer-bar">
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              TicketFlow.ai : Support Helpdesk @ 2026
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Dedicated Incident Resolution & SLA Management System
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
