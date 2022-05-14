import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
    tryGetEventCostsData,
} from '../get-data/get-event-costs-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import * as functions from 'firebase-functions';
import { EventCosts } from '../../models/event-costs';

export interface UpdateEventCostsOnPartnerPaymentParams {
    eventId: string;
    clubId: string;
    response?: functions.Response;
}

export async function updateEventCostsOnPartnerPayment(
    params: UpdateEventCostsOnPartnerPaymentParams
): Promise<void> {
    await firestoreDatabase().runTransaction(async (transaction) => {
        const eventCostsDocRef = getEventCostsDocRef(params.clubId, params.eventId);

        const eventCosts = params.response
            ? await getEventCostsOrReturnNotFound(
                  params.clubId,
                  params.eventId,
                  params.response,
                  transaction
              )
            : await tryGetEventCostsData(params.clubId, params.eventId);

        if (!eventCosts) return;

        transaction.update(eventCostsDocRef, getUpdatedEventCosts(eventCosts));
    });
}

function getUpdatedEventCosts(eventCosts: EventCosts) {
    let feeBalance = eventCosts.paymentProcessorFeeBalance;
    let postponeBalance = eventCosts.eventPostponeBalance;

    if (feeBalance > postponeBalance) {
        feeBalance -= postponeBalance;
        postponeBalance = feeBalance;
        feeBalance = 0;
    } else if (feeBalance < postponeBalance) {
        postponeBalance -= feeBalance;
        feeBalance = 0;
    } else if (feeBalance === postponeBalance) {
        feeBalance = 0;
        postponeBalance = 0;
    }

    return {
        eventPostponeBalance: postponeBalance,
        paymentProcessorFeeBalance: feeBalance,
        currency: eventCosts.currency,
    } as EventCosts;
}
