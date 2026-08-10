import { supabase } from '../lib/supabase'

/**
 * Real Direct Messaging Service with Strict Person-Pair Chat Isolation
 */
export async function getDirectMessages(myEmail, otherEmail) {
  const email1 = (myEmail || '').trim().toLowerCase()
  const email2 = (otherEmail || '').trim().toLowerCase()

  if (!email1 || !email2) return []

  const pairKey = [email1, email2].sort().join('__')
  let messages = []

  // 1. Try Supabase agent_messages table with strict pair filtering
  try {
    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .or(`and(sender_email.ilike.${email1},receiver_email.ilike.${email2}),and(sender_email.ilike.${email2},receiver_email.ilike.${email1})`)
      .order('created_at', { ascending: true })

    if (!error && Array.isArray(data)) {
      messages = data
    }
  } catch { /* fallback */ }

  // 2. Merge/Fallback to LocalStorage for offline / instant sync (isolated by pairKey)
  try {
    const raw = localStorage.getItem(`tf_pair_chat_${pairKey}`)
    const localMsgs = raw ? JSON.parse(raw) : []
    const map = new Map()
    messages.forEach(m => map.set(m.id, m))
    localMsgs.forEach(m => {
      // Ensure only messages strictly between email1 and email2 are included
      const s = (m.sender_email || '').toLowerCase()
      const r = (m.receiver_email || '').toLowerCase()
      if ((s === email1 && r === email2) || (s === email2 && r === email1)) {
        if (!map.has(m.id)) map.set(m.id, m)
      }
    })
    return Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  } catch {
    return messages
  }
}

/**
 * Helper to trigger topbar notification bell and browser Desktop Notification
 */
export function triggerChatNotification(title, text) {
  // 1. Add to Topbar Notification Bell Storage
  try {
    const rawNotifs = localStorage.getItem('tf_notifications') || '[]'
    const notifs = JSON.parse(rawNotifs)
    const newNotif = {
      id: Date.now(),
      icon: 'ticket',
      title: title,
      text: text,
      time: 'Just now',
      read: false
    }
    localStorage.setItem('tf_notifications', JSON.stringify([newNotif, ...notifs]))
    window.dispatchEvent(new Event('storage'))
  } catch { /* ignore */ }

  // 2. Request and trigger Native Browser Push Notification
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: text, icon: '💬' })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            new Notification(title, { body: text, icon: '💬' })
          }
        })
      }
    }
  } catch { /* ignore */ }
}

export async function sendDirectMessage({ senderEmail, senderName, receiverEmail, text, fileAttachment }) {
  const msgObj = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender_email: (senderEmail || 'admin@ticketflow.ai').trim().toLowerCase(),
    sender_name: senderName || 'Administrator',
    receiver_email: (receiverEmail || '').trim().toLowerCase(),
    text: (text || '').trim(),
    file_attachment: fileAttachment || null,
    created_at: new Date().toISOString()
  }

  // Save in isolated pair local cache
  try {
    const pairKey = [msgObj.sender_email, msgObj.receiver_email].sort().join('__')
    const localKey = `tf_pair_chat_${pairKey}`
    const raw = localStorage.getItem(localKey)
    const list = raw ? JSON.parse(raw) : []
    localStorage.setItem(localKey, JSON.stringify([...list, msgObj]))
  } catch { /* ignore */ }

  // Try Supabase insert
  try {
    await supabase.from('agent_messages').insert([msgObj])
  } catch { /* fallback */ }

  // Trigger Notification for the recipient
  const notifText = fileAttachment ? `📎 Attached file: ${fileAttachment.name}` : text
  triggerChatNotification(`💬 New Message from ${senderName || 'TicketFlow AI'}`, notifText)

  return msgObj
}

export const DEFAULT_AGENTS = [
  {
    name: 'Amar',
    email: 'amar@gmail.com',
    department: 'Database & Infrastructure',
    password_hash: 'amar123',
    status: 'Online',
    registered_at: new Date().toISOString()
  },
  {
    name: 'Deepak',
    email: 'deepak@gmail.com',
    department: 'Web & UI/UX',
    password_hash: 'deepak123',
    status: 'Online',
    registered_at: new Date().toISOString()
  },
  {
    name: 'Ved Prakash',
    email: 'vedprakash@gmail.com',
    department: 'Billing & Integrations',
    password_hash: 'ved123',
    status: 'Online',
    registered_at: new Date().toISOString()
  },
  {
    name: 'Siddharth',
    email: 'siddharth@gmail.com',
    department: 'API & Security',
    password_hash: 'siddharth123',
    status: 'Online',
    registered_at: new Date().toISOString()
  }
]

