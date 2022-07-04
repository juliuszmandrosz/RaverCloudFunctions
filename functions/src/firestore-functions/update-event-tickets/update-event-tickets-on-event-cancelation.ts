import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { TicketSales } from '../../models/ticket-sales';
import { toJson } from '../../utils/json-utils';

export async function updateEventTicketsOnEventCancelation(event: Event): Promise<void> {
    const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);

    const eventTickets = await tryGetEventTicketsData(event.clubId, event.id);

    const currentTicketSales = eventTickets.ticketSales;

    await eventTicketsDocRef.update(
        toJson<EventTickets>({
            ticketSales: resetTicketSales(currentTicketSales),
        } as EventTickets)
    );
}

function resetTicketSales(ticketSales: TicketSales) {
    return {
        ticketsSold: 0,
        vipsSold: 0,
        clubIncome: 0,
        totalRevenue: 0,
        currency: ticketSales.currency,
        isExclusiveEvent: ticketSales.isExclusiveEvent,
        eventFee: ticketSales.eventFee,
    } as TicketSales;
}
