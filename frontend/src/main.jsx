import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('TicketFlow UI Error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '40px auto', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', color: '#0f172a' }}>
          <h2 style={{ color: '#ef4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: 10 }}>⚠️ TicketFlow Application Recovery</h2>
          <p style={{ color: '#64748b' }}>An unexpected error occurred while rendering this page:</p>
          <pre style={{ background: '#f8fafc', padding: 16, borderRadius: 8, color: '#dc2626', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid #fee2e2' }}>
            {this.state.error?.toString()}
          </pre>
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button onClick={() => { localStorage.clear(); window.location.href = '/agent-login' }} style={{ padding: '10px 20px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              🎧 Go to Agent Login
            </button>
            <button onClick={() => { localStorage.clear(); window.location.href = '/' }} style={{ padding: '10px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              🔄 Clear Session & Reset
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
