import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { checkPartnerClaim } from '../../auth-functions/check-claim/check-partner-claim';
import { Event } from '../../models/event';
import * as moment from 'moment';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { getEventDocRef, tryGetEventData } from '../../firestore-functions/get-data/get-event-data';
import { PostponeEventRequest } from './postpone-event-request';
import { cancelUsersPaymentSessions } from '../../firestore-functions/cancel-users-payment-sessions/cancel-users-payment-sessions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { updateEventOnEventPostpone } from '../../firestore-functions/update-event/update-event-on-event-postpone';
import { updateTicketsOnEventPostpone } from '../../firestore-functions/update-tickets/update-tickets-on-event-postpone';

export async function postponeEvent(
    data: PostponeEventRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const eventId = data?.eventId;
    const newEventStartTimestamp = data?.newEventStartTimestamp;
    const newEventEndTimestamp = data?.newEventEndTimestamp;

    await checkPartnerClaim({ email: context.auth?.token.email! });

    const event = await tryGetEventData(eventId);
    const eventStartDateTime = moment(event.eventStartDateTime);

    if (eventStartDateTime.isBefore(moment().add(1, 'day'))) {
        const message = 'Time to postpone event has expired';
        const details: FunctionsErrorDetails = 'postpone-time-expired';
        throw new functions.https.HttpsError('deadline-exceeded', message, details);
    }

    if (moment(newEventStartTimestamp).isBefore(eventStartDateTime.add(1, 'day'))) {
        const message = 'The minimum time by which an event can be postponed is 24 hours';
        const details: FunctionsErrorDetails = 'postpone-time-too-short';
        throw new functions.https.HttpsError('invalid-argument', message, details);
    }

    await cancelUsersPaymentSessions({ eventId });

    await getEventDocRef(eventId).update({ isBeingPostponed: true } as Event);

    await updateEventOnEventPostpone({
        event,
        newEventStartTimestamp,
        newEventEndTimestamp,
    });

    await updateTicketsOnEventPostpone({
        eventId: event.id,
        newEventStartDateTime: Timestamp.fromMillis(newEventStartTimestamp),
        newEventEndDateTime: Timestamp.fromMillis(newEventEndTimestamp),
    });
}

function checkIfRequestIsValid(request: PostponeEventRequest) {
    if (!request.eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.newEventStartTimestamp) {
        const message = 'The function must be called with new event start timestamp';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.newEventEndTimestamp) {
        const message = 'The function must be called with new event end timestamp';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
