import { protos } from '@google-cloud/tasks';
import {
    functionsEndpoint,
    functionsLocation,
    projectId,
} from '../../constants/platform-constants';
import { ticketReservationQueue } from '../../constants/cloud-queues';
import { CreateCancelTicketReservationTaskRequest } from './create-cancel-ticket-reservation-task-request';
import { tasksClient } from '../../modules/cloud-tasks-module';
import { CancelTicketReservationRequest } from '../../firestore-functions/cancel-ticket-reservation/cancel-ticket-reservation-request';

export async function createCancelTicketReservationTask(
    request: CreateCancelTicketReservationTaskRequest
): Promise<string> {
    const queuePath = tasksClient.queuePath(projectId, functionsLocation, ticketReservationQueue);
    const url = `${functionsEndpoint}cancelTicketReservation`;

    const scheduleTime = getScheduleTime(request.expirationTimeInSeconds);

    const task = getTaskBody(url, scheduleTime, request.ticketPaymentSessionId);

    const [response] = await tasksClient.createTask({ parent: queuePath, task });

    return response.name!;
}

function getTaskBody(url: string, scheduleTime: number, ticketPaymentSessionId: string) {
    return {
        httpRequest: {
            httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
            url,
            body: getRequestBody(ticketPaymentSessionId),
            headers: {
                'Content-Type': 'application/json',
            },
        },
        scheduleTime: {
            seconds: scheduleTime,
        },
    };
}

function getRequestBody(ticketPaymentSessionId: string) {
    const payload: CancelTicketReservationRequest = { ticketPaymentSessionId };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function getScheduleTime(expirationTimeInSeconds: number) {
    return Date.now() / 1000 + expirationTimeInSeconds;
}
