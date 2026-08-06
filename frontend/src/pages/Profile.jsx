import { useState } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import {
  User, Palette, Save, CheckCircle2, ShieldCheck, Mail, Phone,
  Building, Briefcase, Bell, Lock, Award, Sparkles, KeyRound
} from 'lucide-react'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #3b82f6, #6366f1)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #f97316, #ef4444)',
]

export default function Profile({ user }) {
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem('user_profile') || '{}') } catch { return {} }
  })()

  const email = user?.email || saved.email || 'customer@ticketflow.ai'
  const defaultName = user?.user_metadata?.full_name || user?.name || (email ? email.split('@')[0] : 'Customer User')

  const [name, setName] = useState(saved.name || defaultName)
  const [phone, setPhone] = useState(saved.phone || '+916392376195')
  const [company, setCompany] = useState(saved.company || 'Enterprise Systems Corp')
  const [role, setRole] = useState(saved.role || 'IT Operations Manager')
  const [avatarColor, setAvatarColor] = useState(saved.avatarColor || AVATAR_COLORS[0])
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [slaAlerts, setSlaAlerts] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const initials = name.trim().split(/\s+/).map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'CU'

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem('user_profile', JSON.stringify({ name, phone, company, role, avatarColor, email }))
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search settings, profile..." />

        <div className="page-body animate-fade" style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 40 }}>

          {/* ── Top Cover & Profile Hero Banner ───────────────────────────────── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28, position: 'relative' }}>
            {/* Ambient Background Gradient Banner */}
            <div style={{
              height: 140,
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: 20
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.25), transparent 60%), radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.2), transparent 50%)'
              }} />
              <span className="badge badge-medium" style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff', padding: '6px 14px', fontSize: '0.78rem' }}>
                <Sparkles size={13} style={{ marginRight: 4 }} /> Verified Customer Account
              </span>
            </div>

            {/* Profile Info Bar */}
            <div style={{ padding: '0 32px 28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginTop: -48, position: 'relative', zIndex: 3 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  border: '4px solid var(--bg-card)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  flexShrink: 0,
                  position: 'relative'
                }}>
                  {initials}
                  <span style={{
                    position: 'absolute', bottom: 4, right: 4, width: 14, height: 14,
                    borderRadius: '50%', background: '#10b981', border: '2.5px solid var(--bg-card)'
                  }} title="Active Now" />
                </div>

                {/* User Details */}
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{name}</h2>
                    <span className="badge badge-progress" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>CUSTOMER USER</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span>{email}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Award size={13} color="var(--accent)" /> Enterprise Tier
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stat Pill Widgets */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="card" style={{ padding: '10px 16px', background: 'var(--bg-card-hover)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>12</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Tickets</div>
                </div>
                <div className="card" style={{ padding: '10px 16px', background: 'var(--bg-card-hover)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>98.4%</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SLA Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main 2-Column Content Grid ───────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>

            {/* Left Sidebar Column — Customization & Security */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Avatar Color Picker Card */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Palette size={18} color="var(--accent)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Avatar Theme</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                  Select your preferred avatar gradient color palette.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {AVATAR_COLORS.map((color, i) => {
                    const isSelected = avatarColor === color
                    return (
                      <div
                        key={i}
                        onClick={() => setAvatarColor(color)}
                        style={{
                          height: 48,
                          borderRadius: 12,
                          background: color,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isSelected ? '3px solid var(--accent)' : '2px solid transparent',
                          boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
                          transition: 'all 0.2s ease',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        {isSelected && <CheckCircle2 size={18} color="#ffffff" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Account Security & Status */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <ShieldCheck size={18} color="#10b981" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Security & Status</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', padding: '10px 12px', background: 'var(--bg-card-hover)', borderRadius: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lock size={14} color="var(--text-muted)" /> SSL Encryption
                    </span>
                    <span className="badge badge-resolved" style={{ fontSize: '0.7rem' }}>Active</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', padding: '10px 12px', background: 'var(--bg-card-hover)', borderRadius: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <KeyRound size={14} color="var(--text-muted)" /> Auth Provider
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>OAuth / Pass</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Main Column — Form Fields */}
            <div className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <User size={20} color="var(--accent)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Personal Information</h3>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>* Required fields</span>
              </div>

              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  
                  {/* Full Name */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Full Name *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: 38 }}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                      <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  {/* Email Address (Disabled / Read-only with verified badge) */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Email Address (Account ID)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        className="form-input"
                        style={{ paddingLeft: 38, opacity: 0.7, background: 'var(--bg-card-hover)', cursor: 'not-allowed' }}
                        value={email}
                        disabled
                      />
                      <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: 38 }}
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                      <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  {/* Company */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Company / Organization</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: 38 }}
                        value={company}
                        onChange={e => setCompany(e.target.value)}
                        placeholder="Company name"
                      />
                      <Building size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  {/* Role / Job Title */}
                  <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Job Title / Role</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: 38 }}
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        placeholder="e.g. Senior Software Engineer / Operations Manager"
                      />
                      <Briefcase size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                </div>

                {/* Notifications & Preferences Section */}
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Bell size={18} color="var(--accent)" />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Notification Preferences</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px 16px', background: 'var(--bg-card-hover)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Email Ticket Updates</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Receive email notifications when support staff replies to your tickets.</div>
                      </div>
                      <input
                        type="checkbox"
                        className="checkbox"
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                        checked={emailNotifications}
                        onChange={e => setEmailNotifications(e.target.checked)}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px 16px', background: 'var(--bg-card-hover)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>SLA & Resolution Alerts</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Get notified immediately when a ticket status changes or is resolved.</div>
                      </div>
                      <input
                        type="checkbox"
                        className="checkbox"
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                        checked={slaAlerts}
                        onChange={e => setSlaAlerts(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>

                {/* Submit Action Bar */}
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {savedSuccess ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
                      <CheckCircle2 size={18} /> Profile settings saved successfully!
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Changes persist locally in your portal session.
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '12px 32px', fontWeight: 700, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem' }}
                  >
                    <Save size={16} /> Save Profile Changes
                  </button>
                </div>

              </form>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
