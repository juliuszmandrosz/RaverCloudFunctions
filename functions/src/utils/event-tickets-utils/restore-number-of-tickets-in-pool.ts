import { TicketPool } from '../../models/ticket-pool';

export function restoreNumberOfTicketsInPool(pool: TicketPool, ticketQuantityToRestore: number) {
    pool.ticketsSold -= ticketQuantityToRestore;
    pool.isSoldOut = false;
    pool.isCurrent = true;
}
