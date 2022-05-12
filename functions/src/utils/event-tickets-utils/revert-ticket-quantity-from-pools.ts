import {EventTickets} from '../../models/event-tickets';
import {getCurrentOrLastPool} from './get-current-or-last-pool';
import {resetPool} from './reset-pool';
import {startPreviousPool} from './start-previous-pool';
import {restoreNumberOfTicketsInPool} from './restore-number-of-tickets-in-pool';

export async function revertTicketQuantityFromPools(
    tickets: EventTickets,
    ticketQuantityToRevert: number
) {
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
