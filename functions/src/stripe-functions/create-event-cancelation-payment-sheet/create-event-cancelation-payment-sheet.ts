import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { events } from '../../constants/collections';
import { CreatePaymentSheetForPartnerResponse } from '../create-payment-sheet-for-partner/create-payment-sheet-for-partner-response';
import { CreateEventCancelationPaymentSheetRequest } from './create-event-cancelation-payment-sheet-request';
import { checkPartnerClaim } from '../../auth-functions/check-claim/check-partner-claim';
import { Event } from '../../models/event';
import { createPaymentSheetForPartner } from '../create-payment-sheet-for-partner/create-payment-sheet-for-partner';
import { CancelEventPaymentSession } from '../../models/cancel-event-payment-session';
import { createCancelEventCancelationTask } from '../../cloud-tasks/create-cancel-event-cancelation-task/create-cancel-event-cancelation-task';
import * as moment from 'moment';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { tryGetEventData } from '../../firestore-functions/get-data/get-event-data';
import { refundTicketsForUsers } from '../refund-tickets-for-users';
import { Stripe } from 'stripe';
import { updateEventOnEventCancelation } from '../../firestore-functions/update-event/update-event-on-event-cancelation';
import { cancelUsersPaymentSessions } from '../../firestore-functions/cancel-users-payment-sessions/cancel-users-payment-sessions';
import { getCancelEventPaymentSessionDocRef } from '../../firestore-functions/get-data/get-cancel-event-payment-session';
import { updateTicketsOnEventCancelation } from '../../firestore-functions/update-tickets/update-tickets-on-event-cancelation';
import { getAmountForPartnerPaymentSheet } from '../get-amount-for-partner-payment-sheet';
import { payoutToPartnerInstantlyOnEventCancelation } from '../pay-out-to-partner/payout-to-partner-instantly-on-event-cancelation';

export async function createEventCancelationPaymentSheet(
    data: CreateEventCancelationPaymentSheetRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForPartnerResponse | undefined> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const eventId = data?.eventId;
    const partnerId = context.auth!.uid;

    await checkPartnerClaim({ email: context.auth?.token.email! });

    const event = await tryGetEventData(eventId);
    const eventStartDateTime = moment(event.eventStartDateTime);

    if (eventStartDateTime.isBefore(moment().add(1, 'day'))) {
        const message = 'Time to cancel event has expired';
        const details: FunctionsErrorDetails = 'cancel-time-expired';
        throw new functions.https.HttpsError('deadline-exceeded', message, details);
    }

    await cancelUsersPaymentSessions(eventId);

    await firestoreDatabase()
        .collection(events)
        .doc(eventId)
        .update({ isCanceled: true } as Event);

    const cancelationCost = await getAmountForPartnerPaymentSheet({
        eventId,
        clubId: event.clubId,
    });

    let paymentSheet: CreatePaymentSheetForPartnerResponse;

    try {
        paymentSheet = await createPaymentSheetForPartner(
            {
                currency: cancelationCost.currency,
                amount: cancelationCost.amount,
                description: event.eventName,
            },
            context
        );
    } catch (e) {
        if (
            e instanceof Stripe.errors.StripeError &&
            (e.code === 'amount_too_small' || e.code === 'parameter_invalid_integer')
        ) {
            const refundedSessions = await refundTicketsForUsers(event.id);
            await updateTicketsOnEventCancelation(refundedSessions.ticketSessions);
            await updateEventOnEventCancelation(event);
            await payoutToPartnerInstantlyOnEventCancelation(event);

            return;
        }

        throw e;
    }

    const cancelEventCancelationTaskId = await createCancelEventCancelationTask({
        cancelEventPaymentSessionId: paymentSheet.paymentIntentId,
        expirationTimeInSeconds: 600,
    });

    await getCancelEventPaymentSessionDocRef(paymentSheet.paymentIntentId).set({
        eventId,
        cancelEventCancelationTaskId,
        partnerId,
        amount: cancelationCost.amount,
        status: 'requires_payment_method',
    } as CancelEventPaymentSession);

    return paymentSheet;
}

function checkIfRequestIsValid(request: CreateEventCancelationPaymentSheetRequest) {
    if (!request.eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
