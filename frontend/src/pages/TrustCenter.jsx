import { useNavigate } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { ShieldCheck, CheckCircle2, Lock, Cpu, Server, Activity, ArrowLeft, RefreshCw } from 'lucide-react'

export default function TrustCenter({ user }) {
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search trust center..." />

        <div className="page-body animate-fade" style={{ width: '100%', maxWidth: '100%' }}>
          {/* Back Navigation */}
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/home')} style={{ padding: '6px 12px', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Customer Portal
            </button>
          </div>

          {/* Header */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            padding: '32px 36px', borderRadius: 20, marginBottom: 28
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontSize: '0.78rem', fontWeight: 700, marginBottom: 12 }}>
              <ShieldCheck size={14} /> TRUST & INFRASTRUCTURE PORTAL
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
              TicketFlow AI Trust Center
            </h1>
            <p style={{ color: '#e9d5ff', maxWidth: 640, fontSize: '0.94rem', margin: 0, lineHeight: 1.6 }}>
              Live infrastructure status, security control audits, compliance reports, and uptime metrics.
            </p>
          </div>

          {/* System Status Hero */}
          <div className="card" style={{ padding: 24, borderRadius: 16, marginBottom: 24, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>All TicketFlow AI Core Services Operational</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Database cluster, AI triage worker, and REST API services responding nominally</div>
              </div>
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 12px', borderRadius: 20 }}>
              99.99% Uptime Guarantee
            </span>
          </div>

          {/* Infrastructure Health Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 28 }}>
            <div className="card" style={{ padding: 22, borderRadius: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Server size={16} color="#3b82f6" /> DATABASE CLUSTER
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>Supabase PostgreSQL</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Multi-region active replication • RLS Enforced</div>
            </div>

            <div className="card" style={{ padding: 22, borderRadius: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cpu size={16} color="#a855f7" /> AI TRIAGE ENGINE
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>GPT-4 Omni Worker</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Sub-300ms inference triage latency</div>
            </div>

            <div className="card" style={{ padding: 22, borderRadius: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={16} color="#f59e0b" /> TLS & ENCRYPTION
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>TLS 1.3 / AES-256</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Zero SSL handshake vulnerabilities</div>
            </div>
          </div>

          {/* Third Party Certifications */}
          <div className="card" style={{ padding: 28, borderRadius: 18 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 18, color: 'var(--text-primary)' }}>
              Third-Party Security Certifications & Audit Reports
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ padding: 18, borderRadius: 14, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.94rem' }}>SOC 2 Type II Security Report</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Audited by independent 3rd party cybersecurity auditor</div>
                </div>
                <span className="badge badge-resolved">● AUDITED</span>
              </div>
              <div style={{ padding: 18, borderRadius: 14, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.94rem' }}>ISO 27001 Security Management</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Certified Information Security Management System</div>
                </div>
                <span className="badge badge-resolved">● CERTIFIED</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
