interface GetTotalRevenueParams {
    eventPrice: number;
    vipPrice: number;
    isVip: boolean;
}

export async function getTotalRevenue({ eventPrice, vipPrice, isVip }: GetTotalRevenueParams) {
    return eventPrice + (isVip ? vipPrice : 0);
}
