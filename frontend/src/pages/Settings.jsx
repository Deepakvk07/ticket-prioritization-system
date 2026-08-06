import { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabase'
import { User, Camera, CheckCircle } from 'lucide-react'

export default function Settings({ user }) {
  const [form, setForm] = useState({
    full_name: '', email: '', job_title: 'Technical User', department: 'Enterprise Support',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        full_name: user.user_metadata?.full_name || user.name || (user.email ? user.email.split('@')[0] : 'Customer'),
        email: user.email || 'user@example.com',
      }))
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await supabase.auth.updateUser({ data: { full_name: form.full_name } })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    finally { setSaving(false) }
  }

  const initials = form.full_name ? form.full_name.split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU'

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search settings, docs, or tickets..." />
        <div className="page-body animate-fade">
          <div className="page-header">
            <h2>Account Settings</h2>
            <p>Manage your personal profile information and account details.</p>
          </div>

          <div style={{ maxWidth: 760 }}>
            <div className="card card-lg" style={{ padding: 32 }}>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={20} color="#3b82f6" /> Personal Information
              </div>

              {/* Avatar Section */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.7rem', fontWeight: 700, color: 'white',
                  }}>
                    {initials}
                  </div>
                  <button type="button" style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--accent)', border: '2px solid var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <Camera size={12} color="white" />
                  </button>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{form.full_name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{form.email}</div>
                </div>
              </div>

              <form onSubmit={handleSave}>
                <div className="grid-2" style={{ gap: 18, marginBottom: 18 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" value={form.email} readOnly
                      style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 18, marginBottom: 24 }}>
                  <div className="form-group">
                    <label className="form-label">Role / Job Title</label>
                    <input className="form-input" value={form.job_title}
                      onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                      {['Enterprise Support','Technical Operations','Engineering','Product Management','Finance & Billing'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '10px 24px' }}>
                    {saved ? '✓ Profile Saved!' : saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>

              <div className="alert alert-info" style={{ marginTop: 28, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <CheckCircle size={18} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#10b981' }}>Account Verified</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Your user profile is active and verified for submitting priority tickets.
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
