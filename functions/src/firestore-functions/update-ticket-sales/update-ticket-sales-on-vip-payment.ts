import { EventTickets } from '../../models/event-tickets';

interface UpdateTicketSalesOnVipPaymentParams {
    tickets: EventTickets;
    vipPrice: number;
    clubIncome: number;
}

export async function updateTicketSalesOnVipPayment({
    tickets,
    vipPrice,
    clubIncome,
}: UpdateTicketSalesOnVipPaymentParams) {
    const ticketSales = tickets.ticketSales;

    ticketSales.vipsSold++;
    ticketSales.totalRevenue += vipPrice;
    ticketSales.clubIncome += clubIncome;
}
