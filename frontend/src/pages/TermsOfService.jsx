import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { FileText, ShieldCheck, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react'

export default function TermsOfService({ user }) {
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search terms of service..." />

        <div className="page-body animate-fade" style={{ width: '100%', maxWidth: '100%' }}>
          {/* Back Navigation */}
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/home')} style={{ padding: '6px 12px', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Customer Portal
            </button>
          </div>

          {/* Header */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '32px 36px', borderRadius: 20, marginBottom: 28
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', fontSize: '0.78rem', fontWeight: 700, marginBottom: 12 }}>
              <FileText size={14} /> MASTER SERVICE AGREEMENT
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
              Terms of Service & SLA Agreement
            </h1>
            <p style={{ color: '#cbd5e1', maxWidth: 640, fontSize: '0.94rem', margin: 0, lineHeight: 1.6 }}>
              Governing agreement between TicketFlow AI Technologies Inc. and customers utilizing our autonomous prioritization platform.
            </p>
          </div>

          {/* Terms Content */}
          <div className="card" style={{ padding: '36px 40px', borderRadius: 20, lineHeight: 1.8, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>1. Acceptance of Terms</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              By accessing or submitting tickets via TicketFlow AI, customer agrees to be bound by these Master Service Terms, SLA commitments, and security telemetry guidelines.
            </p>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>2. Service Level Agreement (SLA Target Matrix)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              TicketFlow AI guarantees priority triage response deadlines based on AI classification levels:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 26 }}>
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontWeight: 800, color: '#ef4444' }}>🔴 Critical Priority</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Response &lt; 30 Minutes</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontWeight: 800, color: '#f59e0b' }}>🟠 High Priority</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Response &lt; 2 Hours</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontWeight: 800, color: '#3b82f6' }}>🔵 Medium Priority</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Response &lt; 6 Hours</div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontWeight: 800, color: '#10b981' }}>🟢 Low Priority</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Response &lt; 24 Hours</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>3. Acceptable Use Policy</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Users agree not to submit malicious software, executable exploits, or unauthorized access credentials into ticket descriptions or file dropzones.
            </p>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>4. Uptime & Availability Guarantee</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              TicketFlow AI guarantees a 99.99% system operational uptime SLA, backed by redundant server hosting and real-time Supabase database replication.
            </p>

            <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={24} color="#3b82f6" />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: 2 }}>Legal Counsel Contact</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>For contractual & master service agreement queries: <strong>legal@ticketflow.ai</strong></span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
