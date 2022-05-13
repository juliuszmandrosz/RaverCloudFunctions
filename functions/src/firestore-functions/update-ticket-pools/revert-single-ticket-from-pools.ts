import { EventTickets } from '../../models/event-tickets';
import { startPreviousPool } from './start-previous-pool';
import { restorePool } from './restore-pool';
import { getCurrentOrLastPool } from '../../utils/get-current-or-last-pool';

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
