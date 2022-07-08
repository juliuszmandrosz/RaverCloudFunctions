import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventDataOrReturnNotFound,
    getEventDocRef,
    tryGetEventData,
} from '../get-data/get-event-data';
import * as functions from 'firebase-functions';
import { updateEventTicketsOnCancelReservation } from '../update-event-tickets/update-event-tickets-on-cancel-reservation';
import { toJson } from '../../utils/json-utils';

interface UpdateEventOnCancelReservationParams {
    eventId: string;
    isVip: boolean;
    canceledAmount: number;
    response?: functions.Response;
}

/// Returns event before update or undefined
export async function updateEventOnCancelReservation({
    eventId,
    isVip,
    canceledAmount,
    response,
}: UpdateEventOnCancelReservationParams): Promise<Event | undefined> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventDocRef = getEventDocRef(eventId);

        const event = response
            ? await getEventDataOrReturnNotFound(eventId, response, transaction)
            : await tryGetEventData(eventId, transaction);

        if (!event) return;

        const eventTickets = await updateEventTicketsOnCancelReservation({
            event,
            isVip,
            response,
            canceledAmount,
        });

        if (!eventTickets) return;

        const ticketPools = eventTickets.ticketPools;

        const currentPoolPrice = ticketPools.find((pool) => pool.isCurrent)!.ticketPrice;

        transaction.update(
            eventDocRef,
            toJson({
                attending: event.attending - 1,
                price: currentPoolPrice,
            } as Event)
        );

        return event;
    });
}
