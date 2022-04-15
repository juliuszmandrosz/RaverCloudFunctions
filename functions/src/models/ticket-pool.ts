export interface TicketPool {
    id: string,
    poolNumber: number;
    ticketQuantity: number;
    ticketPrice: number;
    currency: string;
    isCurrent: boolean;
    isSoldOff: boolean;
}