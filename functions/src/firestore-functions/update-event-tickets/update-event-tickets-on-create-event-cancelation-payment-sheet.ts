import { Event } from '../../models/event';
import { EventTickets } from '../../models/event-tickets';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { reduceTicketSalesByQuantity } from '../../utils/event-tickets-utils/reduce-ticket-sales-by-quantity';
import { revertTicketQuantityFromPools } from '../../utils/event-tickets-utils/revert-ticket-quantity-from-pools';

interface UpdateEventTicketsOnCreateEventCancelationPaymentSheetParams {
    event: Event;
    ticketsSold: number;
    vipsSold: number;
    totalRevenue: number;
}

/// Return event tickets after update
export async function updateEventTicketsOnCreateEventCancelationPaymentSheet({
    event,
    ticketsSold,
    vipsSold,
    totalRevenue,
}: UpdateEventTicketsOnCreateEventCancelationPaymentSheetParams): Promise<EventTickets> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await tryGetEventTicketsData(event.clubId, event.id, transaction);

        await reduceTicketSalesByQuantity({
            currentTicketSales: tickets.ticketSales,
            totalRevenueToReduce: totalRevenue,
            ticketQuantityToReduce: ticketsSold,
            vipQuantityToReduce: vipsSold,
        });

        await revertTicketQuantityFromPools(tickets, ticketsSold);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
