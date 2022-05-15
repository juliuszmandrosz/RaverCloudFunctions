import { createCloudTask } from '../create-cloud-task';
import { PayOutToPartnerRequest } from '../../stripe-functions/pay-out-to-partner/pay-out-to-partner-request';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { payOutToPartnerQueue } from '../../constants/cloud-queues';
import { payOutToPartnerOnEventEndCallback } from '../../constants/cloud-tasks-callbacks';
import { getEventPayoutTaskDocRef } from '../../firestore-functions/get-data/get-event-payout-task-data';
import { EventPayoutTask } from '../../models/event-payout-task';
import { Event } from '../../models/event';

export interface CreatePayoutToPartnerTaskParams {
    event: Event;
    /// If not provided, event end date time will be used
    executesAt?: Timestamp;
}

export async function createPayoutToPartnerTask({
    event,
    executesAt,
}: CreatePayoutToPartnerTaskParams): Promise<string> {
    const payload: PayOutToPartnerRequest = { event };

    const executionDateTime = executesAt ?? Timestamp.fromMillis(event.eventEndDateTime);

    const payoutTaskId = await createCloudTask<PayOutToPartnerRequest>({
        payload,
        executesAt: executionDateTime,
        callbackName: payOutToPartnerOnEventEndCallback,
        queueName: payOutToPartnerQueue,
    });

    await getEventPayoutTaskDocRef(event.id).set({
        payoutTaskId,
        executesAt: executionDateTime,
        isCompleted: false,
    } as EventPayoutTask);

    return payoutTaskId;
}
