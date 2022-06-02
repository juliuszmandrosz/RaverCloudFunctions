interface GetTotalRevenueParams {
    ticketPrice: number;
    vipPrice?: number;
    isVip: boolean;
}

export function getTotalRevenue({ ticketPrice, vipPrice, isVip }: GetTotalRevenueParams) {
    return ticketPrice + (isVip ? vipPrice! : 0);
}
