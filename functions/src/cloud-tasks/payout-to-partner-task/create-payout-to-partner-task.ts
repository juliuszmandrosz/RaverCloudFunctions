import { createCloudTask } from '../create-cloud-task';
import { PayOutToPartnerRequest } from '../../stripe-functions/pay-out-to-partner/pay-out-to-partner-request';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { payOutToPartnerQueue } from '../../constants/cloud-queues';
import { payOutToPartnerOnCloudTaskCallback } from '../../constants/cloud-tasks-callbacks';
import { getEventPayoutTaskDocRef } from '../../firestore-functions/get-data/get-event-payout-task-data';
import { EventPayoutTask } from '../../models/event-payout-task';
import * as moment from 'moment';

export interface CreatePayoutToPartnerTaskParams {
    eventId: string;
    executesAt: Timestamp;
}

export async function createPayoutToPartnerTask({
    eventId,
    executesAt,
}: CreatePayoutToPartnerTaskParams): Promise<string> {
    const payload: PayOutToPartnerRequest = { eventId };

    const executionMoment = moment(executesAt.toMillis());

    const maxScheduleDate = moment().add(20, 'days').toDate();

    if (executionMoment.isAfter(maxScheduleDate)) {
        executesAt = Timestamp.fromDate(maxScheduleDate);
    }

    const payoutTaskId = await createCloudTask<PayOutToPartnerRequest>({
        payload,
        executesAt: executesAt,
        callbackName: payOutToPartnerOnCloudTaskCallback,
        queueName: payOutToPartnerQueue,
    });

    await getEventPayoutTaskDocRef(eventId).set({
        payoutTaskId,
        executesAt: executesAt,
    } as EventPayoutTask);

    return payoutTaskId;
}
