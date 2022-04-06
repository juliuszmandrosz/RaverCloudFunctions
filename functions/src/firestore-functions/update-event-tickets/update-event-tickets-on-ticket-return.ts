import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { reduceTicketSales } from './reduce-ticket-sales';
import { revertTicketPools } from './revert-ticket-pools';

/// Return event tickets after update
export async function updateEventTicketsOnTicketReturn(
    event: Event,
    isVip: boolean
): Promise<EventTickets> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await tryGetEventTicketsData(event.clubId, event.id, transaction);

        await reduceTicketSales(tickets, event.price, isVip);

        await revertTicketPools(tickets);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
