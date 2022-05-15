import { Event } from '../../models/event';
import { tryGetEventPayoutTaskData } from '../../firestore-functions/get-data/get-event-payout-task-data';
import { cancelPayoutTask } from './cancel-payout-task';
import { createPayoutToPartnerTask } from './create-payout-to-partner-task';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

interface ExtendPayoutTaskInstantlyOnEventPostponeParams {
    event: Event;
    newEventEndDateTime: Timestamp;
}

export async function extendPayoutTaskInstantlyOnEventPostpone({
    event,
    newEventEndDateTime,
}: ExtendPayoutTaskInstantlyOnEventPostponeParams): Promise<void> {
    const eventPayoutTask = await tryGetEventPayoutTaskData(event.id);

    await cancelPayoutTask({ eventId: event.id, payoutTaskId: eventPayoutTask.payoutTaskId });

    await createPayoutToPartnerTask({ event, executesAt: newEventEndDateTime });
}
