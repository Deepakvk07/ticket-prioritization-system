import { supabase } from '../lib/supabase'

export async function getCustomerByEmail(email) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function registerCustomer({ name, email, password }) {
  const { data, error } = await supabase
    .from('customers')
    .upsert(
      {
        name,
        email: email.trim().toLowerCase(),
        password_hash: password,
        registered_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function signInCustomer(email, password) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('email', email.trim())
    .eq('password_hash', password)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateCustomerProfile(email, updates) {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .ilike('email', email.trim())
    .select()
    .single()
  if (error) throw error
  return data
}
