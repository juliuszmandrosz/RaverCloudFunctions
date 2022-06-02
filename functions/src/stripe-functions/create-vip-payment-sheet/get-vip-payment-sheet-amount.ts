interface GetVipPaymentSheetAmountParams {
    vipPrice: number;
    serviceFeeAmount: number;
    promotionCodeAmountOff: number;
}

export async function getVipPaymentSheetAmount({
    vipPrice,
    serviceFeeAmount,
    promotionCodeAmountOff,
}: GetVipPaymentSheetAmountParams) {
    let amount = 0;

    amount += vipPrice;

    amount += serviceFeeAmount;

    amount -= promotionCodeAmountOff;

    return amount;
}
