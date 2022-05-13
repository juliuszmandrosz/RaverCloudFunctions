import { TicketPaymentSession } from '../models/ticket-payment-session';
import { getTicketDocRef } from './get-data/get-ticket-data';

export function getTicketRefsFromTicketSessions(ticketSessions: TicketPaymentSession[]) {
    return ticketSessions.map((session) => getTicketDocRef(session.userId, session.ticketId));
}
