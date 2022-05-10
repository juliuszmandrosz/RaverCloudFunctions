import { TicketPool } from '../../models/ticket-pool';

export function resetPool(pool: TicketPool) {
    pool.ticketsSold = 0;
    pool.isSoldOut = false;
    pool.isCurrent = false;
}
