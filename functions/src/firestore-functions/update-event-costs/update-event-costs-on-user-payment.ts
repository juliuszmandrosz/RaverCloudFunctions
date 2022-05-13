import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
} from '../get-data/get-event-costs-data';
import * as functions from 'firebase-functions';
import { getStripeFeeOrReturnNotFound } from '../../utils/stripe-utils/get-stripe-fee';

export interface UpdateEventCostsOnUserPaymentParams {
    eventId: string;
    clubId: string;
    paymentSessionId: string;
    response: functions.Response;
}

export async function updateEventCostsOnUserPayment(
    params: UpdateEventCostsOnUserPaymentParams
): Promise<void> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventCostsDocRef = getEventCostsDocRef(params.clubId, params.eventId);
        const eventCosts = await getEventCostsOrReturnNotFound(
            params.clubId,
            params.eventId,
            params.response,
            transaction
        );

        if (!eventCosts) return;

        const stripeFee = await getStripeFeeOrReturnNotFound(
            params.paymentSessionId,
            params.response
        );

        if (!stripeFee) return;

        eventCosts.paymentProcessorFeeBalance += stripeFee;

        transaction.update(eventCostsDocRef, eventCosts);
    });
}
