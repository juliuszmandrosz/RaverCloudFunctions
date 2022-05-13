import { getTicketPaymentSessionsFromEvent } from '../get-payment-sessions-from-event/get-ticket-payment-sessions-from-event';
import { getTicketRefsFromTicketSessions } from '../get-ticket-refs-from-ticket-sessions';
import { updateDocRefsBatch } from '../../utils/update-doc-refs-batch';
import { Ticket } from '../../models/ticket';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

interface UpdateTicketsOnEventPostponeParams {
    eventId: string;
    newEventStartDateTime: Timestamp;
}

export async function updateTicketsOnEventPostpone({
    eventId,
    newEventStartDateTime,
}: UpdateTicketsOnEventPostponeParams) {
    const ticketSessions = await getTicketPaymentSessionsFromEvent(eventId);
    const ticketRefs = getTicketRefsFromTicketSessions(ticketSessions);
    await updateDocRefsBatch(ticketRefs, {
        isReturnable: true,
        eventDateTime: newEventStartDateTime,
    } as Ticket);
}
