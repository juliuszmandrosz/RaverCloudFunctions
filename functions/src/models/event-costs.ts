export interface EventCosts {
    currency: string;
    /// Amount in the smallest currency unit
    paymentProcessorFeeBalance: number;
    eventPostponeBalance: number;
}
