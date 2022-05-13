import { createCloudTask } from '../create-cloud-task';
import { cancelEventPostponeCallback } from '../../constants/cloud-tasks-callbacks';
import { cancelEventPostponeQueue } from '../../constants/cloud-queues';
import { CreateCancelEventPostponeTaskRequest } from './create-cancel-event-postpone-task-request';
import { CancelEventPostponeRequest } from '../../firestore-functions/cancel-event-postpone/cancel-event-postpone-request';

export async function createCancelEventPostponeTask(
    request: CreateCancelEventPostponeTaskRequest
): Promise<string> {
    const payload: CancelEventPostponeRequest = {
        postponeEventPaymentSessionId: request.postponeEventPaymentSessionId,
    };

    return createCloudTask<CancelEventPostponeRequest>({
        payload,
        callbackName: cancelEventPostponeCallback,
        queueName: cancelEventPostponeQueue,
        executionTimeInSeconds: request.expirationTimeInSeconds,
    });
}
