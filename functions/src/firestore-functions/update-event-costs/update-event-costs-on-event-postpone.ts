import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
    tryGetEventCostsData,
} from '../get-data/get-event-costs-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import * as functions from 'firebase-functions';
import { EventCosts } from '../../models/event-costs';
import { toJson } from '../../utils/json-utils';

export interface UpdateEventCostsOnEventPostpone {
    eventId: string;
    clubId: string;
    response?: functions.Response;
}

export async function updateEventCostsOnEventPostpone(
    params: UpdateEventCostsOnEventPostpone
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

        transaction.update(eventCostsDocRef, toJson<EventCosts>(getUpdatedEventCosts(eventCosts)));
    });
}

function getUpdatedEventCosts(eventCosts: EventCosts) {
    let feeBalance = eventCosts.paymentProcessorFeeBalance;
    let postponeBalance = eventCosts.eventPostponeBalance;

    postponeBalance += feeBalance;
    feeBalance = 0;

    return {
        eventPostponeBalance: postponeBalance,
        paymentProcessorFeeBalance: feeBalance,
        currency: eventCosts.currency,
    } as EventCosts;
}
