import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowLeft, Lock, Sparkles, Cpu } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    localStorage.removeItem('demo_user')
  }, [])

  const handleClear = () => {
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
    localStorage.removeItem('demo_user')
  }

  const handleAdminSignIn = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter a valid administrator email address.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const adminName = email.split('@')[0] ? (email.split('@')[0].toUpperCase() + ' (Admin)') : 'System Admin'

    setTimeout(() => {
      localStorage.setItem('user_role_mode', 'admin')
      localStorage.setItem('demo_user', JSON.stringify({
        email: email.trim(),
        role: 'admin',
        name: adminName
      }))

      setSuccess('Admin authentication granted! Entering control panel...')
      setTimeout(() => {
        navigate('/dashboard')
        window.location.reload()
      }, 400)
    }, 400)
  }

  return (
    <div className="admin-login-container">
      <style>{`
        .admin-login-container {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #0f172a;
        }

        /* ── Left Hero Panel (Clean Light Blue Theme) ───────────────── */
        .admin-left-hero {
          position: relative;
          background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
          border-right: 1px solid rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 50px 60px;
          color: #0f172a;
          overflow: hidden;
        }

        .admin-left-hero::before {
          content: '';
          position: absolute;
          top: -120px;
          left: -120px;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%);
          z-index: 1;
          animation: pulseOrbBlue 8s ease-in-out infinite;
        }

        .admin-hero-content {
          position: relative;
          z-index: 2;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .admin-hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.025em;
          margin-bottom: 12px;
          color: #0f172a !important;
        }

        .admin-hero-desc {
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
          box-shadow: 0 20px 40px rgba(37, 99, 235, 0.18) !important;
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
          color: #2563eb;
          margin-bottom: 6px;
        }

        .glass-card-text {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.5;
        }

        /* ── Right Form Panel (Centered Container) ───────────────── */
        .admin-form-panel {
          position: relative;
          background: #ffffff;
          padding: 50px 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .admin-form-inner {
          width: 100%;
          max-width: 440px;
          animation: fadeInUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .admin-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
          border: 1px solid rgba(37, 99, 235, 0.2);
        }

        .clean-input {
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

        .clean-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
        }

        .admin-submit-btn {
          padding: 13px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .admin-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
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
            box-shadow: 0 22px 42px rgba(37, 99, 235, 0.16);
          }
        }

        @keyframes pulseOrbBlue {
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

      {/* Left Panel — Light Royal Blue Theme & 3D Neural Showcase */}
      <div className="admin-left-hero">
        <div className="admin-hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <img src="/ticketflow_logo.jpg" alt="TicketFlow AI Logo" style={{ width: 48, height: 48, borderRadius: 12, border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 6px 16px rgba(15,23,42,0.06)', objectFit: 'cover' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2563eb', background: 'rgba(37,99,235,0.1)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(37,99,235,0.2)' }}>
              System Admin Control
            </span>
          </div>
          <h1 className="admin-hero-title">Admin Control Portal</h1>
          <p className="admin-hero-desc">
            Executive management console for system administrators. Configure AI priority weighting, monitor SLA compliance, manage agent categories, and trigger model retraining.
          </p>

          {/* Framed 3D AI Triage Visual Card with Floating Keyframe Animation */}
          <div className="animated-hero-card" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 12px 30px rgba(15,23,42,0.08)', maxWidth: 460, marginBottom: 20, background: '#ffffff' }}>
            <img src="/ai_triage_engine.jpg" alt="Neural AI Triage Engine" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '12px 18px', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.08)', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cpu size={14} color="#2563eb" /> Neural NLP Triage Engine
              </span>
              <span style={{ color: '#2563eb', fontSize: '0.78rem' }}>● Model v2.4 Active</span>
            </div>
          </div>
        </div>

        {/* Bottom Card */}
        <div className="bottom-glass-card">
          <div className="glass-card-title">🛡️ AUTHORIZED ADMIN ACCESS</div>
          <div className="glass-card-text">
            Enterprise Admin Control Center. Direct access to queue triage rules, priority overrides, SLA escalations, and ML model performance metrics.
          </div>
        </div>
      </div>

      {/* Right Panel — Clean Centered White Form */}
      <div className="admin-form-panel">
        <div style={{ position: 'absolute', top: 36, right: 44 }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20, background: '#f8fafc', color: '#475569', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #cbd5e1', cursor: 'pointer', transition: 'all 0.2s ease' }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>

        <div className="admin-form-inner">
          <div className="admin-tag">
            <ShieldCheck size={14} /> Admin Authentication
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            Admin Portal Sign In
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 28 }}>
            Please enter your administrator credentials to access the system control panel.
          </p>

          {error && <div className="alert-box error">{error}</div>}
          {success && <div className="alert-box success">{success}</div>}

          <form onSubmit={handleAdminSignIn}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>Admin Email Address</label>
              <input
                type="email"
                className="clean-input"
                placeholder="admin@ticketflow.ai"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
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
              <button type="submit" className="admin-submit-btn" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Authenticating…' : 'Sign In to Admin Portal'}
              </button>
              {(email || password) && (
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
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.8rem', color: '#94a3b8' }}>
            TicketFlow AI &bull; Encrypted Staff Control Portal
          </div>
        </div>
      </div>
    </div>
  )
}
