import { Event } from '../../models/event';
import { getEventDocRef } from '../get-data/get-event-data';
import { updateEventTicketsOnEventCancelation } from '../update-event-tickets/update-event-tickets-on-event-cancelation';
import { tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { reduceClubSalesByQuantity } from '../update-club-sales/reduce-club-sales-by-quantity';

interface UpdateEventOnEventCancelationParams {
    event: Event;
}

export async function updateEventOnEventCancelation({
    event,
}: UpdateEventOnEventCancelationParams): Promise<void> {
    const eventDocRef = getEventDocRef(event.id);

    const currentTicketSales = await tryGetEventTicketsData(event.clubId, event.id).then(
        (tickets) => tickets.ticketSales
    );

    await reduceClubSalesByQuantity({
        clubId: event.clubId,
        revenueToReduce: currentTicketSales.totalRevenue,
        vipQuantityToReduce: currentTicketSales.vipsSold,
        ticketQuantityToReduce: currentTicketSales.ticketsSold,
        isExclusiveEvent: currentTicketSales.isExclusiveEvent,
    });

    await updateEventTicketsOnEventCancelation(event);

    await eventDocRef.update({
        attending: 0,
    } as Event);
}
