import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventTicketsDocRef,
    getEventTicketsOrReturnNotFound,
} from '../get-data/get-event-tickets-data';
import * as functions from 'firebase-functions';
import { reduceTicketSales } from './reduce-ticket-sales';
import { revertTicketPools } from './revert-ticket-pools';

/// Return event tickets after update or undefined
export async function updateEventTicketsOnCancelReservation(
    event: Event,
    isVip: boolean,
    response: functions.Response
): Promise<EventTickets | undefined> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await getEventTicketsOrReturnNotFound(
            event.clubId,
            event.id,
            response,
            transaction
        );

        if (!tickets) return;

        await reduceTicketSales(tickets, event.price, isVip);

        await revertTicketPools(tickets);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
