import { TicketPool } from '../../models/ticket-pool';

export function startNextPool(currentPool: TicketPool, ticketPools: TicketPool[]) {
    const nextPool = ticketPools.find((pool) => pool.poolNumber == currentPool.poolNumber + 1)!;
    nextPool.isCurrent = true;

    const index = ticketPools.indexOf(nextPool);
    ticketPools[index] = nextPool;
}
