import {
    getEventCostsDocRef,
    getEventCostsOrReturnNotFound,
    tryGetEventCostsData,
} from '../get-data/get-event-costs-data';
import * as functions from 'firebase-functions';

export interface UpdateEventCostsOnEventCancelationParams {
    eventId: string;
    clubId: string;
    response?: functions.Response;
}

export async function updateEventCostsOnEventCancelation(
    params: UpdateEventCostsOnEventCancelationParams
): Promise<void> {
    const eventCostsDocRef = getEventCostsDocRef(params.clubId, params.eventId);

    const eventCosts = params.response
        ? await getEventCostsOrReturnNotFound(params.clubId, params.eventId, params.response)
        : await tryGetEventCostsData(params.clubId, params.eventId);

    if (!eventCosts) return;

    eventCosts.paymentProcessorFeeBalance = 0;

    await eventCostsDocRef.update(eventCosts);
}
