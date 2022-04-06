export interface CreatePaymentSheetForUserResponse {
    paymentIntentSecret: string;
    ephemeralKeySecret: string;
    customerId: string;
    paymentIntentId: string;
}