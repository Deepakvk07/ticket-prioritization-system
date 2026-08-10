import { supabase } from '../lib/supabase'

/**
 * Fetch all registered agents from Supabase.
 */
export async function getAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('registered_at', { ascending: false })
  if (error) throw error
  return data || []
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
 * Returns ONLY agents specializing in that specific problem category.
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
  if (/database|db|postgres|sql|mongo|redis|infra|server|crash|cluster|timeout|connection leak|downtime|cpu|memory|storage|disk/i.test(fullText)) {
    const dbAgents = registeredAgents.filter(a => {
      const d = (a.department || '').toLowerCase()
      return d.includes('database') || d.includes('infra') || d.includes('server')
    })
    if (dbAgents.length > 0) return dbAgents
  }

  // 2. Billing & Integrations / Payment Specialist
  if (/billing|payment|invoice|refund|charge|credit card|checkout|subscription|integration|stripe|paypal|transaction/i.test(fullText)) {
    const billingAgents = registeredAgents.filter(a => {
      const d = (a.department || '').toLowerCase()
      return d.includes('billing') || d.includes('integration') || d.includes('payment')
    })
    if (billingAgents.length > 0) return billingAgents
  }

  // 3. Web & UI/UX / App Specialist
  if (/ui|ux|frontend|web|app|button|layout|display|css|screen|react|view|page|browser|render|app crash/i.test(fullText)) {
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

  // 5. Check if department matches any word in category or problem text
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

  // Return all agents as absolute fallback if no department match exists
  return registeredAgents
}
