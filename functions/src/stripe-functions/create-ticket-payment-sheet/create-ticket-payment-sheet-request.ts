export interface CreateTicketPaymentSheetRequest {
    ticketPaymentId: string;
    eventId: string;
    isVip: boolean;
    promotionCode?: string;
}