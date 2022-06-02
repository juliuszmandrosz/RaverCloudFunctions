import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
} from '../get-data/get-event-costs-data';
import * as functions from 'firebase-functions';

export interface UpdateEventCostsOnUserPaymentParams {
    eventId: string;
    clubId: string;
    amount: number;
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

        eventCosts.paymentProcessorFeeBalance += params.amount;

        transaction.update(eventCostsDocRef, eventCosts);
    });
}
