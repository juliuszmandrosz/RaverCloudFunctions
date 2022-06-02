interface GetTicketPaymentSheetAmountParams {
    revenue: number;
    serviceFeeAmount: number;
    promotionCodeAmountOff: number;
}

export function getTicketPaymentSheetAmount({
    revenue,
    serviceFeeAmount,
    promotionCodeAmountOff,
}: GetTicketPaymentSheetAmountParams): number {
    let amount = 0;

    amount += revenue;

    amount += serviceFeeAmount;

    amount -= promotionCodeAmountOff;

    return amount;
}
