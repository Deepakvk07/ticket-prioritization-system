import { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getModelInfo, getTrainingLogs, retrainModel } from '../services/api'
import { Cpu, RefreshCw, Download, Eye, TrendingUp, TrendingDown, Settings2 } from 'lucide-react'

const MOCK_INFO = {
  model_name: 'SupportBERT v2', version: 'v2', accuracy: 92.0,
  dataset_size: 1200000, last_trained: 'Oct 24, 2023 14:22 UTC',
  architecture: 'Transformer-XL / Ensemble layer', status: 'ACTIVE PRODUCTION', trained: true,
}

const MOCK_LOGS = [
  { id: '1', date: 'Oct 24, 2023 09:12 AM', model_id: '#SBERT-V2-004', duration: '4h 12m', epochs: 150, accuracy_delta: 2.4, status: 'SUCCESS' },
  { id: '2', date: 'Oct 18, 2023 11:45 PM', model_id: '#SBERT-V2-003', duration: '3h 58m', epochs: 120, accuracy_delta: -0.8, status: 'ABORTED' },
  { id: '3', date: 'Oct 12, 2023 02:22 AM', model_id: '#SBERT-V2-002', duration: '5h 05m', epochs: 200, accuracy_delta: 1.1, status: 'SUCCESS' },
]

export default function ModelManagement({ user }) {
  const [info, setInfo] = useState(MOCK_INFO)
  const [logs, setLogs] = useState(MOCK_LOGS)
  const [loading, setLoading] = useState(true)
  const [retraining, setRetraining] = useState(false)
  const [threshold, setThreshold] = useState(0.85)
  const [mode, setMode] = useState('assisted')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([getModelInfo(), getTrainingLogs()])
      .then(([i, l]) => { setInfo(i); setLogs(l) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleRetrain = async () => {
    setRetraining(true)
    try {
      await retrainModel()
      setTimeout(() => setRetraining(false), 3000)
    } catch { setRetraining(false) }
  }

  const handleApply = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search models, datasets, or logs..." />
        <div className="page-body animate-fade">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>⚙ Admin Only</div>
              <div className="page-header" style={{ marginBottom: 0 }}>
                <h2>Model Configuration & Training</h2>
                <p>Manage core NLP models and fine-tune response parameters.</p>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleRetrain} disabled={retraining}>
              <RefreshCw size={16} className={retraining ? 'spin' : ''} />
              {retraining ? 'Retraining…' : 'Retrain Model'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 20 }}>
            {/* Model card */}
            <div className="card card-lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #1e40af, #3b82f6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={24} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{info.model_name}</div>
                    <span className="badge badge-success" style={{ marginTop: 4 }}>{info.status}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{info.accuracy}%</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Overall Accuracy</div>
                </div>
              </div>

              <div className="grid-3" style={{ gap: 12 }}>
                {[
                  { label: 'Last Trained', val1: new Date(info.last_trained).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Oct 24, 2023', val2: '14:22 UTC' },
                  { label: 'Dataset Size', val1: (info.dataset_size / 1000000).toFixed(1) + 'M Samples', val2: '+12% from v1' },
                  { label: 'Model Architecture', val1: 'Transformer-XL', val2: 'Ensemble layer' },
                ].map(({ label, val1, val2 }) => (
                  <div key={label} className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{val1}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent)', marginTop: 2 }}>{val2}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div className={`toggle ${mode === 'autopilot' ? 'on' : ''}`}
                    onClick={() => setMode(m => m === 'autopilot' ? 'assisted' : 'autopilot')} />
                  <span className="badge badge-medium">AI</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <button className="btn btn-ghost btn-sm"><Eye size={13} /> View Architecture</button>
                  <button className="btn btn-ghost btn-sm"><Download size={13} /> Download Weights</button>
                </div>
              </div>
            </div>

            {/* Runtime Settings */}
            <div className="card">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                <Settings2 size={16} color="var(--accent)" />
                <span style={{ fontWeight: 700 }}>Runtime Settings</span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="form-label">Confidence Threshold</span>
                  <span className="badge badge-medium" style={{ fontSize: '0.8rem', minWidth: 42, justifyContent: 'center' }}>{threshold}</span>
                </div>
                <input type="range" min={0} max={1} step={0.01}
                  value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                  Minimum probability score for the AI to suggest an automated reply.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="form-label" style={{ marginBottom: 10 }}>Operational Mode</div>
                {[
                  { id: 'assisted', label: 'Assisted Suggestion', desc: 'Agents must approve all AI responses.' },
                  { id: 'autopilot', label: 'Full Autopilot', desc: 'AI replies directly to low-complexity tickets.' },
                ].map(({ id, label, desc }) => (
                  <div key={id} onClick={() => setMode(id)}
                    style={{
                      padding: 12, borderRadius: 8, border: `1px solid ${mode === id ? 'var(--accent)' : 'var(--border)'}`,
                      marginBottom: 8, cursor: 'pointer',
                      background: mode === id ? 'var(--accent-dim)' : 'transparent',
                      transition: 'all var(--transition)',
                    }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: `2px solid ${mode === id ? 'var(--accent)' : 'var(--border)'}`,
                        background: mode === id ? 'var(--accent)' : 'transparent',
                        flexShrink: 0, transition: 'all var(--transition)',
                      }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleApply}>
                {saved ? '✓ Saved!' : 'Apply Changes'}
              </button>
            </div>
          </div>

          {/* Training Log */}
          <div>
            <div className="section-header" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <RefreshCw size={16} color="var(--accent)" />
                <span className="section-title">Training Log</span>
              </div>
              <button className="btn btn-ghost btn-sm">Filter Logs</button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Model ID</th>
                    <th>Duration</th>
                    <th>Epochs</th>
                    <th>Accuracy Delta</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.82rem' }}>{log.date}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent)' }}>{log.model_id}</td>
                      <td>{log.duration}</td>
                      <td>{log.epochs}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600,
                          color: log.accuracy_delta > 0 ? 'var(--success)' : 'var(--critical)' }}>
                          {log.accuracy_delta > 0
                            ? <TrendingUp size={14} />
                            : <TrendingDown size={14} />}
                          {log.accuracy_delta > 0 ? '+' : ''}{log.accuracy_delta}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${log.status === 'SUCCESS' ? 'success' : 'aborted'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
    </div>
  )
}
