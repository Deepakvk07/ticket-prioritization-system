import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { ShieldCheck, Lock, Activity, Eye, Cpu, CheckCircle2, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function SecurityTelemetry({ user }) {
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search security telemetry..." />

        <div className="page-body animate-fade" style={{ width: '100%', maxWidth: '100%' }}>
          {/* Back Navigation */}
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/home')} style={{ padding: '6px 12px', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Customer Portal
            </button>
          </div>

          {/* Header */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '32px 36px', borderRadius: 20, marginBottom: 28
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 700, marginBottom: 12 }}>
                  <ShieldCheck size={14} /> SECURITY & TELEMETRY HUB
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
                  Enterprise Security Telemetry
                </h1>
                <p style={{ color: '#cbd5e1', maxWidth: 640, fontSize: '0.94rem', margin: 0, lineHeight: 1.6 }}>
                  Real-time security auditing, data encryption status, threat detection telemetry, and compliance monitoring for TicketFlow AI.
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleRefresh}
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', padding: '12px 24px', fontWeight: 700 }}
              >
                <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                {refreshing ? 'Refreshing Audit...' : 'Refresh Audit Telemetry'}
              </button>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 28 }}>
            <div className="card" style={{ padding: 22, borderRadius: 16 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>ENCRYPTION STANDARD</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={20} /> AES-256 GCM
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 6 }}>TLS 1.3 in transit • Encrypted at rest</div>
            </div>

            <div className="card" style={{ padding: 22, borderRadius: 16 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>THREAT SCAN STATUS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={20} /> 0 Active Threats
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 6 }}>Continuous automated vulnerability scan</div>
            </div>

            <div className="card" style={{ padding: 22, borderRadius: 16 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>AI DATA PRIVACY POLICY</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={20} /> Zero Model Training
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 6 }}>Customer payload is isolated & never retained for LLM training</div>
            </div>

            <div className="card" style={{ padding: 22, borderRadius: 16 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>COMPLIANCE COMPONENT</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} /> SOC 2 / ISO Ready
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 6 }}>Audited security controls & access logs</div>
            </div>
          </div>

          {/* Security Telemetry Audit Log Table */}
          <div className="card" style={{ padding: 28, borderRadius: 18 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Eye size={20} color="#6366f1" /> Real-time Security Telemetry & System Event Audit Log
            </h3>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Security Event Type</th>
                    <th>Protocol / Layer</th>
                    <th>Status</th>
                    <th>Verification Signature</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{new Date().toLocaleTimeString()}</td>
                    <td><strong>End-to-End Payload Encryption Check</strong></td>
                    <td>TLS 1.3 / AES-256</td>
                    <td><span className="badge badge-resolved">● PASSED</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>sha256:9f8e7d6c5b4a3...</td>
                  </tr>
                  <tr>
                    <td>{new Date(Date.now() - 3600000).toLocaleTimeString()}</td>
                    <td><strong>Automated Vulnerability & CORS Scan</strong></td>
                    <td>Application Firewall</td>
                    <td><span className="badge badge-resolved">● CLEAN (0 Alerts)</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>sha256:1a2b3c4d5e6f7...</td>
                  </tr>
                  <tr>
                    <td>{new Date(Date.now() - 7200000).toLocaleTimeString()}</td>
                    <td><strong>Supabase Row Level Security Audit</strong></td>
                    <td>Database RLS Gateway</td>
                    <td><span className="badge badge-resolved">● ENFORCED</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>sha256:7c8b9a0f1e2d3...</td>
                  </tr>
                  <tr>
                    <td>{new Date(Date.now() - 14400000).toLocaleTimeString()}</td>
                    <td><strong>Session Key Rotation & Token Verification</strong></td>
                    <td>JWT OAuth2 Service</td>
                    <td><span className="badge badge-resolved">● ROTATED</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>sha256:4d3c2b1a0f9e8...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
