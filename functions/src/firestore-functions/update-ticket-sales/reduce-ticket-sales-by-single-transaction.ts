import { EventTickets } from '../../models/event-tickets';
import { getClubIncome } from '../../utils/get-club-income';

interface ReduceTicketSalesBySingleTransactionParams {
    tickets: EventTickets;
    amountToReduce: number;
    isVip: boolean;
}

export async function reduceTicketSalesBySingleTransaction({
    tickets,
    amountToReduce,
    isVip,
}: ReduceTicketSalesBySingleTransactionParams) {
    const ticketSales = tickets.ticketSales;

    ticketSales.ticketsSold--;

    if (isVip) {
        ticketSales.vipsSold--;
    }

    ticketSales.totalRevenue -= amountToReduce;
    ticketSales.clubIncome -= await getClubIncome(amountToReduce);
}
