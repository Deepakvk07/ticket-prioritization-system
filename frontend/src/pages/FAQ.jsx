import { useState } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { Search, ChevronDown, ChevronUp, BookOpen, CreditCard, User, Zap, MessageSquare } from 'lucide-react'

const FAQ_DATA = [
  {
    category: 'General',
    icon: <BookOpen size={18} />,
    color: '#3b82f6',
    questions: [
      { q: 'What is TicketFlow AI?', a: 'TicketFlow AI is an intelligent support ticketing system that uses machine learning to automatically prioritize and route your support requests to the right team.' },
      { q: 'How long does it take to get a response?', a: 'Our AI triage ensures critical tickets get a response within 1 hour. High priority tickets within 4 hours, and standard tickets within 24 hours during business days.' },
      { q: 'Can I track my ticket status?', a: 'Yes! Use the "Track Ticket" page in the sidebar and enter your Ticket ID (e.g. TK-8842) to get real-time status updates.' },
      { q: 'Can I reopen a resolved ticket?', a: 'Absolutely. Open the ticket from "My Tickets" and use the "Reopen Ticket" button if you feel your issue wasn\'t fully resolved.' },
    ]
  },
  {
    category: 'Technical Support',
    icon: <Zap size={18} />,
    color: '#10b981',
    questions: [
      { q: 'What file types can I attach to a ticket?', a: 'You can attach images (PNG, JPG, GIF, WEBP) and text files (TXT, LOG, CSV). Images are automatically uploaded to secure cloud storage.' },
      { q: 'My application is throwing a 504 error. What should I do?', a: 'A 504 Gateway Timeout usually indicates a server-side issue. Submit a ticket with your error logs and we\'ll investigate within 30 minutes for critical issues.' },
      { q: 'How do I share error logs with support?', a: 'When submitting or replying to a ticket, use the file attachment feature to upload your log files directly. Our agents can then analyze them.' },
      { q: 'Can I submit multiple issues in one ticket?', a: 'We recommend submitting one issue per ticket for faster resolution. Multiple issues in one ticket can slow down the triage process.' },
    ]
  },
  {
    category: 'Billing & Subscriptions',
    icon: <CreditCard size={18} />,
    color: '#f59e0b',
    questions: [
      { q: 'How do I update my billing information?', a: 'Submit a ticket in the "Billing & Subscriptions" category and our billing team will assist you within one business day.' },
      { q: 'Can I get a refund?', a: 'Refunds are evaluated on a case-by-case basis. Please submit a billing ticket with your invoice number and the reason for refund request.' },
      { q: 'What happens if I exceed my plan limits?', a: 'You\'ll receive an automated notification before hitting limits. Our billing team will reach out to discuss upgrade options.' },
    ]
  },
  {
    category: 'Account & Access',
    icon: <User size={18} />,
    color: '#8b5cf6',
    questions: [
      { q: 'How do I reset my password?', a: 'Use the "Forgot Password" option on the login page. You\'ll receive a reset link within 5 minutes to your registered email.' },
      { q: 'Can I change my email address?', a: 'Yes, submit an Account Access ticket with your current and new email address. Our team will verify and update it within 24 hours.' },
      { q: 'How do I add team members to my account?', a: 'Contact our support team via a Feature Request ticket to discuss multi-user access options for your account.' },
    ]
  },
]

