import { tasksClient } from '../../modules/cloud-tasks-module';
import {
    getPostponeEventPaymentSessionDataOrUndefined,
    getPostponeEventPaymentSessionDocRef,
} from '../get-data/get-postpone-event-payment-session';
import { createCancelEventPostponeTask } from '../../cloud-tasks/create-cancel-event-postpone-task/create-cancel-event-postpone-task';
import { PostponeEventPaymentSession } from '../../models/postpone-event-payment-session';

export async function extendEventPostponePaymentSession(paymentIntentId: string) {
    const postponeEventPaymentSession = await getPostponeEventPaymentSessionDataOrUndefined(
        paymentIntentId
    );

    if (!postponeEventPaymentSession) return;

    const postponeEventPaymentDocRef = getPostponeEventPaymentSessionDocRef(paymentIntentId);

    await tasksClient.deleteTask({
        name: postponeEventPaymentSession.cancelEventPostponeTaskId,
    });

    const cancelEventPostponeTaskId = await createCancelEventPostponeTask({
        postponeEventPaymentSessionId: postponeEventPaymentSession.id,
        expirationTimeInSeconds: 900,
    });

    await postponeEventPaymentDocRef.update({
        status: 'requires_action',
        cancelEventPostponeTaskId: cancelEventPostponeTaskId,
    } as PostponeEventPaymentSession);
}
