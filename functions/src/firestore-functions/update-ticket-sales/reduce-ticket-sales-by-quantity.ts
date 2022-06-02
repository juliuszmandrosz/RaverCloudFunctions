import { TicketSales } from '../../models/ticket-sales';
import { getClubIncome } from '../../utils/get-club-income';

interface ReduceTicketSalesByQuantityParams {
    currentTicketSales: TicketSales;
    ticketQuantityToReduce: number;
    vipQuantityToReduce: number;
    totalRevenueToReduce: number;
}

export async function reduceTicketSalesByQuantity({
    currentTicketSales,
    ticketQuantityToReduce,
    vipQuantityToReduce,
    totalRevenueToReduce,
}: ReduceTicketSalesByQuantityParams) {
    const eventFee = currentTicketSales.eventFee;

    currentTicketSales.ticketsSold -= ticketQuantityToReduce;
    currentTicketSales.vipsSold -= vipQuantityToReduce;
    currentTicketSales.totalRevenue -= totalRevenueToReduce;

    currentTicketSales.clubIncome -= await getClubIncome(totalRevenueToReduce, eventFee);
}
