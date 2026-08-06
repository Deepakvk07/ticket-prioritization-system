import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import AgentLogin from './pages/AgentLogin'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import TicketQueue from './pages/TicketQueue'
import TicketDetail from './pages/TicketDetail'
import NewTicket from './pages/NewTicket'
import Analytics from './pages/Analytics'
import ModelManagement from './pages/ModelManagement'
import Settings from './pages/Settings'
import TrackTicket from './pages/TrackTicket'
import FAQ from './pages/FAQ'
import Profile from './pages/Profile'
import TicketHistory from './pages/TicketHistory'
import SpecialistAgents from './pages/SpecialistAgents'

function getSafeDemoUser() {
  try {
    const val = localStorage.getItem('demo_user')
    if (!val || val === 'undefined' || val === 'null') return null
    return JSON.parse(val)
  } catch {
    return null
  }
}

function AuthGate({ children, user, loading }) {
  const demoUser = getSafeDemoUser()
  const currentUser = user || demoUser || { email: 'customer@ticketflow.ai', name: 'Valued Customer', role: 'customer' }

  if (loading && !currentUser) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#060913', flexDirection: 'column', gap: 16
      }}>
        <div style={{
          width: 44, height: 44, border: '3px solid #3b82f6',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading TicketFlow AI…</div>
      </div>
    )
  }

  return children
}

function withUser(Component, user) {
  const demoUser = getSafeDemoUser()
  const activeUser = user || demoUser || { email: 'customer@ticketflow.ai', name: 'Valued Customer', role: 'customer' }
  return <Component user={activeUser} />
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Default system to Light Mode
    const savedTheme = localStorage.getItem('tf_theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    localStorage.setItem('tf_theme', savedTheme)

    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => {
      try {
        if (listener && listener.subscription) {
          listener.subscription.unsubscribe()
        }
      } catch {}
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/agent-login" element={<AgentLogin />} />

        {/* Protected Customer & Admin Routes */}
        <Route path="/home" element={
          <AuthGate user={user} loading={loading}>{withUser(HomePage, user)}</AuthGate>
        } />
        <Route path="/dashboard" element={
          <AuthGate user={user} loading={loading}>{withUser(Dashboard, user)}</AuthGate>
        } />
        <Route path="/tickets" element={
          <AuthGate user={user} loading={loading}>{withUser(TicketQueue, user)}</AuthGate>
        } />
        <Route path="/tickets/new" element={
          <AuthGate user={user} loading={loading}>{withUser(NewTicket, user)}</AuthGate>
        } />
        <Route path="/tickets/:id" element={
          <AuthGate user={user} loading={loading}>{withUser(TicketDetail, user)}</AuthGate>
        } />
        <Route path="/history" element={
          <AuthGate user={user} loading={loading}>{withUser(TicketHistory, user)}</AuthGate>
        } />
        <Route path="/agents" element={
          <AuthGate user={user} loading={loading}>{withUser(SpecialistAgents, user)}</AuthGate>
        } />
        <Route path="/analytics" element={
          <AuthGate user={user} loading={loading}>{withUser(Analytics, user)}</AuthGate>
        } />
        <Route path="/model" element={
          <AuthGate user={user} loading={loading}>{withUser(ModelManagement, user)}</AuthGate>
        } />
        <Route path="/settings" element={
          <AuthGate user={user} loading={loading}>{withUser(Settings, user)}</AuthGate>
        } />
        <Route path="/track" element={
          <AuthGate user={user} loading={loading}>{withUser(TrackTicket, user)}</AuthGate>
        } />
        <Route path="/faq" element={
          <AuthGate user={user} loading={loading}>{withUser(FAQ, user)}</AuthGate>
        } />
        <Route path="/profile" element={
          <AuthGate user={user} loading={loading}>{withUser(Profile, user)}</AuthGate>
        } />

        {/* Default Route -> Customer Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
