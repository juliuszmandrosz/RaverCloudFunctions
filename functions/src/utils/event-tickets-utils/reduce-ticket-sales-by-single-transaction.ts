import { EventTickets } from '../../models/event-tickets';
import { getTotalRevenue } from './get-total-revenue';
import { getClubIncome } from './get-club-income';
import { getCurrentOrLastPool } from './get-current-or-last-pool';

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
