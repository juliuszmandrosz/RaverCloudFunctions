import * as functions from 'firebase-functions';
import { CancelEventPostponeRequest } from './cancel-event-postpone-request';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { events } from '../../constants/collections';
import { Event } from '../../models/event';
import { checkPartnerClaim } from '../../auth-functions/check-claim/check-partner-claim';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { tasksClient } from '../../modules/cloud-tasks-module';
import {
    getPostponeEventPaymentSessionDocRef,
    tryGetPostponeEventPaymentSessionData,
} from '../get-data/get-postpone-event-payment-session';
import { PostponeEventPaymentSession } from '../../models/postpone-event-payment-session';

export async function cancelEventPostponeOnClosingPaymentSheet(
    data: CancelEventPostponeRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    await checkPartnerClaim({ email: context.auth?.token.email! });

    const sessionId = data?.postponeEventPaymentSessionId;

    if (!sessionId) {
        const message = 'The function must be called with postpone event payment session id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const session = await tryGetPostponeEventPaymentSessionData(sessionId);

    const sessionDocRef = getPostponeEventPaymentSessionDocRef(sessionId);

    await tasksClient.deleteTask({ name: session.cancelEventPostponeTaskId });

    await sessionDocRef.update({
        status: 'canceled',
    } as PostponeEventPaymentSession);

    await firestoreDatabase()
        .collection(events)
        .doc(session.eventId)
        .update({ isCurrentlyPostponing: false } as Event);
}
