import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { getEventTicketsDocRef } from '../get-data/get-event-tickets-data';
import { TicketSales } from '../../models/ticket-sales';

export async function updateEventTicketsOnEventCancelation(event: Event): Promise<void> {
    const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);

    await eventTicketsDocRef.update({
        ticketSales: resetTicketSales(event.currency),
    } as EventTickets);
}

function resetTicketSales(currency: string) {
    return {
        ticketsSold: 0,
        vipsSold: 0,
        clubIncome: 0,
        totalRevenue: 0,
        currency,
    } as TicketSales;
}
