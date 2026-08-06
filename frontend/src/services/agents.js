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
