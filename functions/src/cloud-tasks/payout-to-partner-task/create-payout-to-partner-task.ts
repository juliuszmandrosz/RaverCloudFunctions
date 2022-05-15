import { createCloudTask } from '../create-cloud-task';
import { CreatePayoutToPartnerTaskRequest } from './create-payout-to-partner-task-request';
import { PayOutToPartnerRequest } from '../../stripe-functions/pay-out-to-partner/pay-out-to-partner-request';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { payOutToPartnerQueue } from '../../constants/cloud-queues';
import { payOutToPartnerOnEventEndCallback } from '../../constants/cloud-tasks-callbacks';
import { getEventPayoutTaskDocRef } from '../../firestore-functions/get-data/get-event-payout-task-data';
import { EventPayoutTask } from '../../models/event-payout-task';

export async function createPayoutToPartnerTask(
    request: CreatePayoutToPartnerTaskRequest
): Promise<string> {
    const event = request.event;
    const payload: PayOutToPartnerRequest = { event };

    const executesAt = request.executesAt ?? Timestamp.fromMillis(request.event.eventEndDateTime);

    const payoutTaskId = await createCloudTask<PayOutToPartnerRequest>({
        payload,
        executesAt,
        callbackName: payOutToPartnerOnEventEndCallback,
        queueName: payOutToPartnerQueue,
    });

    await getEventPayoutTaskDocRef(event.id).set({
        payoutTaskId,
        executesAt,
        isCompleted: false,
    } as EventPayoutTask);

    return payoutTaskId;
}
