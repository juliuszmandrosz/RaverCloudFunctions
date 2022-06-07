export interface CreateVipPaymentSheetRequest {
    ticketId: string;
    sendInvoice: boolean;
    promotionCode?: string;
}
