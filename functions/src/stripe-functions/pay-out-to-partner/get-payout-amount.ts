interface GetPayoutAmountParams {
    /// Amount in the smallest currency unit
    eventPostponeBalance: number;

    clubIncome?: number;
}

export function getPayoutAmount({ eventPostponeBalance, clubIncome }: GetPayoutAmountParams) {
    // TODO - add currency support
    return (clubIncome ?? 0) * 100 + eventPostponeBalance;
}
