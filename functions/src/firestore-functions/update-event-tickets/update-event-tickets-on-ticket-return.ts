import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { reduceTicketSalesBySingleTransaction } from '../update-ticket-sales/reduce-ticket-sales-by-single-transaction';
import { revertSingleTicketFromPools } from '../update-ticket-pools/revert-single-ticket-from-pools';

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
