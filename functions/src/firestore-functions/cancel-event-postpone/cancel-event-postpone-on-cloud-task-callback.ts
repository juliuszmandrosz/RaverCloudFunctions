import * as functions from 'firebase-functions';
import { CancelEventPostponeRequest } from './cancel-event-postpone-request';
import { stripe } from '../../modules/stripe-module';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { events } from '../../constants/collections';
import { Event } from '../../models/event';
import {
    getPostponeEventPaymentSessionDataOrReturnNotFound,
    getPostponeEventPaymentSessionDocRef,
} from '../get-data/get-postpone-event-payment-session';
import { PostponeEventPaymentSession } from '../../models/postpone-event-payment-session';

export async function cancelEventPostponeOnCloudTaskCallback(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const cancelEvent = request.body as CancelEventPostponeRequest;

    const sessionId = cancelEvent.postponeEventPaymentSessionId;

    const sessionDocRef = getPostponeEventPaymentSessionDocRef(sessionId);

    const session = await getPostponeEventPaymentSessionDataOrReturnNotFound(sessionId, response);

    if (!session) return;

    await sessionDocRef.update({
        status: 'canceled',
    } as PostponeEventPaymentSession);

    await stripe.paymentIntents.cancel(session.id);

    await firestoreDatabase()
        .collection(events)
        .doc(session.eventId)
        .update({ isCurrentlyPostponing: false } as Event);

    response.send();
}
