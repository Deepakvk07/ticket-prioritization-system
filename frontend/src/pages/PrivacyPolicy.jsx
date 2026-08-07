import { useNavigate } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { ShieldCheck, Lock, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function PrivacyPolicy({ user }) {
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search privacy policy..." />

        <div className="page-body animate-fade" style={{ width: '100%', maxWidth: '100%' }}>
          {/* Back Navigation */}
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/home')} style={{ padding: '6px 12px', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Customer Portal
            </button>
          </div>

          {/* Header */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '32px 36px', borderRadius: 20, marginBottom: 28
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, marginBottom: 12 }}>
              <ShieldCheck size={14} /> DATA GOVERNANCE & PRIVACY
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
              Privacy Policy & Data Protection Statement
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', maxWidth: 640, fontSize: '0.94rem', margin: 0, lineHeight: 1.6 }}>
              Effective Date: August 2026 • TicketFlow AI Technologies Inc. is committed to absolute data isolation, encryption, and zero third-party AI training.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="card" style={{ padding: '36px 40px', borderRadius: 20, lineHeight: 1.8, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>1. Data Collection & Purpose</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              TicketFlow AI collects customer email addresses, ticket subjects, issue descriptions, and uploaded diagnostic files solely for the purpose of technical triage, agent routing, and customer support resolution. We never sell, monetize, or trade your personal or diagnostic data.
            </p>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>2. Zero AI Model Training Guarantee</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              All ticket text, code snippets, logs, and diagnostic attachments processed by our AI Prioritization & Classification Engine are processed in isolated memory. <strong>Your data is never used to train public LLM models or third-party AI systems.</strong>
            </p>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>3. Encryption & Storage Security</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Data transmitted to TicketFlow AI is protected using Transport Layer Security (TLS 1.3). Data at rest in our Supabase database cluster is encrypted using industry-standard AES-256 bit encryption. Access controls are regulated by strict Database Row Level Security (RLS) policies.
            </p>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>4. GDPR & CCPA Citizen Rights</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Under GDPR and CCPA regulations, you hold the right to request access to your submitted tickets, request complete data deletion, or export your ticket history. Requests can be initiated directly through the customer portal or by contacting privacy@ticketflow.ai.
            </p>

            <div style={{ marginTop: 30, padding: 20, borderRadius: 14, background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={24} color="#10b981" />
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: 2 }}>Official Data Protection Contact</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>For inquiries regarding privacy governance: <strong>dpo@ticketflow.ai</strong></span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
