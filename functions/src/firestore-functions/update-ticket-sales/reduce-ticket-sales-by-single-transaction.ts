import { EventTickets } from '../../models/event-tickets';
import { getCurrentOrLastPool } from '../../utils/get-current-or-last-pool';
import { getTotalRevenue } from '../../utils/get-total-revenue';
import { getClubIncome } from '../../utils/get-club-income';

export async function reduceTicketSalesBySingleTransaction(
    tickets: EventTickets,
    eventPrice: number,
    isVip: boolean
) {
    const ticketSales = tickets.ticketSales;

    ticketSales.ticketsSold--;

    if (isVip) {
        ticketSales.vipsSold--;
    }

    const vipPrice = getCurrentOrLastPool(tickets.ticketPools).vipPrice;

    const totalRevenue = await getTotalRevenue({ eventPrice, isVip, vipPrice });
    ticketSales.totalRevenue -= totalRevenue;
    ticketSales.clubIncome -= await getClubIncome(totalRevenue);
}
