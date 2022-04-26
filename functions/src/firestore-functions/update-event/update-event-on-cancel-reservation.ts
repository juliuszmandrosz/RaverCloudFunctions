import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventDataOrReturnNotFound, getEventDocRef } from '../get-data/get-event-data';
import * as functions from 'firebase-functions';
import { updateEventTicketsOnCancelReservation } from '../update-event-tickets/update-event-tickets-on-cancel-reservation';

/// Returns event before update or undefined
export async function updateEventOnCancelReservation(
    eventId: string,
    isVip: boolean,
    response: functions.Response
): Promise<Event | undefined> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventDocRef = getEventDocRef(eventId);

        const event = await getEventDataOrReturnNotFound(eventId, response, transaction);

        if (!event) return;

        const eventTickets = await updateEventTicketsOnCancelReservation(event, isVip, response);

        if (!eventTickets) return;

        const ticketPools = eventTickets.ticketPools;

        const currentPoolPrice = ticketPools.find((pool) => pool.isCurrent)!.ticketPrice;

        transaction.update(eventDocRef, {
            attending: event.attending - 1,
            price: currentPoolPrice,
        } as Event);

        return event;
    });
}
