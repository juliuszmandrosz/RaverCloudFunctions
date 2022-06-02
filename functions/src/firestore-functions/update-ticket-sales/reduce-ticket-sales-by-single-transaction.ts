import { EventTickets } from '../../models/event-tickets';

interface ReduceTicketSalesBySingleTransactionParams {
    tickets: EventTickets;
    totalRevenueToReduce: number;
    clubIncomeToReduce: number;
    isVip: boolean;
}

export async function reduceTicketSalesBySingleTransaction({
    tickets,
    totalRevenueToReduce,
    clubIncomeToReduce,
    isVip,
}: ReduceTicketSalesBySingleTransactionParams) {
    const ticketSales = tickets.ticketSales;

    ticketSales.ticketsSold--;

    if (isVip) {
        ticketSales.vipsSold--;
    }

    ticketSales.totalRevenue -= totalRevenueToReduce;
    ticketSales.clubIncome -= clubIncomeToReduce;
}
