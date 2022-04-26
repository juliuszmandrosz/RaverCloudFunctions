import { TicketPool } from './ticket-pool';
import { TicketSales } from './ticket-sales';

export interface EventTickets {
    isSoldOut: boolean;
    ticketPools: TicketPool[];
    ticketSales: TicketSales;
    ticketQuantity: number;
}
