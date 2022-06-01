interface GetTotalRevenueParams {
    ticketPrice: number;
    vipPrice?: number;
    isVip: boolean;
}

export async function getTotalRevenue({ ticketPrice, vipPrice, isVip }: GetTotalRevenueParams) {
    return ticketPrice + (isVip ? vipPrice! : 0);
}
