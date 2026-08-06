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
    .select('rating, feedback_comment')
    .eq('ticket_id', String(ticketId))
    .ilike('email', email || '')
    .maybeSingle()
  if (error) return null
  return data ? { rating: data.rating, comment: data.feedback_comment } : null
}

export async function saveTicketRating(ticketId, rating, email, comment = '') {
  const { error } = await supabase
    .from('ticket_ratings')
    .upsert(
      { ticket_id: String(ticketId), rating, email: (email || '').toLowerCase(), feedback_comment: comment },
      { onConflict: 'ticket_id,email' }
    )
  if (error) {
    // Fallback if feedback_comment column doesn't exist in Supabase
    await supabase.from('ticket_ratings').upsert(
      { ticket_id: String(ticketId), rating, email: (email || '').toLowerCase() },
      { onConflict: 'ticket_id,email' }
    )
  }
}
