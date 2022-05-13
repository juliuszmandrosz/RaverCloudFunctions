import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { CreatePaymentSheetForPartnerResponse } from '../create-payment-sheet-for-partner/create-payment-sheet-for-partner-response';
import { checkPartnerClaim } from '../../auth-functions/check-claim/check-partner-claim';
import { tryGetEventCostsData } from '../../firestore-functions/get-data/get-event-costs-data';
import { Event } from '../../models/event';
import { createPaymentSheetForPartner } from '../create-payment-sheet-for-partner/create-payment-sheet-for-partner';
import * as moment from 'moment';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { getEventDocRef, tryGetEventData } from '../../firestore-functions/get-data/get-event-data';
import { Stripe } from 'stripe';
import { CreatePostponeEventPaymentSheetRequest } from './create-postpone-event-payment-sheet-request';
import { updateEventCostsOnEventPostpone } from '../../firestore-functions/update-event-costs/update-event-costs-on-event-postpone';
import { PostponeEventPaymentSession } from '../../models/postpone-event-payment-session';
import { createCancelEventPostponeTask } from '../../cloud-tasks/create-cancel-event-postpone-task/create-cancel-event-postpone-task';
import { cancelUsersPaymentSessions } from '../../firestore-functions/cancel-users-payment-sessions/cancel-users-payment-sessions';
import { getPostponeEventPaymentSessionDocRef } from '../../firestore-functions/get-data/get-postpone-event-payment-session';

export async function createPostponeEventPaymentSheet(
    data: CreatePostponeEventPaymentSheetRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForPartnerResponse | undefined> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const eventId = data?.eventId;
    const newEventStartDateTime = data?.newEventStartDateTime;
    const newEventEndDateTime = data?.newEventEndDateTime;
    const partnerId = context.auth!.uid;

    await checkPartnerClaim({ email: context.auth?.token.email! });

    const event = await tryGetEventData(eventId);
    const eventStartDateTime = moment(event.eventStartDateTime);

    if (eventStartDateTime.isBefore(moment().add(1, 'day'))) {
        const message = 'Time to postpone event has expired';
        const details: FunctionsErrorDetails = 'postpone-time-expired';
        throw new functions.https.HttpsError('deadline-exceeded', message, details);
    }

    await cancelUsersPaymentSessions(eventId);

    await getEventDocRef(eventId).update({ isCurrentlyPostponing: true } as Event);

    const eventCosts = await tryGetEventCostsData(partnerId, eventId);

    let paymentSheet: CreatePaymentSheetForPartnerResponse;

    try {
        paymentSheet = await createPaymentSheetForPartner(
            {
                currency: eventCosts.currency,
                amount: eventCosts.paymentProcessorFeeBalance,
                description: event.eventName,
            },
            context
        );
    } catch (e) {
        if (
            e instanceof Stripe.errors.StripeError &&
            (e.code === 'amount_too_small' || e.code === 'parameter_invalid_integer')
        ) {
            await updateEventCostsOnEventPostpone({
                currentEventCosts: eventCosts,
                eventId: event.id,
                clubId: event.clubId,
            });

            return;
        }

        throw e;
    }

    const cancelEventPostponeTaskId = await createCancelEventPostponeTask({
        postponeEventPaymentSessionId: paymentSheet.paymentIntentId,
        expirationTimeInSeconds: 600,
    });

    await getPostponeEventPaymentSessionDocRef(paymentSheet.paymentIntentId).set({
        eventId,
        cancelEventPostponeTaskId,
        partnerId,
        newEventStartDateTime,
        newEventEndDateTime,
        amount: eventCosts.paymentProcessorFeeBalance,
        status: 'requires_payment_method',
    } as PostponeEventPaymentSession);

    return paymentSheet;
}

function checkIfRequestIsValid(request: CreatePostponeEventPaymentSheetRequest) {
    if (!request.eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.newEventStartDateTime) {
        const message = 'The function must be called with new event start datetime';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.newEventEndDateTime) {
        const message = 'The function must be called with new event end datetime';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
