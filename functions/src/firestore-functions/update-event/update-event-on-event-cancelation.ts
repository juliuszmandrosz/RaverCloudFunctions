import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventDataOrReturnNotFound, getEventDocRef } from '../get-data/get-event-data';
import { updateEventTicketsOnEventCancelation } from '../update-event-tickets/update-event-tickets-on-event-cancelation';
import * as functions from 'firebase-functions';

export async function updateEventOnEventCancelation(
    eventId: string,
    response: functions.Response
): Promise<void> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventDocRef = getEventDocRef(eventId);

        const event = await getEventDataOrReturnNotFound(eventId, response, transaction);

        if (!event) return;

        await updateEventTicketsOnEventCancelation(event, response);

        transaction.update(eventDocRef, {
            attending: 0,
        } as Event);
    });
}
