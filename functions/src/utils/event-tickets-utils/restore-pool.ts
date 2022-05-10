import { TicketPool } from '../../models/ticket-pool';

export function restorePool(pool: TicketPool) {
    pool.ticketsSold--;
    pool.isSoldOut = false;
    pool.isCurrent = true;
}
