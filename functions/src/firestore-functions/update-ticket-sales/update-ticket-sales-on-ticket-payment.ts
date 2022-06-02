import { EventTickets } from '../../models/event-tickets';

interface UpdateTicketSalesOnTicketPaymentParams {
    tickets: EventTickets;
    totalRevenue: number;
    clubIncome: number;
    isVip: boolean;
}

export function updateTicketSalesOnTicketPayment({
    tickets,
    totalRevenue,
    clubIncome,
    isVip,
}: UpdateTicketSalesOnTicketPaymentParams) {
    const ticketSales = tickets.ticketSales;

    ticketSales.ticketsSold++;

    if (isVip) {
        ticketSales.vipsSold++;
    }

    ticketSales.totalRevenue += totalRevenue;
    ticketSales.clubIncome += clubIncome;
}
