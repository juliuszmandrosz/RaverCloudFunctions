import { TicketPool } from '../models/ticket-pool';

export function getCurrentOrLastPool(ticketPools: TicketPool[]) {
    const lastPool = ticketPools[ticketPools.length - 1];
    return ticketPools.find((pool) => pool.isCurrent) ?? lastPool;
}
