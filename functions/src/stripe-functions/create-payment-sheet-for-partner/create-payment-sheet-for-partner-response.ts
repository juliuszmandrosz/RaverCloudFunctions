export interface CreatePaymentSheetForPartnerResponse {
    paymentIntentSecret: string;
    ephemeralKeySecret: string;
    customerId: string;
    paymentIntentId: string;
}
