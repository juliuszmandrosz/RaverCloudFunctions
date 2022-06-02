interface GetTicketPaymentSheetAmountParams {
    clubIncome: number;
    userFeeAmount: number;
    promotionCodeAmountOff: number;
}

export function getTicketPaymentSheetAmount({
    clubIncome,
    userFeeAmount,
    promotionCodeAmountOff,
}: GetTicketPaymentSheetAmountParams): number {
    let amount = 0;

    amount += clubIncome;

    amount += userFeeAmount;

    amount -= promotionCodeAmountOff;

    return amount;
}
