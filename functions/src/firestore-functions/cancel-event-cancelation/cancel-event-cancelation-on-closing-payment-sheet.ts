import * as functions from 'firebase-functions';
import { CancelEventCancelationRequest } from './cancel-event-cancelation-request';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getCancelEventPaymentSessionDocRef,
    tryGetCancelEventPaymentSessionData,
} from '../get-data/get-cancel-event-payment-session';
import { CancelEventPaymentSession } from '../../models/cancel-event-payment-session';
import { events } from '../../constants/collections';
import { Event } from '../../models/event';
import { checkPartnerClaim } from '../../auth-functions/check-claim/check-partner-claim';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { tasksClient } from '../../modules/cloud-tasks-module';

export async function cancelEventCancelationOnClosingPaymentSheet(
    data: CancelEventCancelationRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    await checkPartnerClaim({ email: context.auth?.token.email! });

    const sessionId = data?.cancelEventPaymentSessionId;

    if (!sessionId) {
        const message = 'The function must be called with cancel event payment session id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const session = await tryGetCancelEventPaymentSessionData(sessionId);

    const sessionDocRef = getCancelEventPaymentSessionDocRef(sessionId);

    await tasksClient.deleteTask({ name: session.cancelEventCancelationTaskId });

    await sessionDocRef.update({
        status: 'canceled',
    } as CancelEventPaymentSession);

    await firestoreDatabase()
        .collection(events)
        .doc(session.eventId)
        .update({ isCanceled: false } as Event);
}
