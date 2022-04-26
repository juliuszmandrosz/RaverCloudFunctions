export interface CreatePaymentSheetForUserRequest {
    transferGroupId: string;
    amount: number;
    description: string;
    partnerId: string;
    currency: string;
}
