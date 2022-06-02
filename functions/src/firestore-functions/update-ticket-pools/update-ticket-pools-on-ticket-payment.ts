import { EventTickets } from '../../models/event-tickets';
import { getCurrentOrLastPool } from '../../utils/get-current-or-last-pool';
import { startNextPool } from './start-next-pool';

export async function updateTicketPoolsOnTicketPayment(tickets: EventTickets) {
    const ticketPools = tickets.ticketPools;

    const currentPool = getCurrentOrLastPool(ticketPools);
    currentPool.ticketsSold++;

    const isCurrentPoolSoldOut = currentPool.ticketsSold === currentPool.ticketQuantity;

    if (isCurrentPoolSoldOut) {
        currentPool.isSoldOut = true;
        currentPool.isCurrent = false;

        const lastPoolNumber = ticketPools[ticketPools.length - 1].poolNumber;
        const isLastPool = currentPool.poolNumber === lastPoolNumber;

        tickets.isSoldOut = isLastPool;

        if (!isLastPool) {
            startNextPool(currentPool, ticketPools);
        }
    }
}
