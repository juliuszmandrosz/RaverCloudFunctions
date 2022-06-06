export interface CreateTicketPaymentSheetRequest {
    eventId: string;
    isVip: boolean;
    sendInvoice: boolean;
    promotionCode?: string;
}
