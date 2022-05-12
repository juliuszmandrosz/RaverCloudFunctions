import { getEventCostsDocRef } from '../get-data/get-event-costs-data';
import { EventCosts } from '../../models/event-costs';

export interface UpdateEventCostsOnEventCancelationParams {
    eventId: string;
    clubId: string;
}

export async function updateEventCostsOnEventCancelation(
    params: UpdateEventCostsOnEventCancelationParams
): Promise<void> {
    const eventCostsDocRef = getEventCostsDocRef(params.clubId, params.eventId);

    await eventCostsDocRef.update({ paymentProcessorFeeBalance: 0 } as EventCosts);
}
