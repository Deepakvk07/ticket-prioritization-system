import { useState } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { useTranslation } from '../lib/i18n'
import { Search, ChevronDown, ChevronUp, BookOpen, CreditCard, User, Zap, MessageSquare } from 'lucide-react'

const FAQ_DATA = [
  {
    categoryKey: 'category_general',
    categoryEn: 'General',
    categoryHi: 'सामान्य (General)',
    icon: <BookOpen size={18} />,
    color: '#3b82f6',
    questions: [
      {
        qEn: 'What is TicketFlow AI?',
        qHi: 'टिकटफ़्लो एआई क्या है?',
        aEn: 'TicketFlow AI is an intelligent support ticketing system that uses machine learning to automatically prioritize and route your support requests to the right team.',
        aHi: 'टिकटफ़्लो एआई एक बुद्धिमान सहायता टिकटिंग प्रणाली है जो आपके सपोर्ट रिक्वेस्ट को स्वचालित रूप से सही टीम को असाइन करती है।'
      },
      {
        qEn: 'How long does it take to get a response?',
        qHi: 'उत्तर मिलने में कितना समय लगता है?',
        aEn: 'Our AI triage ensures critical tickets get a response within 1 hour. High priority tickets within 4 hours, and standard tickets within 24 hours during business days.',
        aHi: 'हमारा एआई ट्राइएज यह सुनिश्चित करता है कि गंभीर (Critical) टिकटों पर 1 घंटे के भीतर उत्तर मिले, उच्च प्राथमिकता पर 4 घंटे में और सामान्य पर 24 घंटे में।'
      },
      {
        qEn: 'Can I track my ticket status?',
        qHi: 'क्या मैं अपने टिकट की स्थिति देख (ट्रैक कर) सकता हूँ?',
        aEn: 'Yes! Use the "Track Ticket" page in the sidebar and enter your Ticket ID (e.g. TK-8842) to get real-time status updates.',
        aHi: 'हाँ! साइडबार में "टिकट ट्रैक करें" पेज का उपयोग करें और वास्तविक समय की स्थिति देखने के लिए अपनी टिकट आईडी दर्ज करें।'
      },
      {
        qEn: 'Can I reopen a resolved ticket?',
        qHi: 'क्या मैं हल किए गए टिकट को पुनः खोल सकता हूँ?',
        aEn: 'Absolutely. Open the ticket from "My Tickets" and use the "Reopen Ticket" button if you feel your issue wasn\'t fully resolved.',
        aHi: 'बिल्कुल! यदि आपकी समस्या पूरी तरह से हल नहीं हुई है तो "मेरे टिकट" से टिकट खोलें और "रीओपन" बटन का उपयोग करें।'
      },
    ]
  },
  {
    categoryKey: 'category_tech',
    categoryEn: 'Technical Support',
    categoryHi: 'तकनीकी सहायता (Technical Support)',
    icon: <Zap size={18} />,
    color: '#10b981',
    questions: [
      {
        qEn: 'What file types can I attach to a ticket?',
        qHi: 'मैं टिकट में किस प्रकार की फ़ाइलें संलग्न (अटैच) कर सकता हूँ?',
        aEn: 'You can attach images (PNG, JPG, GIF, WEBP) and text files (TXT, LOG, CSV). Images are automatically uploaded to secure cloud storage.',
        aHi: 'आप चित्र (PNG, JPG, GIF, WEBP) और टेक्स्ट फ़ाइलें (TXT, LOG, CSV) संलग्न कर सकते हैं।'
      },
      {
        qEn: 'My application is throwing a 504 error. What should I do?',
        qHi: 'मेरा एप्लिकेशन 504 एरर दे रहा है। मुझे क्या करना चाहिए?',
        aEn: 'A 504 Gateway Timeout usually indicates a server-side issue. Submit a ticket with your error logs and we\'ll investigate within 30 minutes for critical issues.',
        aHi: '504 गेटवे टाइमआउट का अर्थ सर्वर-साइड समस्या है। अपने एरर लॉग के साथ एक टिकट जमा करें और हमारी टीम 30 मिनट में जांच करेगी।'
      },
      {
        qEn: 'How do I share error logs with support?',
        qHi: 'मैं सपोर्ट टीम के साथ एरर लॉग्स कैसे शेयर करूँ?',
        aEn: 'When submitting or replying to a ticket, use the file attachment feature to upload your log files directly. Our agents can then analyze them.',
        aHi: 'टिकट सबमिट करते या उत्तर देते समय, अपनी लॉग फ़ाइलें सीधे अपलोड करने के लिए फ़ाइल अटैचमेंट का उपयोग करें।'
      },
      {
        qEn: 'Can I submit multiple issues in one ticket?',
        qHi: 'क्या मैं एक ही टिकट में कई समस्याएं सबमिट कर सकता हूँ?',
        aEn: 'We recommend submitting one issue per ticket for faster resolution. Multiple issues in one ticket can slow down the triage process.',
        aHi: 'तेजी से समाधान के लिए हम प्रति टिकट एक समस्या सबमिट करने की सलाह देते हैं।'
      },
    ]
  },
  {
    categoryKey: 'category_billing',
    categoryEn: 'Billing & Subscriptions',
    categoryHi: 'बिलिंग और सदस्यता (Billing)',
    icon: <CreditCard size={18} />,
    color: '#f59e0b',
    questions: [
      {
        qEn: 'How do I update my billing information?',
        qHi: 'मैं अपनी बिलिंग जानकारी कैसे अपडेट करूँ?',
        aEn: 'Submit a ticket in the "Billing & Subscriptions" category and our billing team will assist you within one business day.',
        aHi: '"बिलिंग" श्रेणी में एक टिकट सबमिट करें और हमारी बिलिंग टीम एक कार्य दिवस के भीतर आपकी सहायता करेगी।'
      },
      {
        qEn: 'Can I get a refund?',
        qHi: 'क्या मुझे रिफंड मिल सकता है?',
        aEn: 'Refunds are evaluated on a case-by-case basis. Please submit a billing ticket with your invoice number and the reason for refund request.',
        aHi: 'रिफंड का मूल्यांकन मामले के आधार पर किया जाता है। कृपया चालान संख्या के साथ बिलिंग टिकट सबमिट करें।'
      },
      {
        qEn: 'What happens if I exceed my plan limits?',
        qHi: 'यदि मैं अपनी योजना की सीमा पार कर जाता हूँ तो क्या होगा?',
        aEn: 'You\'ll receive an automated notification before hitting limits. Our billing team will reach out to discuss upgrade options.',
        aHi: 'सीमा तक पहुँचने से पहले आपको एक स्वचालित सूचना प्राप्त होगी। हमारी टीम अपग्रेड विकल्पों पर चर्चा करेगी।'
      },
    ]
  },
  {
    categoryKey: 'category_account',
    categoryEn: 'Account & Access',
    categoryHi: 'खाता और पहुंच (Account & Access)',
    icon: <User size={18} />,
    color: '#8b5cf6',
    questions: [
      {
        qEn: 'How do I reset my password?',
        qHi: 'मैं अपना पासवर्ड कैसे रीसेट करूँ?',
        aEn: 'Use the "Forgot Password" option on the login page. You\'ll receive a reset link within 5 minutes to your registered email.',
        aHi: 'लॉगिन पेज पर "फॉरगॉट पासवर्ड" विकल्प का उपयोग करें। आपको 5 मिनट के भीतर रीसेट लिंक प्राप्त होगा।'
      },
      {
        qEn: 'Can I change my email address?',
        qHi: 'क्या मैं अपना ईमेल पता बदल सकता हूँ?',
        aEn: 'Yes, submit an Account Access ticket with your current and new email address. Our team will verify and update it within 24 hours.',
        aHi: 'हाँ, अपने वर्तमान और नए ईमेल पते के साथ एक खाता टिकट सबमिट करें। हमारी टीम 24 घंटे में इसे अपडेट करेगी।'
      },
      {
        qEn: 'How do I add team members to my account?',
        qHi: 'मैं अपने खाते में टीम के सदस्यों को कैसे जोड़ूँ?',
        aEn: 'Contact our support team via a Feature Request ticket to discuss multi-user access options for your account.',
        aHi: 'बहु-उपयोगकर्ता पहुंच (multi-user access) के लिए एक सपोर्ट टिकट के माध्यम से हमारी टीम से संपर्क करें।'
      },
    ]
  },
]

