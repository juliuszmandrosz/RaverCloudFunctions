export interface CreatePaymentSheetForPartnerRequest {
    /// Amount in the smallest currency unit
    amount: number;
    description: string;
    currency: string;
}
