import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { revertSingleTicketFromPools } from '../../utils/event-tickets-utils/revert-single-ticket-from-pools';
import { reduceTicketSalesBySingleTransaction } from '../../utils/event-tickets-utils/reduce-ticket-sales-by-single-transaction';

/// Return event tickets after update
export async function updateEventTicketsOnTicketReturn(
    event: Event,
    isVip: boolean
): Promise<EventTickets> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await tryGetEventTicketsData(event.clubId, event.id, transaction);

        await revertSingleTicketFromPools(tickets);

        await reduceTicketSalesBySingleTransaction(tickets, event.price, isVip);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
