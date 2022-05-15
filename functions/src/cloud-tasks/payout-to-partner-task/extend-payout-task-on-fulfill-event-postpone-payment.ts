import { Event } from '../../models/event';
import { getEventPayoutTaskDataOrReturnNotFound } from '../../firestore-functions/get-data/get-event-payout-task-data';
import { cancelPayoutTask } from './cancel-payout-task';
import { createPayoutToPartnerTask } from './create-payout-to-partner-task';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import * as functions from 'firebase-functions';

interface ExtendPayoutTaskOnFulfillEventPostponePaymentParams {
    event: Event;
    newEventEndDateTime: Timestamp;
    response: functions.Response;
}

export async function extendPayoutTaskOnFulfillEventPostponePayment({
    event,
    newEventEndDateTime,
    response,
}: ExtendPayoutTaskOnFulfillEventPostponePaymentParams): Promise<void> {
    const eventPayoutTask = await getEventPayoutTaskDataOrReturnNotFound(event.id, response);

    if (!eventPayoutTask) return;

    await cancelPayoutTask({ eventId: event.id, payoutTaskId: eventPayoutTask.payoutTaskId });

    await createPayoutToPartnerTask({ event, executesAt: newEventEndDateTime });
}
