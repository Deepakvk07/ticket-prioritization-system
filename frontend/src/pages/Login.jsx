import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { registerCustomer, signInCustomer } from '../services/customers'
import { Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.removeItem('demo_user')
  }, [])

  const [tab, setTab] = useState('signin') // 'signin' | 'create'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleClearInputs = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
    localStorage.removeItem('demo_user')
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    const userName = fullName.trim() || email.split('@')[0]
    const userEmail = email.trim().toLowerCase()

    try {
      let userObj
      if (tab === 'signin') {
        // Try Supabase customers table first
        userObj = await signInCustomer(userEmail, password)
        if (!userObj) {
          setError('No account found with these credentials. Please create an account first.')
          setLoading(false)
          return
        }
      } else {
        // Register new customer in Supabase
        userObj = await registerCustomer({ name: userName, email: userEmail, password })
        // Also try Supabase Auth
        await supabase.auth.signUp({
          email: userEmail, password,
          options: { data: { role: 'customer', full_name: userName } }
        }).catch(() => null)
      }

      localStorage.setItem('user_role_mode', 'customer')
      localStorage.setItem('demo_user', JSON.stringify({ ...userObj, role: 'customer' }))

      setSuccess(tab === 'signin' ? 'Sign in successful! Entering customer home...' : 'Account created! Entering customer home...')
      setTimeout(() => {
        navigate('/home')
        window.location.reload()
      }, 400)
    } catch (err) {
      console.error('Customer auth error:', err)
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const GOOGLE_CLIENT_ID = '594894394165-c8eitnagvmaa1hmkqog6jds56h5gf1gd.apps.googleusercontent.com'

  const handleOAuth = async (provider) => {
    if (provider === 'google') {
      setLoading(true)
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            queryParams: {
              client_id: GOOGLE_CLIENT_ID,
              access_type: 'offline',
              prompt: 'consent'
            },
            redirectTo: `${window.location.origin}/home`
          }
        })
        if (error) {
          // Fallback to instant login if provider is disabled in Supabase dashboard
          console.warn('Supabase Google OAuth provider disabled, using instant session fallback:', error.message)
          const userObj = {
            email: 'google.user@ticketflow.ai',
            name: 'Google Customer',
            role: 'customer'
          }
          localStorage.setItem('user_role_mode', 'customer')
          localStorage.setItem('demo_user', JSON.stringify(userObj))
          navigate('/home')
          window.location.reload()
        }
      } catch {
        const userObj = {
          email: 'google.user@ticketflow.ai',
          name: 'Google Customer',
          role: 'customer'
        }
        localStorage.setItem('user_role_mode', 'customer')
        localStorage.setItem('demo_user', JSON.stringify(userObj))
        navigate('/home')
        window.location.reload()
      } finally {
        setLoading(false)
      }
    } else {
      const userObj = {
        email: 'oauth.user@ticketflow.ai',
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        role: 'customer'
      }
      localStorage.setItem('user_role_mode', 'customer')
      localStorage.setItem('demo_user', JSON.stringify(userObj))
      navigate('/home')
      window.location.reload()
    }
  }

  return (
    <div className="login-container">
      <style>{`
        .login-container {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #0f172a;
        }

        /* ── Left Architectural Panel (Minimalist Light Theme) ───────────────── */
        .left-hero {
          position: relative;
          background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
          border-right: 1px solid rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 50px 60px;
          color: #0f172a;
          overflow: hidden;
        }

        .left-hero::before {
          content: '';
          position: absolute;
          top: -120px;
          left: -120px;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.09) 0%, transparent 70%);
          z-index: 1;
          animation: pulseOrb 8s ease-in-out infinite;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.025em;
          margin-bottom: 12px;
          color: #0f172a !important;
          text-shadow: none;
        }

        .hero-desc {
          font-size: 1rem;
          color: #334155 !important;
          line-height: 1.6;
          max-width: 460px;
          margin-bottom: 24px;
          text-shadow: none;
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

        /* Glass Card at Bottom Left */
        .bottom-glass-card {
          position: relative;
          z-index: 2;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 14px;
          padding: 20px 24px;
          color: #0f172a;
          max-width: 460px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }

        .glass-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #059669;
          margin-bottom: 8px;
        }

        .glass-card-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059669;
        }

        .glass-card-text {
          font-size: 0.84rem;
          color: #475569;
          line-height: 1.5;
        }

        /* Right Form Panel */
        .right-form-panel {
          background: #ffffff;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .right-form-inner {
          width: 100%;
          max-width: 440px;
        }

        .admin-link-badge {
          position: absolute;
          top: 40px;
          right: 60px;
        }

        .admin-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .admin-link-btn:hover {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        .form-heading {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .form-subtitle {
          font-size: 0.92rem;
          color: #64748b;
          margin-bottom: 32px;
        }

        /* Segmented Control Pill Bar */
        .segmented-pill-container {
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          margin-bottom: 28px;
        }

        .segmented-pill-btn {
          padding: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .segmented-pill-btn.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        /* Form Inputs */
        .form-field {
          margin-bottom: 20px;
        }

        .field-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .field-label {
          font-size: 0.84rem;
          font-weight: 600;
          color: #334155;
        }

        .forgot-link {
          font-size: 0.8rem;
          color: #64748b;
          cursor: pointer;
          text-decoration: none;
        }
        .forgot-link:hover {
          color: #0f172a;
        }

        .input-relative {
          position: relative;
        }

        .clean-text-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.92rem;
          color: #0f172a;
          outline: none;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .clean-text-input:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
        }

        .clean-text-input::placeholder {
          color: #94a3b8;
        }

        .eye-toggle-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
        }

        /* Main Primary Button */
        .main-submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 10px;
          margin-bottom: 28px;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          transition: all 0.2s ease;
        }

        .main-submit-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
        }

        /* Divider */
        .divider-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .divider-text {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #94a3b8;
          text-transform: uppercase;
        }

        /* OAuth Grid */
        .oauth-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 36px;
        }

        .oauth-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 11px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .oauth-btn:hover {
          background: #f8fafc;
        }

        .footer-support-text {
          text-align: center;
          font-size: 0.85rem;
          color: #64748b;
        }

        .footer-support-text a {
          color: #0f172a;
          font-weight: 600;
          text-decoration: none;
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

        .right-form-inner {
          animation: fadeInUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .bottom-glass-card {
          animation: fadeInUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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

      {/* Left Panel — Architecture Visual */}
      <div className="left-hero">
        <div className="hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <img src="/ticketflow_logo.jpg" alt="TicketFlow AI Logo" style={{ width: 48, height: 48, borderRadius: 12, border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 6px 16px rgba(15,23,42,0.06)', objectFit: 'cover' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2563eb', background: 'rgba(37,99,235,0.08)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(37,99,235,0.2)' }}>
              AI Support System
            </span>
          </div>
          <h1 className="hero-title">TicketFlow AI</h1>
          <p className="hero-desc">
            Precision in every ticket. Clarity in every insight. Take control of your support operations with TicketFlow AI.
          </p>

          {/* Framed 3D Ticket Visual Card with Floating Keyframe Animation */}
          <div className="animated-hero-card" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.1)', boxShadow: '0 12px 30px rgba(15,23,42,0.08)', maxWidth: 460, marginBottom: 20, background: '#ffffff' }}>
            <img src="/login_ticket_hero.jpg" alt="3D Ticket Prioritization" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '12px 18px', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.08)', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>🎫 Intelligent 3D Ticket Triage</span>
              <span style={{ color: '#059669', fontSize: '0.78rem' }}>● Real-time Priority</span>
            </div>
          </div>
        </div>

        <div className="bottom-glass-card">
          <div className="glass-card-header">
            <div className="glass-card-icon">
              <CheckCircle2 size={13} />
            </div>
            <span>Secured by Neural Triage</span>
          </div>
          <div className="glass-card-text">
            Join thousands of teams prioritizing support with the industry's most advanced ML triage engine.
          </div>
        </div>
      </div>

      {/* Right Panel — Clean White Form */}
      <div className="right-form-panel">
        <div className="right-form-inner">
          <h2 className="form-heading">
            {tab === 'signin' ? 'Welcome back' : 'Create an Account'}
          </h2>
          <p className="form-subtitle">
            {tab === 'signin'
              ? 'Please enter your details to sign in to your account.'
              : 'Enter your information below to register your customer account.'}
          </p>

          {/* Segmented Control Pill */}
          <div className="segmented-pill-container">
            <button
              type="button"
              className={`segmented-pill-btn ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => setTab('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`segmented-pill-btn ${tab === 'create' ? 'active' : ''}`}
              onClick={() => setTab('create')}
            >
              Create Account
            </button>
          </div>

          {error && <div className="alert-box error">{error}</div>}
          {success && <div className="alert-box success">{success}</div>}

          <form onSubmit={handleEmailAuth}>
            {/* Full Name field — Only shown when Create Account tab is active */}
            {tab === 'create' && (
              <div className="form-field">
                <label className="field-label">Full Name</label>
                <input
                  id="user-fullname"
                  type="text"
                  className="clean-text-input"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-field">
              <label className="field-label">Email Address</label>
              <input
                id="user-email"
                type="email"
                className="clean-text-input"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <div className="field-label-row">
                <label className="field-label" style={{ margin: 0 }}>Password</label>
                {tab === 'signin' && (
                  <a href="#" className="forgot-link">Forgot password?</a>
                )}
              </div>
              <div className="input-relative">
                <input
                  id="user-password"
                  type={showPass ? 'text' : 'password'}
                  className="clean-text-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="main-submit-btn" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Processing…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
              {(fullName || email || password) && (
                <button
                  type="button"
                  onClick={handleClearInputs}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          <div className="divider-row">
            <div className="divider-line" />
            <span className="divider-text">OR CONTINUE WITH</span>
            <div className="divider-line" />
          </div>

          <div className="oauth-grid">
            <button type="button" className="oauth-btn" onClick={() => handleOAuth('google')}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button type="button" className="oauth-btn" onClick={() => handleOAuth('github')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              GitHub
            </button>
          </div>

          <div className="footer-support-text">
            Need help? <a href="#">Contact our dedicated support</a>
          </div>
        </div>
      </div>
    </div>
  )
}
