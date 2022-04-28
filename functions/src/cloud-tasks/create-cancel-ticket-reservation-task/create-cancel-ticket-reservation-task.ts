import { CreateCancelTicketReservationTaskRequest } from './create-cancel-ticket-reservation-task-request';
import { CancelTicketReservationRequest } from '../../firestore-functions/cancel-ticket-reservation/cancel-ticket-reservation-request';
import { createCloudTask } from '../create-cloud-task';
import { cancelTicketReservationCallback } from '../../constants/cloud-tasks-callbacks';
import { cancelTicketReservationQueue } from '../../constants/cloud-queues';

export async function createCancelTicketReservationTask(
    request: CreateCancelTicketReservationTaskRequest
): Promise<string> {
    const payload: CancelTicketReservationRequest = {
        ticketPaymentSessionId: request.ticketPaymentSessionId,
    };

    return createCloudTask<CancelTicketReservationRequest>({
        payload,
        callbackName: cancelTicketReservationCallback,
        queueName: cancelTicketReservationQueue,
        executionTimeInSeconds: request.expirationTimeInSeconds,
    });
}
