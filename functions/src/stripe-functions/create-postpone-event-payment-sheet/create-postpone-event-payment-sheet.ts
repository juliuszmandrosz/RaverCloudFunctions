import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { CreatePaymentSheetForPartnerResponse } from '../create-payment-sheet-for-partner/create-payment-sheet-for-partner-response';
import { checkPartnerClaim } from '../../auth-functions/check-claim/check-partner-claim';
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
import { getAmountForPostponePaymentSheet } from './get-amount-for-postpone-payment-sheet';

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

    if (eventStartDateTime.isBefore(moment().add(24, 'hours'))) {
        const message = 'Time to postpone event has expired';
        const details: FunctionsErrorDetails = 'postpone-time-expired';
        throw new functions.https.HttpsError('deadline-exceeded', message, details);
    }

    if (moment(newEventStartDateTime).isBefore(eventStartDateTime.add(24, 'hours'))) {
        const message = 'The minimum time by which an event can be postponed is 24 hours';
        const details: FunctionsErrorDetails = 'postpone-time-too-short';
        throw new functions.https.HttpsError('invalid-argument', message, details);
    }

    await cancelUsersPaymentSessions(eventId);

    await getEventDocRef(eventId).update({ isCurrentlyPostponing: true } as Event);

    let paymentSheet: CreatePaymentSheetForPartnerResponse;

    const postponeCost = await getAmountForPostponePaymentSheet({ eventId, clubId: event.clubId });

    try {
        paymentSheet = await createPaymentSheetForPartner(
            {
                currency: postponeCost.currency,
                amount: postponeCost.amount,
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
        amount: postponeCost.amount,
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
