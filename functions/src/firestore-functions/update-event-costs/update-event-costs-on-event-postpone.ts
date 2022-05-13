import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
    tryGetEventCostsData,
} from '../get-data/get-event-costs-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import * as functions from 'firebase-functions';

export interface UpdateEventCostsOnEventPostponeParams {
    eventId: string;
    clubId: string;
    response?: functions.Response;
}

export async function updateEventCostsOnEventPostpone(
    params: UpdateEventCostsOnEventPostponeParams
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

        eventCosts.eventPostponeBalance += eventCosts.paymentProcessorFeeBalance;
        eventCosts.paymentProcessorFeeBalance = 0;

        transaction.update(eventCostsDocRef, eventCosts);
    });
}
