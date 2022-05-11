import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { events, ticketPaymentSessions } from '../../constants/collections';
import { CreatePaymentSheetForPartnerResponse } from '../create-payment-sheet-for-partner/create-payment-sheet-for-partner-response';
import { CreateEventCancelationPaymentSheetRequest } from './create-event-cancelation-payment-sheet-request';
import { checkPartnerClaim } from '../../auth-functions/check-claim/check-partner-claim';
import { tryGetEventCostsData } from '../../firestore-functions/get-data/get-event-costs-data';
import { Event } from '../../models/event';
import { createPaymentSheetForPartner } from '../create-payment-sheet-for-partner/create-payment-sheet-for-partner';
import { CancelEventPaymentSession } from '../../models/cancel-event-payment-session';
import { createCancelEventCancelationTask } from '../../cloud-tasks/create-cancel-event-cancelation-task/create-cancel-event-cancelation-task';
import { updateEventOnCreateEventCancelationPaymentSheet } from '../../firestore-functions/update-event/update-event-on-create-event-cancelation-payment-sheet';
import { cancelUsersTicketPaymentSessions } from './cancel-users-ticket-payment-sessions';
import { cancelUsersVipPaymentSessions } from './cancel-users-vip-payment-sessions';

export async function createEventCancelationPaymentSheet(
    data: CreateEventCancelationPaymentSheetRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForPartnerResponse> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const eventId = data?.eventId;
    const partnerId = context.auth!.uid;

    await checkPartnerClaim({ email: context.auth?.token.email! });

    await firestoreDatabase()
        .collection(events)
        .doc(eventId)
        .update({ isCanceled: true } as Event);

    const eventCosts = await tryGetEventCostsData(partnerId, eventId);

    const cancelTicketsSessionsResponse = await cancelUsersTicketPaymentSessions(eventId);

    await cancelUsersVipPaymentSessions(eventId);

    const event = await updateEventOnCreateEventCancelationPaymentSheet({
        eventId,
        canceledTicketSessionsQuantity:
            cancelTicketsSessionsResponse.canceledTicketSessionsQuantity,
        canceledFunds: cancelTicketsSessionsResponse.canceledFunds,
        canceledVipSessionsQuantity: cancelTicketsSessionsResponse.canceledVipSessionsQuantity,
    });

    const paymentSheet = await createPaymentSheetForPartner(
        {
            currency: eventCosts.currency,
            amount: eventCosts.paymentProcessorFeeBalance,
            description: event.eventName,
        },
        context
    );

    const cancelEventCancelationTaskId = await createCancelEventCancelationTask({
        cancelEventPaymentSessionId: paymentSheet.paymentIntentId,
        expirationTimeInSeconds: 600,
    });

    await firestoreDatabase()
        .collection(ticketPaymentSessions)
        .doc(paymentSheet.paymentIntentId)
        .set({
            eventId,
            cancelEventCancelationTaskId,
            partnerId,
            amount: eventCosts.paymentProcessorFeeBalance,
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
