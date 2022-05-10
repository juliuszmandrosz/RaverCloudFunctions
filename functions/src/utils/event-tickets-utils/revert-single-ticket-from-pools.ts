import { EventTickets } from '../../models/event-tickets';
import { getCurrentOrLastPool } from './get-current-or-last-pool';
import { startPreviousPool } from './start-previous-pool';
import { restorePool } from './restore-pool';

export async function revertSingleTicketFromPools(tickets: EventTickets) {
    tickets.isSoldOut = false;

    const ticketPools = tickets.ticketPools;

    const currentPool = getCurrentOrLastPool(ticketPools);

    if (currentPool.ticketsSold === 0) {
        startPreviousPool(currentPool, ticketPools);
        return;
    }

    restorePool(currentPool);
}
