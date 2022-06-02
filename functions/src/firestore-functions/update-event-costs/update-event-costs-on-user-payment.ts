import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
} from '../get-data/get-event-costs-data';
import * as functions from 'firebase-functions';
import { getUserFee } from '../../utils/stripe-utils/get-user-fee';

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

        const userFee = await getUserFee(params.amount, eventCosts.currency);

        eventCosts.paymentProcessorFeeBalance += userFee;

        transaction.update(eventCostsDocRef, eventCosts);
    });
}
