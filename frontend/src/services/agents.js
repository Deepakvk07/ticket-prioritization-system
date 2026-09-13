import { supabase } from '../lib/supabase'

function normalizeEmail(email) {
  let e = (email || '').trim().toLowerCase()
  if (e === 'ved@gmail.com') return 'vedprakash@gmail.com'
  return e
}

/**
 * Real Direct Messaging Service with Strict Person-Pair Chat Isolation & Cross-Device Supabase Sync
 */
export async function getDirectMessages(myEmail, otherEmail, ticketId) {
  const email1 = normalizeEmail(myEmail)
  const email2 = normalizeEmail(otherEmail)

  const pairKey = [email1, email2].sort().join('__')
  const msgMap = new Map()

  // 1. Fetch from Supabase tickets table for ticketId
  if (ticketId) {
    try {
      const { data } = await supabase
        .from('tickets')
        .select('id, activities, customer_email, customer_name, assigned_agent_email, assigned_agent')
        .eq('id', ticketId)
        .single()

      if (data && Array.isArray(data.activities)) {
        const ticketCustEmail = normalizeEmail(data.customer_email || 'customer@ticketflow.ai')
        const ticketAgtEmail = normalizeEmail(data.assigned_agent_email || 'agent@ticketflow.ai')

        data.activities.forEach(m => {
          if (m && (m.text || m.content || m.file_attachment)) {
            const msgId = m.id || `act_${m.created_at || Date.now()}`
            const rawRole = (m.author_role || '').toUpperCase()
            const isAgent = rawRole === 'AGENT' || (!rawRole && m.author && (m.author.toLowerCase().includes('agent') || m.author.toLowerCase().includes('support')))
            
            let sEmail = m.sender_email ? normalizeEmail(m.sender_email) : (isAgent ? ticketAgtEmail : ticketCustEmail)
            let rEmail = m.receiver_email ? normalizeEmail(m.receiver_email) : (isAgent ? ticketCustEmail : ticketAgtEmail)

            const role = rawRole || (isAgent ? 'AGENT' : 'CUSTOMER')

            msgMap.set(msgId, {
              id: msgId,
              ticket_id: ticketId,
              sender_email: sEmail,
              sender_name: m.sender_name || m.author || (isAgent ? (data.assigned_agent || 'Support Agent') : (data.customer_name || 'Customer')),
              receiver_email: rEmail,
              author_role: role,
              text: m.text || m.content || (m.file_attachment ? '📷 [Image Attachment]' : ''),
              content: m.text || m.content || (m.file_attachment ? '📷 [Image Attachment]' : ''),
              file_attachment: m.file_attachment || null,
              created_at: m.created_at || new Date().toISOString()
            })
          }
        })
      }
    } catch { /* ignore */ }
  }

  // 2. Fetch from Supabase ticket_activities table
  try {
    let actQuery = supabase.from('ticket_activities').select('*')
    if (ticketId) {
      actQuery = actQuery.eq('ticket_id', ticketId)
    }
    const { data: actData } = await actQuery
    if (Array.isArray(actData)) {
      actData.forEach(row => {
        try {
          if (row.content && row.content.startsWith('{')) {
            const parsed = JSON.parse(row.content)
            if (parsed.id && !msgMap.has(parsed.id)) {
              if (ticketId && (row.ticket_id === ticketId || parsed.ticket_id === ticketId)) {
                msgMap.set(parsed.id, parsed)
              } else {
                const s = normalizeEmail(parsed.sender_email)
                const r = normalizeEmail(parsed.receiver_email)
                if (!email1 || !email2 || (s === email1 && r === email2) || (s === email2 && r === email1)) {
                  msgMap.set(parsed.id, parsed)
                }
              }
            }
          }
        } catch { /* ignore */ }
      })
    }
  } catch { /* ignore */ }

  // 3. Merge/Fallback to LocalStorage for offline / instant sync
  try {
    if (ticketId) {
      const rawTicket = localStorage.getItem(`tf_ticket_chat_${ticketId}`)
      const ticketMsgs = rawTicket ? JSON.parse(rawTicket) : []
      ticketMsgs.forEach(m => {
        if (m && m.id && !msgMap.has(m.id)) msgMap.set(m.id, m)
      })
    }
    if (pairKey && pairKey !== '__') {
      const raw = localStorage.getItem(`tf_pair_chat_${pairKey}`)
      const localMsgs = raw ? JSON.parse(raw) : []
      localMsgs.forEach(m => {
        if (m && m.id && !msgMap.has(m.id)) msgMap.set(m.id, m)
      })
    }
  } catch { /* ignore */ }

  return Array.from(msgMap.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

/**
 * Helper to trigger topbar notification bell and browser Desktop Notification
 * Only triggers if targetRecipientEmail matches active user email (prevents self-notification)
 */
export function triggerChatNotification(title, text, targetRecipientEmail) {
  const activeUser = (() => {
    try { return JSON.parse(localStorage.getItem('demo_user') || '{}') } catch { return {} }
  })()
  const activeUserEmail = (activeUser.email || localStorage.getItem('user_email') || '').toLowerCase()
  const targetEmail = (targetRecipientEmail || '').toLowerCase()

  // If target recipient email is specified, ONLY trigger notification if the active user is the recipient!
  if (targetEmail && activeUserEmail && activeUserEmail !== targetEmail) {
    return
  }

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

export async function sendDirectMessage({ senderEmail, senderName, receiverEmail, text, fileAttachment, ticketId, authorRole }) {
  const sEmail = (senderEmail || '').trim().toLowerCase()
  const isAgentSender = sEmail.includes('agent') || sEmail.includes('admin') || sEmail.includes('@ticketflow.ai')
  const role = authorRole || (isAgentSender ? 'AGENT' : 'CUSTOMER')

  const trimmedText = (text || '').trim()
  const fallbackText = fileAttachment ? (fileAttachment.type?.startsWith('image/') ? '📷 [Image Attachment]' : `📎 [File: ${fileAttachment.name}]`) : ''
  const finalContent = trimmedText || fallbackText

  const msgObj = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticket_id: ticketId || null,
    sender_email: sEmail,
    sender_name: senderName || (role === 'AGENT' ? 'Support Agent' : 'Customer'),
    receiver_email: (receiverEmail || '').trim().toLowerCase(),
    author_role: role,
    text: finalContent,
    content: finalContent,
    file_attachment: fileAttachment || null,
    created_at: new Date().toISOString()
  }

  // 1. Save in ticket-specific and pair local cache
  try {
    if (ticketId) {
      const ticketKey = `tf_ticket_chat_${ticketId}`
      const raw = localStorage.getItem(ticketKey)
      const list = raw ? JSON.parse(raw) : []
      localStorage.setItem(ticketKey, JSON.stringify([...list, msgObj]))
    }
    const pairKey = [msgObj.sender_email, msgObj.receiver_email].filter(Boolean).sort().join('__')
    if (pairKey) {
      const localKey = `tf_pair_chat_${pairKey}`
      const raw = localStorage.getItem(localKey)
      const list = raw ? JSON.parse(raw) : []
      localStorage.setItem(localKey, JSON.stringify([...list, msgObj]))
    }
  } catch { /* ignore */ }

  // 2. Persist to Supabase tickets.activities array so ALL devices receive it live
  try {
    let targetTicketId = ticketId
    if (!targetTicketId && msgObj.sender_email) {
      const { data: found } = await supabase.from('tickets').select('id, activities').or(`customer_email.ilike.${msgObj.sender_email},customer_email.ilike.${msgObj.receiver_email}`).limit(1)
      if (Array.isArray(found) && found.length > 0) {
        targetTicketId = found[0].id
      }
    }

    if (targetTicketId) {
      const { data: t } = await supabase.from('tickets').select('activities').eq('id', targetTicketId).single()
      if (t) {
        const updatedActivities = [...(t.activities || []), msgObj]
        await supabase.from('tickets').update({ activities: updatedActivities }).eq('id', targetTicketId)
      }
    }
  } catch (err) {
    console.warn('Supabase tickets activity update note:', err)
  }

  // 3. Also insert into ticket_activities table in Supabase
  try {
    await supabase.from('ticket_activities').insert([{
      id: msgObj.id,
      ticket_id: ticketId || 'global',
      type: 'message',
      author: msgObj.sender_name,
      author_role: role,
      content: JSON.stringify(msgObj),
      created_at: msgObj.created_at
    }])
  } catch (err) {
    console.warn('Supabase ticket_activities insert note:', err)
  }

  // Trigger Notification ONLY for the recipient (NOT for sender)
  const notifText = fileAttachment ? `📎 Attached file: ${fileAttachment.name}` : text
  triggerChatNotification(`💬 New Message from ${senderName || 'TicketFlow AI'}`, notifText, msgObj.receiver_email)

  return msgObj
}

export const DEFAULT_AGENTS = []

export async function getAgents() {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('registered_at', { ascending: false })

    if (!error && Array.isArray(data)) {
      return data
    }
  } catch { /* fallback */ }

  return []
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
