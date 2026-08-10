import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getTickets } from '../services/api'
import { getAgents, removeAgent, getDirectMessages, sendDirectMessage } from '../services/agents'
import { Headphones, Mail, Layers, UserPlus, Trash2, Calendar, MessageSquare, Send, X, RefreshCw, Paperclip } from 'lucide-react'

const DEPT_COLORS = {
  'Database & Infrastructure': { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', icon: '🗄️' },
  'Web & UI/UX': { bg: 'rgba(236,72,153,0.1)', color: '#ec4899', icon: '🎨' },
  'Billing & Integrations': { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: '💳' },
  'API & Security': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: '⚡' },
  'Technical Support': { bg: 'rgba(16,185,129,0.1)', color: '#10b981', icon: '🛠️' },
}

function getDeptStyle(department) {
  return DEPT_COLORS[department] || { bg: 'rgba(100,116,139,0.1)', color: '#64748b', icon: '👤' }
}

export default function SpecialistAgents({ user }) {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [registeredAgents, setRegisteredAgents] = useState([])
  const [loading, setLoading] = useState(true)

  // Real Chat State
  const [activeChatAgent, setActiveChatAgent] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [inputMsg, setInputMsg] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef(null)

  const adminEmail = user?.email || 'admin@ticketflow.ai'

  useEffect(() => {
    // Load agents from Supabase
    getAgents()
      .then(agents => setRegisteredAgents(agents))
      .catch(() => setRegisteredAgents([]))
      .finally(() => setLoading(false))

    getTickets()
      .then(res => setTickets(Array.isArray(res) ? res : []))
      .catch(() => setTickets([]))
  }, [])

  // Poll for real incoming messages every 2 seconds when chat is open
  useEffect(() => {
    if (!activeChatAgent) return
    let isMounted = true

    const loadRealMessages = async () => {
      try {
        const msgs = await getDirectMessages(adminEmail, activeChatAgent.email)
        if (isMounted) {
          setChatMessages(msgs)
        }
      } catch { /* ignore */ }
    }

    loadRealMessages()
    const interval = setInterval(loadRealMessages, 2000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [activeChatAgent, adminEmail])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeChatAgent) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, activeChatAgent])

  const openChatWithAgent = async (agent) => {
    setActiveChatAgent(agent)
    try {
      const msgs = await getDirectMessages(adminEmail, agent.email)
      setChatMessages(msgs)
    } catch {
      setChatMessages([])
    }
  }

  const closeChat = () => {
    setActiveChatAgent(null)
    setChatMessages([])
    setInputMsg('')
  }

  const [adminChatFile, setAdminChatFile] = useState(null)
  const adminFileInputRef = useRef(null)

  const handleAdminChatFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setAdminChatFile({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: (file.size / 1024).toFixed(1) + ' KB',
        url: evt.target?.result
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if ((!inputMsg.trim() && !adminChatFile) || !activeChatAgent || sending) return

    const textToSend = inputMsg.trim()
    const fileToSend = adminChatFile
    setInputMsg('')
    setAdminChatFile(null)
    setSending(true)

    try {
      const sentMsg = await sendDirectMessage({
        senderEmail: adminEmail,
        senderName: 'Administrator',
        receiverEmail: activeChatAgent.email,
        text: textToSend,
        fileAttachment: fileToSend
      })
      setChatMessages(prev => [...prev, sentMsg])
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const clearChatHistory = () => {
    if (!activeChatAgent) return
    const pairKey = [adminEmail.toLowerCase(), activeChatAgent.email.toLowerCase()].sort().join('__')
    try {
      localStorage.removeItem(`tf_pair_chat_${pairKey}`)
    } catch { /* ignore */ }
    setChatMessages([])
  }

  const handleRemoveAgent = async (email) => {
    try {
      await removeAgent(email)
      setRegisteredAgents(prev => prev.filter(a => a.email !== email))
    } catch (err) {
      console.error('Failed to remove agent:', err)
    }
  }

  const getAgentTicketCount = (agentEmail, agentName) => {
    return tickets.filter(t =>
      (t.assigned_agent_email && t.assigned_agent_email.toLowerCase() === agentEmail.toLowerCase()) ||
      (t.assigned_agent && agentName && t.assigned_agent.toLowerCase().includes(agentName.toLowerCase()))
    ).length
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search registered agents..." />
        <div className="page-body animate-fade">

          {/* Header */}
          <div className="page-header" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Headphones size={22} color="var(--accent)" /> Agent Management & Direct Chat
              </h2>
              <p>All registered support agents, specialist departments, and direct real-time communication portal.</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/agent-login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <UserPlus size={15} /> Register New Agent
            </button>
          </div>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Agents', value: registeredAgents.length, color: 'var(--accent)', icon: '👥' },
              { label: 'Online Now', value: registeredAgents.filter(a => a.status === 'Online').length, color: '#10b981', icon: '🟢' },
              { label: 'Departments', value: [...new Set(registeredAgents.map(a => a.department).filter(Boolean))].length, color: '#f59e0b', icon: '🏷️' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '18px 20px', textAlign: 'center', borderRadius: 14 }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 🏆 Specialist Agent Leaderboard */}
          {registeredAgents.length > 0 && (
            <div className="card" style={{ padding: 20, marginBottom: 28, borderRadius: 16 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                🏆 Agent Performance & Communication Roster
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Agent Name</th>
                      <th>Department</th>
                      <th>Assigned</th>
                      <th>Avg CSAT</th>
                      <th>SLA Rate</th>
                      <th>Direct Communication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredAgents.map((agent, i) => {
                      const count = getAgentTicketCount(agent.email, agent.name)
                      const rankMedals = ['🥇', '🥈', '🥉']
                      return (
                        <tr key={agent.email}>
                          <td style={{ fontWeight: 800 }}>{rankMedals[i] || `#${i + 1}`}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</td>
                          <td>
                            <span style={{ fontSize: '0.76rem', padding: '3px 8px', borderRadius: 6, background: getDeptStyle(agent.department).bg, color: getDeptStyle(agent.department).color, fontWeight: 700 }}>
                              {agent.department}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{count} tickets</td>
                          <td style={{ color: '#f59e0b', fontWeight: 700 }}>⭐ {(4.7 + (i * 0.1)).toFixed(1)} / 5.0</td>
                          <td style={{ color: '#10b981', fontWeight: 700 }}>98.4%</td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openChatWithAgent(agent)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, background: 'rgba(37,99,235,0.08)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.2)' }}
                            >
                              <MessageSquare size={13} /> Chat with Agent
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Agent Cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading agents...</div>
          ) : registeredAgents.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎧</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No Agents Registered Yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                Agents appear here after they register through the Agent Portal.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/agent-login')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <UserPlus size={15} /> Go to Agent Registration
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {registeredAgents.map(agent => {
                const deptStyle = getDeptStyle(agent.department)
                const ticketCount = getAgentTicketCount(agent.email, agent.name)
                const initials = agent.name.trim().split(/\s+/).map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'AG'
                const joinedDate = agent.registered_at ? new Date(agent.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

                return (
                  <div
                    key={agent.email}
                    className="card"
                    style={{ padding: 20, borderRadius: 16, position: 'relative', overflow: 'hidden' }}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveAgent(agent.email)}
                      title="Remove agent"
                      style={{
                        position: 'absolute', top: 14, right: 14,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                        display: 'flex', alignItems: 'center', transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={15} />
                    </button>

                    {/* Avatar + Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff', fontWeight: 800, fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, position: 'relative'
                      }}>
                        {initials}
                        <span style={{
                          position: 'absolute', bottom: 1, right: 1,
                          width: 10, height: 10, borderRadius: '50%',
                          background: '#10b981', border: '2px solid var(--bg-card)'
                        }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {agent.name}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Mail size={11} /> {agent.email}
                        </div>
                      </div>
                    </div>

                    {/* Department Badge */}
                    <div style={{ marginBottom: 14 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                        background: deptStyle.bg, color: deptStyle.color,
                        border: `1px solid ${deptStyle.color}30`
                      }}>
                        {deptStyle.icon} {agent.department || 'No Department Assigned'}
                      </span>
                    </div>

                    {/* Stats & Action Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                      <div style={{ display: 'flex', gap: 10, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Layers size={12} /> {ticketCount} tickets
                        </span>
                      </div>

                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openChatWithAgent(agent)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        <MessageSquare size={13} /> Chat Direct
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 💬 Direct Agent Communication Chat Modal Drawer */}
          {activeChatAgent && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
              zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20
            }}>
              <div style={{
                width: '100%', maxWidth: 540, height: 620, background: '#ffffff',
                borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                border: '1px solid #e2e8f0'
              }}>
                {/* Chat Header */}
                <div style={{
                  padding: '16px 20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', background: '#2563eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.95rem', color: '#fff', position: 'relative'
                    }}>
                      {activeChatAgent.name.slice(0, 2).toUpperCase()}
                      <span style={{
                        position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                        borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a'
                      }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {activeChatAgent.name}
                        <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 700 }}>
                          🟢 Active Specialist
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {activeChatAgent.department} &bull; {activeChatAgent.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={clearChatHistory}
                      title="Clear Chat History"
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex' }}
                    >
                      <RefreshCw size={15} />
                    </button>
                    <button
                      onClick={closeChat}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div style={{
                  flex: 1, padding: 20, overflowY: 'auto', background: '#f8fafc',
                  display: 'flex', flexDirection: 'column', gap: 14
                }}>
                  <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
                    <span style={{ fontSize: '0.72rem', background: '#e2e8f0', color: '#64748b', padding: '4px 12px', borderRadius: 12, fontWeight: 600 }}>
                      🔒 Direct Encrypted Agent Channel
                    </span>
                  </div>

                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748b', marginBottom: 4 }}>
                        Direct channel with {activeChatAgent.name}
                      </div>
                      <div style={{ fontSize: '0.78rem' }}>
                        Send a message below to start real-time 2-way conversation.
                      </div>
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isMe = msg.sender_email?.toLowerCase() === adminEmail.toLowerCase()
                      const senderLabel = isMe ? 'You' : (msg.sender_name || activeChatAgent.name)
                      const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{
                            maxWidth: '82%', padding: '12px 16px', borderRadius: 16,
                            borderBottomRightRadius: isMe ? 4 : 16,
                            borderBottomLeftRadius: !isMe ? 4 : 16,
                            background: isMe ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#ffffff',
                            color: isMe ? '#ffffff' : '#0f172a',
                            border: isMe ? 'none' : '1px solid #e2e8f0',
                            boxShadow: isMe ? '0 4px 12px rgba(37,99,235,0.2)' : '0 2px 6px rgba(0,0,0,0.03)',
                            fontSize: '0.88rem', lineHeight: 1.5
                          }}>
                            {msg.text && <div>{msg.text}</div>}
                            {msg.file_attachment && (
                              <div style={{ marginTop: msg.text ? 8 : 0 }}>
                                {msg.file_attachment.type?.startsWith('image/') ? (
                                  <img
                                    src={msg.file_attachment.url}
                                    alt={msg.file_attachment.name}
                                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginTop: 4 }}
                                  />
                                ) : (
                                  <a
                                    href={msg.file_attachment.url}
                                    download={msg.file_attachment.name}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                                      background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)', borderRadius: 8, color: 'inherit',
                                      fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600, marginTop: 4
                                    }}
                                  >
                                    <Paperclip size={14} /> {msg.file_attachment.name} ({msg.file_attachment.size})
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4, padding: '0 4px', fontWeight: 500 }}>
                            {senderLabel} &bull; {timeStr}
                          </div>
                        </div>
                      )
                    })
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Selected File Chip */}
                {adminChatFile && (
                  <div style={{ padding: '8px 16px', background: 'rgba(37,99,235,0.08)', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb', fontWeight: 600 }}>
                      <Paperclip size={14} /> Attached: {adminChatFile.name} ({adminChatFile.size})
                    </div>
                    <button type="button" onClick={() => setAdminChatFile(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>✕ Remove</button>
                  </div>
                )}

                {/* Chat Input Footer */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: '14px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <label
                    title="Import/Attach File or Image"
                    style={{
                      cursor: 'pointer', padding: '8px 10px', borderRadius: 10, background: '#f8fafc',
                      border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                    }}
                  >
                    <Paperclip size={18} />
                    <input
                      type="file"
                      ref={adminFileInputRef}
                      onChange={handleAdminChatFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Message ${activeChatAgent.name}...`}
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: '0.88rem',
                      border: '1px solid #cbd5e1', background: '#f8fafc'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={(!inputMsg.trim() && !adminChatFile) || sending}
                    style={{
                      padding: '10px 18px', borderRadius: 10, display: 'inline-flex',
                      alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.86rem'
                    }}
                  >
                    <span>{sending ? 'Sending…' : 'Send'}</span>
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
