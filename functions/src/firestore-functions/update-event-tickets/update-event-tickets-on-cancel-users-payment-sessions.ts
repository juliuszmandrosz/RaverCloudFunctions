import { Event } from '../../models/event';
import { EventTickets } from '../../models/event-tickets';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { reduceTicketSalesByQuantity } from '../update-ticket-sales/reduce-ticket-sales-by-quantity';
import { revertTicketQuantityFromPools } from '../update-ticket-pools/revert-ticket-quantity-from-pools';

interface UpdateEventTicketsOnCancelUsersPaymentSessionsParams {
    event: Event;
    canceledTicketSessionsQuantity: number;
    canceledVipSessionsQuantity: number;
    canceledFunds: number;
}

/// Return event tickets after update
export async function updateEventTicketsOnCancelUsersPaymentSessions({
    event,
    canceledTicketSessionsQuantity,
    canceledVipSessionsQuantity,
    canceledFunds,
}: UpdateEventTicketsOnCancelUsersPaymentSessionsParams): Promise<EventTickets> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await tryGetEventTicketsData(event.clubId, event.id, transaction);

        await reduceTicketSalesByQuantity({
            currentTicketSales: tickets.ticketSales,
            totalRevenueToReduce: canceledFunds,
            ticketQuantityToReduce: canceledTicketSessionsQuantity,
            vipQuantityToReduce: canceledVipSessionsQuantity,
        });

        await revertTicketQuantityFromPools(tickets, canceledTicketSessionsQuantity);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