export default function FAQ({ user }) {
  const { t, lang } = useTranslation()
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
            <h1 className="faq-hero" style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, background: 'none', border: 'none', padding: 0 }}>
              {t('faq_title')}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {t('faq_subtitle')}
            </p>
            <div className="faq-search">
              <Search size={18} color="var(--text-muted)" />
              <input
                placeholder={t('faq_search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <button
              className={`cat-tab ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              {t('all_categories')}
            </button>
            {FAQ_DATA.map(c => {
              const label = lang === 'hi' ? c.categoryHi : c.categoryEn
              return (
                <button
                  key={c.categoryKey}
                  className={`cat-tab ${activeCategory === c.categoryEn ? 'active' : ''}`}
                  onClick={() => setActiveCategory(c.categoryEn)}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* FAQ Sections */}
          {filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontWeight: 600, color: '#94a3b8' }}>{t('no_faqs_found')} "{searchQuery}"</div>
              <div style={{ fontSize: '0.84rem', marginTop: 4 }}>{t('no_faqs_sub')}</div>
            </div>
          ) : (
            filteredData.map((cat, catIdx) => {
              const catTitle = lang === 'hi' ? cat.categoryHi : cat.categoryEn
              return (
                <div key={catIdx} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}18`, border: `1px solid ${cat.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color }}>
                      {cat.icon}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{catTitle}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 2 }}>({cat.questions.length})</span>
                  </div>

                  {cat.questions.map((item, qIdx) => {
                    const key = `${catIdx}-${qIdx}`
                    const isOpen = openItems[key]
                    const questionStr = lang === 'hi' ? item.qHi : item.qEn
                    const answerStr = lang === 'hi' ? item.aHi : item.aEn

                    return (
                      <div key={qIdx} className="faq-item">
                        <div className="faq-question" onClick={() => toggleItem(catIdx, qIdx)}>
                          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{questionStr}</span>
                          {isOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                        </div>
                        {isOpen && <div className="faq-answer">{answerStr}</div>}
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
