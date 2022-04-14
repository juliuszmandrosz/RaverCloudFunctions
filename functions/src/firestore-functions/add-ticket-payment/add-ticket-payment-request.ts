export interface AddTicketPaymentRequest {
    ticketPaymentId: string;
    paymentIntentId: string;
    eventId: string;
    isVip: boolean,
    promotionCode?: string;
}