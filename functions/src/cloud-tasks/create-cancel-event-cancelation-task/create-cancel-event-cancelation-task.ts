import { CreateCancelEventCancelationTaskRequest } from './create-cancel-event-cancelation-task-request';
import { createCloudTask } from '../create-cloud-task';
import { CancelEventCancelationRequest } from '../../firestore-functions/cancel-event-cancelation/cancel-event-cancelation-request';
import { cancelEventCancelationCallback } from '../../constants/cloud-tasks-callbacks';
import { cancelEventCancelationQueue } from '../../constants/cloud-queues';

export async function createCancelEventCancelationTask(
    request: CreateCancelEventCancelationTaskRequest
): Promise<string> {
    const payload: CancelEventCancelationRequest = {
        cancelEventPaymentSessionId: request.cancelEventPaymentSessionId,
    };

    return createCloudTask<CancelEventCancelationRequest>({
        payload,
        callbackName: cancelEventCancelationCallback,
        queueName: cancelEventCancelationQueue,
        executionTimeInSeconds: request.expirationTimeInSeconds,
    });
}
