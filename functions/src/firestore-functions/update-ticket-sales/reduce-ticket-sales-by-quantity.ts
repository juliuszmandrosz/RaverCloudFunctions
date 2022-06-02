import { TicketSales } from '../../models/ticket-sales';

interface ReduceTicketSalesByQuantityParams {
    currentTicketSales: TicketSales;
    ticketQuantityToReduce: number;
    clubIncomeToReduce: number;
    vipQuantityToReduce: number;
    totalRevenueToReduce: number;
}

export async function reduceTicketSalesByQuantity({
    currentTicketSales,
    ticketQuantityToReduce,
    clubIncomeToReduce,
    vipQuantityToReduce,
    totalRevenueToReduce,
}: ReduceTicketSalesByQuantityParams) {
    currentTicketSales.ticketsSold -= ticketQuantityToReduce;
    currentTicketSales.vipsSold -= vipQuantityToReduce;
    currentTicketSales.totalRevenue -= totalRevenueToReduce;
    currentTicketSales.clubIncome -= clubIncomeToReduce;
}
