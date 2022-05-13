import { getTicketRefsFromTicketSessions } from '../get-ticket-refs-from-ticket-sessions';
import { updateDocRefsBatch } from '../../utils/update-doc-refs-batch';
import { Ticket } from '../../models/ticket';
import { TicketPaymentSession } from '../../models/ticket-payment-session';

export async function updateTicketsOnEventCancelation(ticketSessions: TicketPaymentSession[]) {
    const ticketRefs = getTicketRefsFromTicketSessions(ticketSessions);

    await updateDocRefsBatch(ticketRefs, { isEventCanceled: true, isReturned: true } as Ticket);
}
