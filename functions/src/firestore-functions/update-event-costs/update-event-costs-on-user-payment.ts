import { EventCosts } from '../../models/event-costs';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
} from '../get-data/get-event-costs-data';
import { getStripeFeeOrReturnNotFound } from '../../utils/stripe-utils/get-stripe-fee';
import * as functions from 'firebase-functions';

export interface UpdateEventCostsOnUserPaymentParams {
    eventId: string;
    clubId: string;
    paymentSessionId: string;
    response: functions.Response;
}

/// Returns events costs after update or undefined
export async function updateEventCostsOnUserPayment(
    params: UpdateEventCostsOnUserPaymentParams
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
