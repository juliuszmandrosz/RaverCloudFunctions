import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventTicketsDocRef,
    getEventTicketsOrReturnNotFound,
    tryGetEventTicketsData,
} from '../get-data/get-event-tickets-data';
import * as functions from 'firebase-functions';
import { reduceTicketSalesBySingleTransaction } from '../update-ticket-sales/reduce-ticket-sales-by-single-transaction';
import { revertSingleTicketFromPools } from '../update-ticket-pools/revert-single-ticket-from-pools';

interface UpdateEventTicketsOnCancelReservationParams {
    event: Event;
    isVip: boolean;
    response?: functions.Response;
}

/// Return event tickets after update or undefined
export async function updateEventTicketsOnCancelReservation({
    event,
    isVip,
    response,
}: UpdateEventTicketsOnCancelReservationParams): Promise<EventTickets | undefined> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);

        const tickets = response
            ? await getEventTicketsOrReturnNotFound(event.clubId, event.id, response, transaction)
            : await tryGetEventTicketsData(event.clubId, event.id, transaction);

        if (!tickets) return;

        await revertSingleTicketFromPools(tickets);

        await reduceTicketSalesBySingleTransaction(tickets, event.price, isVip);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
