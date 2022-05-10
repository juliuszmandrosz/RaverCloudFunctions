import { tasksClient } from '../modules/cloud-tasks-module';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { cancelEventPaymentSessions } from '../constants/collections';
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { getEventDataOrReturnNotFound } from './get-data/get-event-data';
import { getCancelEventPaymentSessionDataOrUndefined } from './get-data/get-cancel-event-payment-session';
import { CancelEventPaymentSession } from '../models/cancel-event-payment-session';
import { updateEventCostsOnEventCancelation } from './update-event-costs/update-event-costs-on-event-cancelation';

export async function fulfillEventCancelationPayment(
    paymentSessionId: string,
    response: functions.Response
): Promise<void> {
    const cancelEventPaymentSession = await getCancelEventPaymentSessionDataOrUndefined(
        paymentSessionId
    );

    if (!cancelEventPaymentSession) return;

    await tasksClient.deleteTask({ name: cancelEventPaymentSession.cancelEventCancelationTaskId });

    const event = await getEventDataOrReturnNotFound(cancelEventPaymentSession.eventId, response);

    if (!event) return;

    await firestoreDatabase()
        .collection(cancelEventPaymentSessions)
        .doc(cancelEventPaymentSession.id)
        .update({
            status: 'succeeded',
            paymentDateTime: Timestamp.now(),
        } as CancelEventPaymentSession);

    await updateEventCostsOnEventCancelation({
        paymentSessionId: cancelEventPaymentSession.id,
        eventId: event.id,
        clubId: event.clubId,
        response,
    });

    // TODO - return tickets for users
}
