export interface CreateTicketPaymentSheetResponse {
    paymentIntentSecret: string;
    ephemeralKeySecret: string;
    customerId: string;
    paymentIntentId: string;
}