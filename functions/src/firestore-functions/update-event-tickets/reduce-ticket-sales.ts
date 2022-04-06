import { EventTickets } from '../../models/event-tickets';
import { getTotalRevenue } from '../../utils/get-total-revenue';
import { getClubIncome } from '../../utils/get-club-income';

export async function reduceTicketSales(tickets: EventTickets, eventPrice: number, isVip: boolean) {
    const ticketSales = tickets.ticketSales;

    ticketSales.ticketsSold--;

    if (isVip) {
        ticketSales.vipsSold--;
    }

    const totalRevenue = await getTotalRevenue(eventPrice, isVip);
    ticketSales.totalRevenue -= totalRevenue;
    ticketSales.clubIncome -= await getClubIncome(totalRevenue);
}
