import { EventCosts } from '../../models/event-costs';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
} from '../get-data/get-event-costs-data';
import { UpdateEventCostsRequest } from './update-event-costs-request';

/// Returns events costs after update or undefined
export async function updateEventCostsOnEventCancelation(
    params: UpdateEventCostsRequest
): Promise<EventCosts | undefined> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventCostsDocRef = getEventCostsDocRef(params.clubId, params.eventId);
        const eventCosts = await getEventCostsOrReturnNotFound(
            params.clubId,
            params.eventId,
            params.response,
            transaction
        );

        if (!eventCosts) return;

        eventCosts.paymentProcessorFeeBalance = 0;

        transaction.update(eventCostsDocRef, eventCosts);

        return eventCosts;
    });
}
