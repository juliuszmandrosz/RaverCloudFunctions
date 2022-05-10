import * as functions from 'firebase-functions';
import { CancelEventCancelationRequest } from './cancel-event-cancelation-request';
import { stripe } from '../../modules/stripe-module';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getCancelEventPaymentSessionDataOrReturnNotFound,
    getCancelEventPaymentSessionDocRef,
} from '../get-data/get-cancel-event-payment-session';
import { CancelEventPaymentSession } from '../../models/cancel-event-payment-session';
import { events } from '../../constants/collections';
import { Event } from '../../models/event';

export async function cancelEventCancelation(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const cancelEventRequest = request.body as CancelEventCancelationRequest;

    const cancelEventPaymentSession = await firestoreDatabase().runTransaction(
        async (transaction) => {
            const sessionId = cancelEventRequest.cancelEventPaymentSessionId;

            const sessionDocRef = getCancelEventPaymentSessionDocRef(sessionId);

            const session = await getCancelEventPaymentSessionDataOrReturnNotFound(
                sessionId,
                response,
                transaction
            );

            if (!session) return;

            transaction.update(sessionDocRef, {
                status: 'canceled',
            } as CancelEventPaymentSession);

            return session;
        }
    );

    if (!cancelEventPaymentSession) return;

    await stripe.paymentIntents.cancel(cancelEventPaymentSession.id);

    await firestoreDatabase()
        .collection(events)
        .doc(cancelEventPaymentSession.eventId)
        .update({ isCanceled: false } as Event);

    response.send();
}
