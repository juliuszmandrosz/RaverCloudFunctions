interface GetVipPaymentSheetAmountParams {
    vipPrice: number;
    userFeeAmount: number;
    promotionCodeAmountOff: number;
}

export async function getVipPaymentSheetAmount({
    vipPrice,
    userFeeAmount,
    promotionCodeAmountOff,
}: GetVipPaymentSheetAmountParams) {
    let amount = 0;

    amount += vipPrice;

    amount += userFeeAmount;

    amount -= promotionCodeAmountOff;

    return amount;
}