export async function getAgents() {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('registered_at', { ascending: false })

    if (!error && Array.isArray(data) && data.length > 0) {
      return data
    }
  } catch { /* fallback */ }

  return DEFAULT_AGENTS
}

/**
 * Fetch a single agent by email.
 */
export async function getAgentByEmail(email) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Register a new agent (upsert so re-registering updates their record).
 */
export async function registerAgent({ name, email, department, password }) {
  const { data, error } = await supabase
    .from('agents')
    .upsert(
      {
        name,
        email: email.trim().toLowerCase(),
        department,
        password_hash: password, // stored as plain text for demo — swap with hashing in production
        status: 'Online',
        registered_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Sign in an agent — look up by email + password.
 */
export async function signInAgent(email, password) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .ilike('email', email.trim())
    .eq('password_hash', password)
    .maybeSingle()
  if (error) throw error
  return data // null if not found / wrong password
}

/**
 * Update agent status (Online / Offline).
 */
export async function updateAgentStatus(email, status) {
  const { error } = await supabase
    .from('agents')
    .update({ status })
    .ilike('email', email.trim())
  if (error) throw error
}

/**
 * Remove an agent by email (admin only).
 */
export async function removeAgent(email) {
  const { error } = await supabase
    .from('agents')
    .delete()
    .ilike('email', email.trim())
  if (error) throw error
}

/**
 * Intelligently matches a ticket to specialist agents based on problem text (subject, description, category, product_module).
 * Returns ONLY the specific agent specializing in that specific problem category.
 */
export function getMatchingAgentsForTicket(ticket, registeredAgents) {
  if (!registeredAgents || registeredAgents.length === 0) return []

  const subject = (ticket?.subject || '').toLowerCase()
  const desc = (ticket?.description || '').toLowerCase()
  const cat = (ticket?.category || '').toLowerCase()
  const module = (ticket?.product_module || '').toLowerCase()
  const issue = (ticket?.issue_type || '').toLowerCase()

  const fullText = `${subject} ${desc} ${cat} ${module} ${issue}`

  // 1. Database & Infrastructure Specialist
  if (/database|db|postgres|sql|mongo|redis|infra|server|cluster|timeout|connection|downtime|cpu|memory|storage|disk|crashed/i.test(fullText)) {
    const dbAgents = registeredAgents.filter(a => {
      const d = (a.department || '').toLowerCase()
      return d.includes('database') || d.includes('infra') || d.includes('server')
    })
    if (dbAgents.length > 0) return dbAgents
  }

  // 2. Billing & Integrations / Payment Specialist
  if (/billing|payment|invoice|refund|charge|credit|card|checkout|subscription|integration|stripe|paypal|transaction|accepted/i.test(fullText)) {
    const billingAgents = registeredAgents.filter(a => {
      const d = (a.department || '').toLowerCase()
      return d.includes('billing') || d.includes('integration') || d.includes('payment')
    })
    if (billingAgents.length > 0) return billingAgents
  }

  // 3. Web & UI/UX / App Specialist
  if (/ui|ux|frontend|web|layout|display|css|screen|react|view|page|browser|render|app crash|button|design|working/i.test(fullText)) {
    const webAgents = registeredAgents.filter(a => {
      const d = (a.department || '').toLowerCase()
      return d.includes('web') || d.includes('ui') || d.includes('ux') || d.includes('frontend')
    })
    if (webAgents.length > 0) return webAgents
  }

  // 4. API & Security Operations Specialist
  if (/api|security|auth|oauth|token|permission|breach|webhook|cors|ssl|endpoint|gateway/i.test(fullText)) {
    const apiAgents = registeredAgents.filter(a => {
      const d = (a.department || '').toLowerCase()
      return d.includes('api') || d.includes('security') || d.includes('auth')
    })
    if (apiAgents.length > 0) return apiAgents
  }

  // 5. Department keyword match
  const deptMatch = registeredAgents.filter(a => {
    const d = (a.department || '').toLowerCase()
    return d === cat || cat.includes(d) || d.includes(cat) || fullText.includes(d)
  })
  if (deptMatch.length > 0) return deptMatch

  // 6. Default to Technical Support / General agents
  const supportAgents = registeredAgents.filter(a => {
    const d = (a.department || '').toLowerCase()
    return d.includes('support') || d.includes('technical')
  })
  if (supportAgents.length > 0) return supportAgents

  // 7. Strict fallback: pick single agent deterministically based on ticket ID hash
  const ticketIndex = Math.abs((ticket?.id || ticket?.subject || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % registeredAgents.length
  return [registeredAgents[ticketIndex]]
}
