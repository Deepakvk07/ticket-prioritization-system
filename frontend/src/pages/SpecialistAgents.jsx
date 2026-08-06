import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTickets } from '../services/api'
import { Headphones, Mail, Layers, ShieldCheck, ChevronRight, CheckCircle2, UserCheck, ArrowLeft, UserPlus } from 'lucide-react'

const CATEGORIES_LIST = [
  {
    category: 'Database & Infrastructure',
    icon: '🗄️',
    description: 'Database optimization, server infrastructure, cloud deployment, and SQL queries.',
  },
  {
    category: 'Web & UI/UX',
    icon: '🎨',
    description: 'Frontend layout, CSS styling, responsive web UI, and component bugs.',
  },
  {
    category: 'Billing & Integrations',
    icon: '💳',
    description: 'Payment gateway integrations, invoice errors, subscription billing, and refunds.',
  },
  {
    category: 'API & Security',
    icon: '⚡',
    description: 'OAuth2 authentication, API endpoint timeouts, CORS, and security audits.',
  },
  {
    category: 'Technical Support',
    icon: '🛠️',
    description: 'General technical support, hardware setup, software troubleshooting, and FAQs.',
  }
]

function getRegisteredAgentsFromStorage() {
  try {
    const raw = localStorage.getItem('registered_agents')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function SpecialistAgents({ user }) {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [registeredAgents, setRegisteredAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setRegisteredAgents(getRegisteredAgentsFromStorage())

    getTickets()
      .then(res => setTickets(Array.isArray(res) ? res : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search registered agents or categories..." />
        <div className="page-body animate-fade">

          <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Headphones size={22} color="#2563eb" /> Registered Specialist Agents & Categories
              </h2>
              <p>Support engineers registered by you for automated ticket triage.</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/agent-login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <UserPlus size={15} /> Register New Specialist Agent
            </button>
          </div>

          {/* Categories & Registered Agents List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {CATEGORIES_LIST.map(catItem => {
              // Agents registered specifically in this category
              const catAgents = registeredAgents.filter(a => (a.department || '').toLowerCase() === catItem.category.toLowerCase())

              // Active tickets in this category
              const categoryTickets = tickets.filter(t => {
                const c = (t.category || t.product_module || '').toLowerCase()
                const catName = catItem.category.toLowerCase()
                return c.includes(catName) || catName.includes(c)
              })

              return (
                <div
                  key={catItem.category}
                  className="card"
                  style={{ padding: 24, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '1.8rem', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        {catItem.icon}
                      </span>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {catItem.category}
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                          {catItem.description}
                        </p>
                      </div>
                    </div>

                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', borderRadius: 20,
                      background: categoryTickets.length > 0 ? 'rgba(16,185,129,0.1)' : 'var(--bg-input)',
                      color: categoryTickets.length > 0 ? '#059669' : 'var(--text-muted)',
                      fontSize: '0.78rem', fontWeight: 700, border: '1px solid var(--border)'
                    }}>
                      <Layers size={13} /> {categoryTickets.length} active tickets
                    </span>
                  </div>

                  {/* Registered Agents in this Category */}
                  {catAgents.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, marginTop: 16 }}>
                      {catAgents.map(agent => (
                        <div
                          key={agent.email}
                          style={{
                            padding: '14px 18px', borderRadius: 12,
                            background: 'var(--bg-input)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                              color: '#ffffff', fontWeight: 800, fontSize: '0.85rem',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {agent.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {agent.name}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Mail size={11} /> {agent.email}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: '0.72rem', fontWeight: 700, color: '#10b981',
                              background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 10
                            }}>
                              ● Online
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '18px 20px', borderRadius: 10, background: 'var(--bg-input)',
                      border: '1px border-dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)',
                      fontSize: '0.84rem', marginTop: 12
                    }}>
                      No agents registered in this category yet. Click "Register New Specialist Agent" above to add one.
                    </div>
                  )}

                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
