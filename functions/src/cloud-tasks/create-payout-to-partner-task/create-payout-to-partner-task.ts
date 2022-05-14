import { createCloudTask } from '../create-cloud-task';
import { CreatePayoutToPartnerTaskRequest } from './create-payout-to-partner-task-request';
import { PayOutToPartnerOnEventEndRequest } from '../../stripe-functions/pay-out-to-partner-on-event-end/pay-out-to-partner-on-event-end-request';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { payOutToPartnerQueue } from '../../constants/cloud-queues';
import { payOutToPartnerOnEventEndCallback } from '../../constants/cloud-tasks-callbacks';

export async function createPayoutToPartnerTask(
    request: CreatePayoutToPartnerTaskRequest
): Promise<string> {
    const payload: PayOutToPartnerOnEventEndRequest = { event: request.event };

    return createCloudTask<PayOutToPartnerOnEventEndRequest>({
        payload,
        callbackName: payOutToPartnerOnEventEndCallback,
        queueName: payOutToPartnerQueue,
        executesAt: Timestamp.fromMillis(request.event.eventEndDateTime),
    });
}
