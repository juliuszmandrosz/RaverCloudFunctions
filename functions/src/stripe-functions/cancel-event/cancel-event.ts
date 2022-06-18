import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { events } from '../../constants/collections';
import { CancelEventRequest } from './cancel-event-request';
import { checkPartnerClaim } from '../../auth-functions/check-claim/check-partner-claim';
import { Event } from '../../models/event';
import * as moment from 'moment';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { tryGetEventData } from '../../firestore-functions/get-data/get-event-data';
import { refundTicketsForUsers } from '../refund-tickets-for-users';
import { updateEventOnEventCancelation } from '../../firestore-functions/update-event/update-event-on-event-cancelation';
import { cancelUsersPaymentSessions } from '../../firestore-functions/cancel-users-payment-sessions/cancel-users-payment-sessions';
import { updateTicketsOnEventCancelation } from '../../firestore-functions/update-tickets/update-tickets-on-event-cancelation';
import { cancelUpdateClubSalesTask } from '../../cloud-tasks/update-club-sales-on-event-end-task/cancel-update-club-sales-task';

export async function cancelEvent(
    data: CancelEventRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const eventId = data?.eventId;

    await checkPartnerClaim({ email: context.auth?.token.email! });

    const event = await tryGetEventData(eventId);
    const eventStartDateTime = moment(event.eventStartDateTime);

    if (eventStartDateTime.isBefore(moment().add(1, 'day'))) {
        const message = 'Time to cancel event has expired';
        const details: FunctionsErrorDetails = 'cancel-time-expired';
        throw new functions.https.HttpsError('deadline-exceeded', message, details);
    }

    await cancelUsersPaymentSessions({ eventId });

    await firestoreDatabase()
        .collection(events)
        .doc(eventId)
        .update({ isCanceled: true } as Event);

    const refundedSessions = await refundTicketsForUsers(event.id);
    await updateTicketsOnEventCancelation(refundedSessions.ticketSessions);
    await updateEventOnEventCancelation({ event });
    await cancelUpdateClubSalesTask(eventId);
}

function checkIfRequestIsValid(request: CancelEventRequest) {
    if (!request.eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