export default function FAQ({ user }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState({})
  const [activeCategory, setActiveCategory] = useState('All')

  const toggleItem = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const categories = ['All', ...FAQ_DATA.map(c => c.category)]

  const filteredData = FAQ_DATA
    .filter(cat => activeCategory === 'All' || cat.category === activeCategory)
    .map(cat => ({
      ...cat,
      questions: cat.questions.filter(item =>
        !searchQuery ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(cat => cat.questions.length > 0)

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        <Topbar user={user} placeholder="Search knowledge base..." />
        <div className="page-body animate-fade">
          <style>{`
            .faq-hero {
              background: var(--bg-surface);
              border: 1px solid var(--border-active);
              border-radius: 20px;
              padding: 40px 48px;
              margin-bottom: 28px;
              text-align: center;
              box-shadow: var(--shadow-sm);
            }
            .faq-search {
              display: flex;
              align-items: center;
              gap: 12px;
              background: var(--bg-input);
              border: 1px solid var(--border);
              border-radius: 12px;
              padding: 12px 18px;
              max-width: 560px;
              margin: 20px auto 0;
            }
            .faq-search input {
              background: none;
              border: none;
              outline: none;
              color: var(--text-primary);
              font-size: 0.95rem;
              flex: 1;
            }
            .faq-search input::placeholder { color: var(--text-muted); }
            .cat-tab {
              padding: 8px 20px;
              border-radius: 20px;
              border: 1px solid var(--border);
              background: var(--bg-surface);
              color: var(--text-secondary);
              cursor: pointer;
              font-size: 0.86rem;
              font-weight: 600;
              transition: all 0.2s;
            }
            .cat-tab:hover {
              border-color: var(--border-active);
              color: var(--text-primary);
            }
            .cat-tab.active {
              background: #2563eb;
              border-color: #2563eb;
              color: #ffffff;
              box-shadow: 0 4px 12px rgba(37,99,235,0.25);
            }
            .faq-item {
              border: 1px solid var(--border);
              border-radius: 12px;
              margin-bottom: 10px;
              overflow: hidden;
              background: var(--bg-surface);
              transition: border-color 0.2s;
              box-shadow: var(--shadow-sm);
            }
            .faq-item:hover { border-color: var(--border-active); }
            .faq-question {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              cursor: pointer;
              background: var(--bg-surface);
              color: var(--text-primary);
              transition: background 0.2s;
            }
            .faq-question:hover { background: var(--bg-card-hover); }
            .faq-answer {
              padding: 14px 20px 18px;
              color: var(--text-secondary);
              font-size: 0.92rem;
              line-height: 1.65;
              background: var(--bg-surface);
              border-top: 1px solid var(--border);
            }
          `}</style>

          {/* Hero */}
          <div className="faq-hero">
            <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>📚</div>
            <h1 className="faq-hero" style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, background: 'none', border: 'none', padding: 0 }}>Knowledge Base &amp; FAQ</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Find answers to common questions or submit a ticket if you need further help.</p>
              <div className="faq-search">
                <Search size={18} color="var(--text-muted)" />
                <input
                  placeholder="Ask AI or search knowledge base (e.g. 'How to track ticket', '504 error')..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* AI Instant Answer Banner */}
            {searchQuery.trim().length > 2 && (
              <div className="card" style={{ padding: '20px 24px', marginBottom: 24, borderRadius: 16, background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.06))', border: '1px solid rgba(37,99,235,0.25)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⚡ AI Instant Answer Prediction
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5, marginBottom: 8 }}>
                  "{searchQuery}"
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {filteredData[0]?.questions[0]?.a || 'TicketFlow AI Assistant: Check out our top knowledge base matches below or submit a ticket directly for personal agent support.'}
                </div>
              </div>
            )}

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Sections */}
          {filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: '#94a3b8' }}>No results found for "{searchQuery}"</div>
              <div style={{ fontSize: '0.84rem', marginTop: 4 }}>Try a different search term or browse categories above</div>
            </div>
          ) : (
            filteredData.map((cat, catIdx) => (
              <div key={catIdx} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}18`, border: `1px solid ${cat.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color }}>
                    {cat.icon}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{cat.category}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 2 }}>({cat.questions.length} questions)</span>
                </div>

                {cat.questions.map((item, qIdx) => {
                  const key = `${catIdx}-${qIdx}`
                  const isOpen = openItems[key]
                  return (
                    <div key={qIdx} className="faq-item">
                      <div className="faq-question" onClick={() => toggleItem(catIdx, qIdx)}>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{item.q}</span>
                        {isOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                      </div>
                      {isOpen && <div className="faq-answer">{item.a}</div>}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
