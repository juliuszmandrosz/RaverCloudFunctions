import { EventTickets } from '../../models/event-tickets';
import { resetPool } from './reset-pool';
import { startPreviousPool } from './start-previous-pool';
import { restoreNumberOfTicketsInPool } from './restore-number-of-tickets-in-pool';
import { getCurrentOrLastPool } from '../../utils/get-current-or-last-pool';

export async function revertTicketQuantityFromPools(
    tickets: EventTickets,
    ticketQuantityToRevert: number
) {
    if (ticketQuantityToRevert === 0) return;

    tickets.isSoldOut = false;

    const ticketPools = tickets.ticketPools;

    const currentPool = getCurrentOrLastPool(ticketPools);

    while (ticketQuantityToRevert > 0) {
        const ticketQuantityToRevertInCurrentPool = ticketQuantityToRevert;
        ticketQuantityToRevert -= currentPool.ticketsSold;

        if (ticketQuantityToRevert > 0) {
            resetPool(currentPool);
            startPreviousPool(currentPool, ticketPools);
            ticketQuantityToRevert--;
            continue;
        }

        restoreNumberOfTicketsInPool(currentPool, ticketQuantityToRevertInCurrentPool);
    }
}
