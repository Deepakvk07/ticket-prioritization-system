/**
 * TicketFlow AI — Authentication & Customer Ticket Isolation Helpers
 *
 * Enforces strict per-customer isolation while allowing unauthenticated guest users
 * or newly submitted tickets in the current browser session to be visible.
 */

export function getMyTicketIds() {
  try {
    const fromIds = JSON.parse(localStorage.getItem('tf_my_ticket_ids') || '[]')
    const fromLocal = JSON.parse(localStorage.getItem('tf_local_tickets') || '[]').map(t => t?.id)
    return new Set([...fromIds, ...fromLocal].filter(Boolean))
  } catch {
    return new Set()
  }
}

export function addMyTicketId(ticketId) {
  if (!ticketId) return
  try {
    const list = JSON.parse(localStorage.getItem('tf_my_ticket_ids') || '[]')
    if (!list.includes(ticketId)) {
      list.unshift(ticketId)
      localStorage.setItem('tf_my_ticket_ids', JSON.stringify(list))
    }
  } catch {}
}

export function clearMySessionTickets() {
  try {
    localStorage.removeItem('tf_my_ticket_ids')
    localStorage.removeItem('tf_local_tickets')
  } catch {}
}

export function getCurrentUserEmail(user) {
  const demoUser = (() => {
    try { return JSON.parse(localStorage.getItem('demo_user') || '{}') } catch { return {} }
  })()
  return (
    user?.email ||
    demoUser?.email ||
    localStorage.getItem('user_email') ||
    ''
  ).toLowerCase().trim()
}

/**
 * Determines whether a customer is authorized to see a specific ticket.
 *
 * Rules:
 * 1. If ticket was created in this browser session (tf_my_ticket_ids / tf_local_tickets) -> ALWAYS VISIBLE
 * 2. If customer is authenticated with an email:
 *    - Visible if ticket customer_email matches user email (case-insensitive)
 *    - Visible if ticket has default fallback 'customer@ticketflow.ai' (e.g. created prior to login)
 *    - Hidden if ticket belongs to another specific customer email (e.g. userB@gmail.com vs userA@gmail.com)
 * 3. If customer is unauthenticated (guest / no email in session):
 *    - Visible if ticket has default guest email ('customer@ticketflow.ai' or empty)
 *    - Hidden if ticket belongs to a specific authenticated user
 */
export function canCustomerViewTicket(ticket, userOrEmail) {
  if (!ticket) return false

  const tCustEmail = (ticket.customer_email || '').toLowerCase().trim()
  const userEmail = typeof userOrEmail === 'string'
    ? userOrEmail.toLowerCase().trim()
    : getCurrentUserEmail(userOrEmail)

  const myTicketIds = getMyTicketIds()
  if (ticket.id && myTicketIds.has(ticket.id)) {
    return true
  }

  if (userEmail) {
    // Authenticated customer
    if (tCustEmail === userEmail) return true
    if (tCustEmail === 'customer@ticketflow.ai' || !tCustEmail) return true
    return false
  }

  // Unauthenticated guest customer
  return !tCustEmail || tCustEmail === 'customer@ticketflow.ai'
}
