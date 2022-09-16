import { EventTickets } from '../models/event-tickets';
import { getCurrentOrLastPool } from './get-current-or-last-pool';

export function getCurrentTicketPrice(tickets: EventTickets): number {
    if (tickets.isSaleOnlyAtGate) {
        return tickets.priceAtGate!;
    }
    const currentTicketPool = getCurrentOrLastPool(tickets.ticketPools);
    return currentTicketPool.ticketPrice;
}
