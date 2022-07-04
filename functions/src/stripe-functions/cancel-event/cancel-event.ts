import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { events } from '../../constants/collections';
import { CancelEventRequest } from './cancel-event-request';
import { Event } from '../../models/event';
import * as moment from 'moment';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { tryGetEventData } from '../../firestore-functions/get-data/get-event-data';
import { refundTicketsForUsers } from '../refund-tickets-for-users';
import { updateEventOnEventCancelation } from '../../firestore-functions/update-event/update-event-on-event-cancelation';
import { cancelUsersPaymentSessions } from '../../firestore-functions/cancel-users-payment-sessions/cancel-users-payment-sessions';
import { updateTicketsOnEventCancelation } from '../../firestore-functions/update-tickets/update-tickets-on-event-cancelation';
import { cancelUpdateClubSalesTask } from '../../cloud-tasks/update-club-sales-on-event-end-task/cancel-update-club-sales-task';
import { tryGetPartnerData } from '../../firestore-functions/get-data/get-partner-data';
import { toJson } from '../../utils/json-utils';

export async function cancelEvent(
    data: CancelEventRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const eventId = data?.eventId;

    const partner = await tryGetPartnerData(context.auth?.uid!);
    const event = await tryGetEventData(eventId);

    if (partner.clubId != event.clubId) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Partner does not have access to club'
        );
    }

    const eventStartDateTime = moment(event.eventStartDateTime);

    if (eventStartDateTime.isBefore(moment().add(3, 'hours'))) {
        const message = 'Time to cancel event has expired';
        const details: FunctionsErrorDetails = 'cancel-time-expired';
        throw new functions.https.HttpsError('deadline-exceeded', message, details);
    }

    await cancelUsersPaymentSessions({ eventId });

    await firestoreDatabase()
        .collection(events)
        .doc(eventId)
        .update(toJson<Event>({ isCanceled: true } as Event));

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
