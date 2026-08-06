import { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getUserTokens, redeemToken } from '../services/api'
import { KeyRound, Sparkles, ShieldCheck, PlusCircle, CheckCircle2, AlertCircle, Clock, Zap, Ticket, RefreshCw } from 'lucide-react'

export default function UserTokens({ user }) {
  const email = user?.email || ''
  const userName = user?.name || user?.user_metadata?.full_name || (email ? email.split('@')[0] : 'User')

  const [tokenData, setTokenData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tokenInput, setTokenInput] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  const fetchTokens = () => {
    if (!email) {
      setLoading(false)
      return
    }
    setLoading(true)
    getUserTokens(email)
      .then(res => setTokenData(res))
      .catch(err => {
        setTokenData({
          customer_email: email,
          tier: 'STARTER',
          total_active_credits: 0,
          active_tokens_count: 0,
          tokens: []
        })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTokens()
  }, [email])

  const handleRedeem = (e) => {
    if (e) e.preventDefault()
    const code = tokenInput.trim().toUpperCase()
    if (!code) {
      setMsg({ text: 'Please enter a token code.', type: 'error' })
      return
    }

    setRedeeming(true)
    setMsg({ text: '', type: '' })

    redeemToken(email, code)
      .then(res => {
        setMsg({ text: res.message, type: 'success' })
        setTokenInput('')
        fetchTokens()
      })
      .catch(err => {
        const errorText = err.response?.data?.detail || err.message || 'Token validation failed.'
        setMsg({ text: errorText, type: 'error' })
      })
      .finally(() => setRedeeming(false))
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search support tokens, quotas, or credit history..." />

        <div className="page-body animate-fade">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <KeyRound color="#3b82f6" size={24} /> Support Tokens & Quota
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Enter your access token to activate priority triage credits, check token status, and view SLA quota for <strong style={{ color: 'var(--text-primary)' }}>{email || 'your account'}</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={fetchTokens} title="Refresh Token Status">
                <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
              </button>
              <span className={`badge ${tokenData?.tier === 'ENTERPRISE' ? 'badge-critical' : tokenData?.tier === 'PRO' ? 'badge-high' : 'badge-medium'}`} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <ShieldCheck size={14} style={{ marginRight: 6 }} /> Tier: {tokenData?.tier || 'STARTER'}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="metrics-grid" style={{ marginBottom: 28 }}>
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Available AI Credits</span>
                <Zap size={18} color="#3b82f6" />
              </div>
              <div className="metric-value">{tokenData?.total_active_credits ?? 0}</div>
              <div className="metric-footer" style={{ color: '#10b981' }}>
                <CheckCircle2 size={12} /> Active for priority ML triage
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Active Tokens</span>
                <Ticket size={18} color="#10b981" />
              </div>
              <div className="metric-value">{tokenData?.active_tokens_count ?? 0}</div>
              <div className="metric-footer" style={{ color: 'var(--text-muted)' }}>
                Registered to account
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Guaranteed Response SLA</span>
                <Clock size={18} color="#f59e0b" />
              </div>
              <div className="metric-value" style={{ fontSize: '1.4rem' }}>
                {tokenData?.tier === 'ENTERPRISE' ? '< 15 mins' : tokenData?.tier === 'PRO' ? '< 1 hour' : '< 4 hours'}
              </div>
              <div className="metric-footer" style={{ color: 'var(--text-muted)' }}>
                Target response time
              </div>
            </div>
          </div>

          {/* Redeem Token Section */}
          <div className="card" style={{ padding: 24, marginBottom: 28, background: 'var(--bg-card)', border: '1px solid var(--border-active)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <PlusCircle color="#10b981" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Input & Validate Token</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 18 }}>
              Input your support token code below to add priority credits or update your service level agreement.
            </p>

            {msg.text && (
              <div style={{
                padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
                background: msg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: msg.type === 'success' ? '#10b981' : '#ef4444',
                border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
              }}>
                {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handleRedeem} style={{ display: 'flex', gap: 12 }}>
              <input
                id="token-code-input"
                type="text"
                className="form-input"
                style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em', fontSize: '0.95rem' }}
                placeholder="Enter token code (e.g. TK-ENTERPRISE-8842)"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={redeeming || !tokenInput.trim()}
                style={{ padding: '0 24px', fontWeight: 600 }}
              >
                {redeeming ? 'Validating…' : 'Validate Token'}
              </button>
            </form>
          </div>

          {/* Tokens Registry List */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#3b82f6" /> User Token Status Registry
            </h3>

            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Checking token status…</div>
            ) : !tokenData?.tokens?.length ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <KeyRound size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: '0.9rem', marginBottom: 4 }}>No active tokens registered for this account.</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter a token code above to activate support credits.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {tokenData.tokens.map(tok => {
                  const pct = Math.min(100, Math.round((tok.credits_remaining / (tok.credits_allocated || 1)) * 100))
                  const isActive = tok.status === 'ACTIVE'
                  return (
                    <div key={tok.id || tok.token_code} className="card" style={{
                      padding: 18,
                      background: 'var(--bg-card)',
                      border: `1px solid ${isActive ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                      borderRadius: 12
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                            {tok.token_type}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                            {tok.token_code}
                          </div>
                        </div>
                        <span className={`badge ${tok.tier === 'ENTERPRISE' ? 'badge-critical' : tok.tier === 'PRO' ? 'badge-high' : 'badge-low'}`}>
                          {tok.tier}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                          <span>Remaining Credits</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{tok.credits_remaining} / {tok.credits_allocated} ({pct}%)</strong>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{
                            width: `${pct}%`,
                            background: pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--danger)'
                          }} />
                        </div>
                      </div>

                      {/* Footer Details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#10b981' : '#ef4444' }} />
                          {tok.status}
                        </span>
                        <span>Expires: {tok.expires_at ? new Date(tok.expires_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
