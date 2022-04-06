export interface CreatePaymentSheetForUserRequest {
    paymentId: string;
    amount: number,
    description: string;
    partnerId: string;
    currency: string;
}
