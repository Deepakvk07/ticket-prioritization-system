import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Headphones, Eye, EyeOff, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, UserPlus, Layers, Pencil } from 'lucide-react'

const SPECIALIST_CATEGORIES = [
  { label: '🗄️ Database & Infrastructure', value: 'Database & Infrastructure' },
  { label: '🎨 Web & UI/UX Frontend', value: 'Web & UI/UX' },
  { label: '💳 Billing & Integrations', value: 'Billing & Integrations' },
  { label: '⚡ API Services & Security', value: 'API & Security' },
  { label: '🛠️ General Technical Support', value: 'Technical Support' },
]

export default function AgentLogin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('signin') // 'signin' | 'register'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [specialistCategory, setSpecialistCategory] = useState('Database & Infrastructure')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    localStorage.removeItem('demo_user')
  }, [])

  const handleClear = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
    localStorage.removeItem('demo_user')
  }

  const handleAgentSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter a valid agent email address.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const agentName = tab === 'register'
      ? (fullName.trim() || email.split('@')[0])
      : (email.split('@')[0] || 'Support Specialist')

    setTimeout(() => {
      const newAgentObj = {
        email: email.trim(),
        role: 'agent',
        name: agentName,
        department: specialistCategory,
        status: 'Online',
        registered_at: new Date().toISOString()
      }

      // If registering a new agent, persist to registered_agents list
      if (tab === 'register') {
        try {
          const existingRaw = localStorage.getItem('registered_agents')
          const existing = existingRaw ? JSON.parse(existingRaw) : []
          const filtered = Array.isArray(existing) ? existing.filter(a => a.email.toLowerCase() !== email.trim().toLowerCase()) : []
          filtered.push(newAgentObj)
          localStorage.setItem('registered_agents', JSON.stringify(filtered))
        } catch (e) {
          localStorage.setItem('registered_agents', JSON.stringify([newAgentObj]))
        }
      }

      localStorage.setItem('user_role_mode', 'agent')
      localStorage.setItem('demo_user', JSON.stringify(newAgentObj))

      setSuccess(tab === 'signin' ? 'Sign in successful! Loading agent queue...' : 'Agent account registered! Entering workspace...')
      setTimeout(() => {
        navigate('/tickets')
        window.location.reload()
      }, 400)
    }, 400)
  }

  return (
    <div className="agent-login-container">
      <style>{`
        .agent-login-container {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #0f172a;
        }

        /* ── Left Hero Panel (Clean Light Mint Theme) ───────────────── */
        .agent-left-hero {
          position: relative;
          background: linear-gradient(135deg, #f0fdf4 0%, #e6f4ed 100%);
          border-right: 1px solid rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 50px 60px;
          color: #0f172a;
          overflow: hidden;
        }

        .agent-left-hero::before {
          content: '';
          position: absolute;
          top: -120px;
          left: -120px;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
          z-index: 1;
          animation: pulseOrb 8s ease-in-out infinite;
        }

        .agent-hero-content {
          position: relative;
          z-index: 2;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .agent-hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.025em;
          margin-bottom: 12px;
          color: #0f172a !important;
        }

        .agent-hero-desc {
          font-size: 1rem;
          color: #334155 !important;
          line-height: 1.6;
          max-width: 460px;
          margin-bottom: 24px;
        }

        .animated-hero-card {
          animation: floatHeroCard 5s ease-in-out infinite;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animated-hero-card:hover {
          animation-play-state: paused;
          transform: translateY(-8px) scale(1.015);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.18) !important;
        }

        .bottom-glass-card {
          position: relative;
          z-index: 2;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 16px;
          padding: 22px 26px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
          max-width: 460px;
          animation: fadeInUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .glass-card-title {
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #059669;
          margin-bottom: 6px;
        }

        .glass-card-text {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.5;
        }

        /* ── Right Form Panel (Centered Container) ───────────────── */
        .agent-form-panel {
          position: relative;
          background: #ffffff;
          padding: 50px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .agent-form-inner {
          width: 100%;
          max-width: 440px;
          animation: fadeInUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .agent-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        /* Segmented Pill Control */
        .segmented-pill-container {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .segmented-pill-btn {
          flex: 1;
          padding: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .segmented-pill-btn.active {
          background: #ffffff;
          color: #059669;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        }

        .clean-input, .clean-select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.92rem;
          color: #0f172a;
          outline: none;
          background: #ffffff;
          transition: all 0.2s ease;
        }

        .clean-input:focus, .clean-select:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
        }

        .agent-submit-btn {
          padding: 13px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .agent-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
        }

        .alert-box {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          margin-bottom: 16px;
        }
        .alert-box.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .alert-box.success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        @keyframes floatHeroCard {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          }
          50% {
            transform: translateY(-8px);
            box-shadow: 0 22px 42px rgba(16, 185, 129, 0.16);
          }
        }

        @keyframes pulseOrb {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Left Panel — Light Mint Theme & 3D Workflow Showcase */}
      <div className="agent-left-hero">
        <div className="agent-hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <img src="/ticketflow_logo.jpg" alt="TicketFlow AI Logo" style={{ width: 48, height: 48, borderRadius: 12, border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 6px 16px rgba(15,23,42,0.06)', objectFit: 'cover' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#059669', background: 'rgba(16,185,129,0.1)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>
              Support Engineer Portal
            </span>
          </div>
          <h1 className="agent-hero-title">Support Agent Portal</h1>
          <p className="agent-hero-desc">
            Dedicated resolution workspace for support engineers. Register as a category specialist to handle assigned tickets, update SLA status, and communicate with customers.
          </p>

          {/* Framed 3D Workflow Visual Card with Floating Keyframe Animation */}
          <div className="animated-hero-card" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 12px 30px rgba(15,23,42,0.08)', maxWidth: 460, marginBottom: 20, background: '#ffffff' }}>
            <img src="/ticket_workflow_3d.jpg" alt="3D Support Workflow" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '12px 18px', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.08)', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>🎧 Category Specialist Triage</span>
              <span style={{ color: '#059669', fontSize: '0.78rem' }}>● Real-time Sync</span>
            </div>
          </div>
        </div>

        {/* Bottom Card */}
        <div className="bottom-glass-card">
          <div className="glass-card-title">⚡ CATEGORY SPECIALIST ROUTING</div>
          <div className="glass-card-text">
            Incoming tickets are automatically routed to registered specialists based on domain expertise and SLA queue priorities.
          </div>
        </div>
      </div>

      {/* Right Panel — Clean Centered White Form */}
      <div className="agent-form-panel">
        <div style={{ position: 'absolute', top: 36, right: 44 }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20, background: '#f8fafc', color: '#475569', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #cbd5e1', cursor: 'pointer', transition: 'all 0.2s ease' }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>

        <div className="agent-form-inner">
          <div className="agent-tag">
            <Headphones size={14} /> {tab === 'signin' ? 'Agent Authentication' : 'Agent Registration'}
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            {tab === 'signin' ? 'Support Staff Login' : 'Register New Agent'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 20 }}>
            {tab === 'signin'
              ? 'Sign in to access your assigned tickets and engineer dashboard.'
              : 'Register your agent profile and select your primary specialist category.'}
          </p>

          {/* Segmented Control Pill */}
          <div className="segmented-pill-container">
            <button
              type="button"
              className={`segmented-pill-btn ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => { setTab('signin'); setError(''); setSuccess(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`segmented-pill-btn ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
            >
              Register Agent
            </button>
          </div>

          {error && <div className="alert-box error">{error}</div>}
          {success && <div className="alert-box success">{success}</div>}

          <form onSubmit={handleAgentSubmit}>
            {/* Full Name field — Only shown when Register Agent tab is active */}
            {tab === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>Full Name</label>
                <input
                  type="text"
                  className="clean-input"
                  placeholder="e.g. Alex Johnson"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>Agent Email Address</label>
              <input
                type="email"
                className="clean-input"
                placeholder="agent@ticketflow.ai"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Specialist Category Dropdown — Only shown when Register Agent tab is active */}
            {tab === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={14} color="#059669" /> Specialist Category / Expertise
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', color: '#059669', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600 }}>
                    <Pencil size={12} /> Select Category
                  </span>
                </label>
                <select
                  className="clean-select"
                  value={specialistCategory}
                  onChange={e => setSpecialistCategory(e.target.value)}
                  required
                >
                  {SPECIALIST_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="clean-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="agent-submit-btn" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Processing…' : tab === 'signin' ? 'Sign In to Agent Portal' : 'Register Agent Profile'}
              </button>
              {(fullName || email || password) && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    marginTop: 12
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: '#94a3b8' }}>
            TicketFlow AI &bull; Specialist Resolution Engine
          </div>
        </div>
      </div>
    </div>
  )
}
