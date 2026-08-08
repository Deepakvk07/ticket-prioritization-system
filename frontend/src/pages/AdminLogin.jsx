import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signInAdmin } from '../services/admins'
import { Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowLeft, Lock, Sparkles, Cpu } from 'lucide-react'

import emailjs from '@emailjs/browser'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email/Password, 2: OTP Code
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [adminUser, setAdminUser] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendTimer, setResendTimer] = useState(30)

  useEffect(() => {
    localStorage.removeItem('demo_user')
  }, [])

  useEffect(() => {
    let interval = null
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(t => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [step, resendTimer])

  const handleClear = () => {
    setEmail('')
    setPassword('')
    setOtp('')
    setError('')
    setSuccess('')
    setStep(1)
    localStorage.removeItem('demo_user')
  }

  const sendOtpEmail = async (targetEmail, code) => {
    // 1. Primary EmailJS Browser Dispatch with exact credentials
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_rpo1fc9'
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_hcyfn2r'
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'dT4AFVfna3YalUuM8'

    try {
      const res = await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: targetEmail,
          email: targetEmail,
          user_email: targetEmail,
          to_name: 'System Administrator',
          name: 'System Administrator',
          otp_code: code,
          code: code,
          otp: code,
          message: `Your 2-step security verification code for TicketFlow AI is: ${code}`
        },
        publicKey
      )
      console.log('EmailJS OTP email dispatched successfully:', res.status, res.text)
    } catch (emailJsErr) {
      console.warn('EmailJS fallback to backend SMTP:', emailJsErr)
      // 2. Secondary Backend SMTP Dispatch Fallback
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      fetch(`${API_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: targetEmail,
          subject: '🔒 TicketFlow AI — Admin 2-Step Security OTP Code',
          body: `Hello System Administrator,\n\nYour 2-step verification code for TicketFlow AI Control Portal is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please secure your account immediately.\n\nRegards,\nTicketFlow AI Security System`
        })
      }).catch(() => null)
    }
  }

  const handleAdminSignIn = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter a valid administrator email address.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const adminObj = await signInAdmin(email.trim(), password.trim())
      if (!adminObj) {
        setError('Invalid admin credentials. Please check your email and password.')
        setLoading(false)
        return
      }

      // Generate 6-digit random OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(newOtp)
      setAdminUser(adminObj)
      sendOtpEmail(adminObj.email, newOtp)

      setStep(2)
      setResendTimer(30)
      setSuccess(`🔐 2-Step Verification required. A 6-digit OTP code has been sent to ${adminObj.email}`)
    } catch (err) {
      console.error('Admin sign in error:', err)
      setError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = () => {
    if (resendTimer > 0 || !adminUser) return
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(newOtp)
    sendOtpEmail(adminUser.email, newOtp)
    setResendTimer(30)
    setError('')
    setSuccess(`🔑 New OTP code sent to ${adminUser.email}`)
  }

  const handleVerifyOtp = (e) => {
    e.preventDefault()
    if (!otp.trim()) {
      setError('Please enter the 6-digit security OTP code.')
      return
    }

    if (otp.trim() !== generatedOtp) {
      setError('Incorrect OTP code. Please check your email and try again.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('✅ 2-Step Security Verification Passed! Entering Admin Portal...')

    localStorage.setItem('user_role_mode', 'admin')
    localStorage.setItem('demo_user', JSON.stringify({
      email: adminUser.email,
      role: 'admin',
      name: adminUser.name
    }))

    setTimeout(() => {
      navigate('/dashboard')
      window.location.reload()
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
            {step === 1 ? 'Admin Portal Sign In' : '2-Step Security Verification'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 24 }}>
            {step === 1
              ? 'Please enter your administrator credentials to access the system control panel.'
              : `Enter the 6-digit security code sent to ${adminUser?.email || email}.`}
          </p>

          {error && <div className="alert-box error" style={{ padding: 12, borderRadius: 10, marginBottom: 16, fontSize: '0.85rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{error}</div>}
          {success && <div className="alert-box success" style={{ padding: 12, borderRadius: 10, marginBottom: 16, fontSize: '0.85rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>{success}</div>}

          {step === 1 ? (
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
                  {loading ? 'Authenticating…' : 'Send OTP Security Code →'}
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
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 8, display: 'block' }}>
                  6-Digit OTP Security Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="clean-input"
                  placeholder="e.g. 849201"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ fontSize: '1.4rem', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button type="submit" className="admin-submit-btn" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Verifying Code…' : 'Verify OTP & Enter Control Panel'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  ← Back to Login
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  style={{
                    background: 'none', border: 'none',
                    color: resendTimer > 0 ? '#94a3b8' : '#2563eb',
                    fontWeight: 700, cursor: resendTimer > 0 ? 'default' : 'pointer', padding: 0
                  }}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP Code'}
                </button>
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.8rem', color: '#94a3b8' }}>
            TicketFlow AI &bull; Encrypted Staff Control Portal
          </div>
        </div>
      </div>
    </div>
  )
}
