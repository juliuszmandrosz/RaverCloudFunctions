interface GetPayoutAmountParams {
    eventPostponeBalance: number;
    clubIncome?: number;
}

export function getPayoutAmount({ eventPostponeBalance, clubIncome }: GetPayoutAmountParams) {
    // TODO - add currency support
    return ((clubIncome ?? 0) + eventPostponeBalance) * 100;
}
