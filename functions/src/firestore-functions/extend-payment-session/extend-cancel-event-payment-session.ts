import {
    getCancelEventPaymentSessionDataOrUndefined,
    getCancelEventPaymentSessionDocRef,
} from '../get-data/get-cancel-event-payment-session';
import { tasksClient } from '../../modules/cloud-tasks-module';
import { createCancelEventCancelationTask } from '../../cloud-tasks/create-cancel-event-cancelation-task/create-cancel-event-cancelation-task';
import { CancelEventPaymentSession } from '../../models/cancel-event-payment-session';

export async function extendCancelEventPaymentSession(paymentIntentId: string) {
    const cancelEventPaymentSession = await getCancelEventPaymentSessionDataOrUndefined(
        paymentIntentId
    );

    if (!cancelEventPaymentSession) return;

    const cancelEventPaymentDocRef = getCancelEventPaymentSessionDocRef(paymentIntentId);

    await tasksClient.deleteTask({
        name: cancelEventPaymentSession.cancelEventCancelationTaskId,
    });

    const cancelEventCancelationTaskId = await createCancelEventCancelationTask({
        cancelEventPaymentSessionId: cancelEventPaymentSession.id,
        expirationTimeInSeconds: 900,
    });

    await cancelEventPaymentDocRef.update({
        status: 'requires_action',
        cancelEventCancelationTaskId,
    } as CancelEventPaymentSession);
}
