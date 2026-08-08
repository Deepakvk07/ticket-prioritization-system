import { supabase } from '../lib/supabase'

export async function signInAdmin(email, password) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanPass = password.trim()

  // Primary Check for Master Admin credentials: ticketflowai@gmail.com / rtiwqm4eav
  if (cleanEmail === 'ticketflowai@gmail.com' && cleanPass === 'rtiwqm4eav') {
    try {
      await supabase.from('admins').upsert(
        { email: 'ticketflowai@gmail.com', password_hash: 'rtiwqm4eav', name: 'System Administrator' },
        { onConflict: 'email' }
      )
    } catch { /* ignore */ }
    return { email: 'ticketflowai@gmail.com', name: 'System Administrator', role: 'admin' }
  }

  // Fallback check against Supabase admins table
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .ilike('email', cleanEmail)
      .eq('password_hash', cleanPass)
      .maybeSingle()
    if (!error && data) return data
  } catch { /* ignore */ }

  return null
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
