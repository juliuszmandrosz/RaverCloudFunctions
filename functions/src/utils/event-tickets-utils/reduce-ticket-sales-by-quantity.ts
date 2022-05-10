import { TicketSales } from '../../models/ticket-sales';
import { getClubIncome } from './get-club-income';

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
    currentTicketSales.ticketsSold -= ticketQuantityToReduce;
    currentTicketSales.vipsSold -= vipQuantityToReduce;
    currentTicketSales.totalRevenue -= totalRevenueToReduce;

    currentTicketSales.clubIncome -= await getClubIncome(totalRevenueToReduce);
}
