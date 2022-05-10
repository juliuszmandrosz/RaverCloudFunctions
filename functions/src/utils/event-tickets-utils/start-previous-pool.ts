import { TicketPool } from '../../models/ticket-pool';
import { restorePool } from './restore-pool';

export function startPreviousPool(currentPool: TicketPool, ticketPools: TicketPool[]) {
    const previousPool = ticketPools.find((pool) => pool.poolNumber == currentPool.poolNumber - 1)!;
    restorePool(previousPool);

    const index = ticketPools.indexOf(previousPool);
    ticketPools[index] = previousPool;
}
