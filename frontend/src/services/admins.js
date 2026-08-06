import { supabase } from '../lib/supabase'

export async function signInAdmin(email, password) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .ilike('email', email.trim())
    .eq('password_hash', password)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getTicketRating(ticketId, email) {
  const { data, error } = await supabase
    .from('ticket_ratings')
    .select('rating')
    .eq('ticket_id', String(ticketId))
    .ilike('email', email || '')
    .maybeSingle()
  if (error) return null
  return data?.rating || null
}

export async function saveTicketRating(ticketId, rating, email) {
  const { error } = await supabase
    .from('ticket_ratings')
    .upsert(
      { ticket_id: String(ticketId), rating, email: (email || '').toLowerCase() },
      { onConflict: 'ticket_id,email' }
    )
  if (error) throw error
}
