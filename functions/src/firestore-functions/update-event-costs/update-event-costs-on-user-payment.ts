import { EventCosts } from '../../models/event-costs';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
} from '../get-data/get-event-costs-data';
import { UpdateEventCostsRequest } from './update-event-costs-request';
import { getStripeFeeOrReturnNotFound } from '../../utils/stripe-utils/get-stripe-fee';

/// Returns events costs after update or undefined
export async function updateEventCostsOnUserPayment(
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

        const stripeFee = await getStripeFeeOrReturnNotFound({
            paymentSessionId: params.paymentSessionId,
            response: params.response,
        });

        if (!stripeFee) return;

        eventCosts.paymentProcessorFeeBalance += stripeFee;

        transaction.update(eventCostsDocRef, eventCosts);

        return eventCosts;
    });
}
