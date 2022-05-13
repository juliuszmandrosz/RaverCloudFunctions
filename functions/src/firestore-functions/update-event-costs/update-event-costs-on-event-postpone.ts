import { getEventCostsDocRef } from '../get-data/get-event-costs-data';
import { EventCosts } from '../../models/event-costs';

export interface UpdateEventCostsOnEventPostponeParams {
    eventId: string;
    clubId: string;
    currentEventCosts: EventCosts;
}

export async function updateEventCostsOnEventPostpone(
    params: UpdateEventCostsOnEventPostponeParams
): Promise<void> {
    const eventCostsDocRef = getEventCostsDocRef(params.clubId, params.eventId);

    const currentPaymentProcessorFeeBalance = params.currentEventCosts.paymentProcessorFeeBalance;

    await eventCostsDocRef.update({
        paymentProcessorFeeBalance: 0,
        eventPostponeBalance: currentPaymentProcessorFeeBalance,
    } as EventCosts);
}
