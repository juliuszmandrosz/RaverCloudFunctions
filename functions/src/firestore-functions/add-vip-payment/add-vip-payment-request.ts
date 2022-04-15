export interface AddVipPaymentRequest {
    vipPaymentId: string;
    paymentIntentId: string;
    ticketId: string;
    promotionCode?: string;
}