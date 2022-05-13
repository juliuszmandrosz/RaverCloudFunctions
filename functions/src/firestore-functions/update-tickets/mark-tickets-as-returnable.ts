import { getTicketPaymentSessionsFromEvent } from '../get-payment-sessions-from-event/get-ticket-payment-sessions-from-event';
import { getTicketRefsFromTicketSessions } from '../get-ticket-refs-from-ticket-sessions';
import { updateDocRefsBatch } from '../../utils/update-doc-refs-batch';
import { Ticket } from '../../models/ticket';

export async function markTicketsAsReturnable(eventId: string) {
    const ticketSessions = await getTicketPaymentSessionsFromEvent(eventId);
    const ticketRefs = getTicketRefsFromTicketSessions(ticketSessions);
    await updateDocRefsBatch(ticketRefs, { isReturnable: true } as Ticket);
}
