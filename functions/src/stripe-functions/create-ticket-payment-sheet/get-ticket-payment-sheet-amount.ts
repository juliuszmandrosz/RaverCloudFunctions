interface GetTicketPaymentSheetAmountParams {
    clubIncome: number;
    serviceFeeAmount: number;
    promotionCodeAmountOff: number;
}

export function getTicketPaymentSheetAmount({
    clubIncome,
    serviceFeeAmount,
    promotionCodeAmountOff,
}: GetTicketPaymentSheetAmountParams): number {
    let amount = 0;

    amount += clubIncome;

    amount += serviceFeeAmount;

    amount -= promotionCodeAmountOff;

    return amount;
}
