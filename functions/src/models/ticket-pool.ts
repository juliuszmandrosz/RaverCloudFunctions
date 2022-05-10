export interface TicketPool {
    currency: string;
    isCurrent: boolean;
    isSoldOut: boolean;
    poolNumber: number;
    ticketPrice: number;
    vipPrice: number;
    ticketQuantity: number;
    ticketsSold: number;
}
