export interface TicketPool {
    currency: string;
    isCurrent: boolean;
    isSoldOut: boolean;
    poolNumber: number;
    ticketPrice: number;
    ticketQuantity: number;
    ticketsSold: number;
}