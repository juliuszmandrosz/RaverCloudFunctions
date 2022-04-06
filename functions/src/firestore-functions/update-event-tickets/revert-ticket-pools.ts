import { EventTickets } from '../../models/event-tickets';
import { TicketPool } from '../../models/ticket-pool';

export async function revertTicketPools(tickets: EventTickets) {
    tickets.isSoldOut = false;

    const ticketPools = tickets.ticketPools;

    const lastPool = ticketPools[ticketPools.length - 1];
    const currentPool = ticketPools.find((pool) => pool.isCurrent) ?? lastPool;

    if (currentPool.ticketsSold === 0) {
        startPreviousPool(currentPool, ticketPools);
        return;
    }

    restorePool(currentPool);
}

function startPreviousPool(currentPool: TicketPool, ticketPools: TicketPool[]) {
    const previousPool = ticketPools.find((pool) => pool.poolNumber == currentPool.poolNumber - 1)!;
    restorePool(previousPool);

    const index = ticketPools.indexOf(previousPool);
    ticketPools[index] = previousPool;
}

function restorePool(pool: TicketPool) {
    pool.ticketsSold--;
    pool.isSoldOut = false;
    pool.isCurrent = true;
}
