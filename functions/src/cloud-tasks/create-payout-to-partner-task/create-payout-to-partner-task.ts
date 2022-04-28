import { createCloudTask } from '../create-cloud-task';
import { CreatePayoutToPartnerTaskRequest } from './create-payout-to-partner-task-request';
import { PayOutToPartnerRequest } from '../../stripe-functions/pay-out-to-partner/pay-out-to-partner-request';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { payOutToPartnerQueue } from '../../constants/cloud-queues';
import { payOutToPartnerCallback } from '../../constants/cloud-tasks-callbacks';

export async function createPayoutToPartnerTask(
    request: CreatePayoutToPartnerTaskRequest
): Promise<string> {
    const payload: PayOutToPartnerRequest = { event: request.event };

    return createCloudTask<PayOutToPartnerRequest>({
        payload,
        callbackName: payOutToPartnerCallback,
        queueName: payOutToPartnerQueue,
        executesAt: Timestamp.fromMillis(request.event.eventEndDateTime),
    });
}
