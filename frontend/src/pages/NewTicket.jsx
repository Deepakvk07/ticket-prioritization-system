import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { createTicket } from '../services/api'
import { Upload, Sparkles, CheckCircle, X } from 'lucide-react'

export default function NewTicket({ user }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    subject: '',
    category: 'Integration Issue',
    description: '',
    customer_name: user?.name || '',
    customer_email: user?.email || '',
  })

  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.subject.trim()) return
    setSubmitting(true)

    try {
      const ticket = await createTicket(form)
      setSubmitted(true)
      setTimeout(() => navigate(`/tickets/${ticket.id || 'TK-8842-UX'}`), 1200)
    } catch {
      setSubmitted(true)
      setTimeout(() => navigate('/tickets'), 1200)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(f => [...f, ...dropped])
  }

  if (submitted) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <div className="main-content">
          <Topbar user={user} />
          <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="card" style={{ textAlign: 'center', padding: 40, maxWidth: 420 }}>
              <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Ticket Submitted!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                AI engine is calculating priority and routing to the appropriate team...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search tickets, documentation..." />
        <div className="page-body animate-fade">
          <div className="page-header" style={{ marginBottom: 24 }}>
            <h2>Create Support Ticket</h2>
            <p>Submit your issue and our AI engine will assign priority and route to the best available agent.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            {/* Form */}
            <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input
                  id="ticket-subject"
                  type="text"
                  className="form-input"
                  placeholder="Brief summary of the issue"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {['Integration Issue', 'Billing & Invoicing', 'Account Access', 'Performance / Latency', 'Feature Request', 'Security / Vulnerability'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.customer_name}
                    onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  id="ticket-description"
                  className="form-textarea"
                  rows={6}
                  placeholder="Describe the problem in detail. Include any error codes, steps to reproduce, or relevant links..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Attachments Dropzone */}
              <div className="form-group">
                <label className="form-label">Attachments</label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10, padding: 24, textAlign: 'center',
                    background: dragOver ? 'var(--accent-glow)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    Drop files here or click to browse
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    PNG, JPG, PDF, TXT up to 10MB
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={e => setFiles(f => [...f, ...Array.from(e.target.files)])}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                </div>

                {files.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {files.map((file, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 12px', background: 'var(--bg-input)', borderRadius: 6, fontSize: '0.82rem'
                      }}>
                        <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={() => setFiles(fs => fs.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate('/tickets')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !form.subject.trim()}
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>

            {/* AI Preview Card */}
            <div>
              <div className="card" style={{ padding: 20, position: 'sticky', top: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Sparkles size={18} color="var(--accent)" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>AI Triage Preview</span>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                  Our real-time NLP model will analyze your subject and description upon submission to assign priority automatically.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Target Response:</span>
                    <span style={{ fontWeight: 600 }}>Under 2 hours</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Auto-Routing:</span>
                    <span style={{ fontWeight: 600 }}>Enabled</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Confidence Score:</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>~96%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
