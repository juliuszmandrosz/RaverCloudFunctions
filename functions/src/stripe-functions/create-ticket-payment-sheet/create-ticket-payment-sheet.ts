import * as functions from 'firebase-functions';
import { CreateTicketPaymentSheetRequest } from './create-ticket-payment-sheet-request';
import { getVipPrice } from '../../firestore-functions/get-vip-price/get-vip-price';
import { getPromotionCode } from '../../firestore-functions/get-promotion-code/get-promotion-code';
import { createPaymentSheetForUser } from '../create-payment-sheet-for-user/create-payment-sheet-for-user';
import { CreatePaymentSheetForUserResponse } from '../create-payment-sheet-for-user/create-payment-sheet-for-user-response';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { ticketPaymentSessions } from '../../constants/collections';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { createCancelTicketReservationTask } from '../../cloud-tasks/create-cancel-ticket-reservation-task/create-cancel-ticket-reservation-task';
import { v1 } from 'uuid';
import { updateEventOnTicketPayment } from '../../firestore-functions/update-event/update-event-on-ticket-payment';

export async function createTicketPaymentSheet(
    data: CreateTicketPaymentSheetRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForUserResponse> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const eventId = data?.eventId;
    const isVip = data?.isVip ?? false;
    const promotionCode = data?.promotionCode;
    const userId = context.auth!.uid;

    const event = await updateEventOnTicketPayment(eventId, isVip);

    const amount = await getAmount(event.price, isVip, context, promotionCode);

    const transferGroupId = v1();

    const paymentSheet = await createPaymentSheetForUser(
        {
            transferGroupId,
            amount,
            description: event.eventName,
            partnerId: event.clubId,
            currency: event.currency,
        },
        context
    );

    const cancelTicketReservationTaskId = await createCancelTicketReservationTask({
        ticketPaymentSessionId: paymentSheet.paymentIntentId,
        expirationTimeInSeconds: 600,
    });

    await firestoreDatabase()
        .collection(ticketPaymentSessions)
        .doc(paymentSheet.paymentIntentId)
        .set({
            transferGroupId,
            cancelTicketReservationTaskId,
            eventId: event.id,
            userId,
            promotionCode,
            isVip,
            amount,
            status: 'requires_payment_method',
        } as TicketPaymentSession);

    return paymentSheet;
}

async function getAmount(
    eventPrice: number,
    isVip: boolean,
    context: functions.https.CallableContext,
    promotionCode?: string
) {
    if (promotionCode) {
        const result = await getPromotionCode(
            {
                promotionCode: promotionCode,
            },
            context
        );
        // TODO - add currency support for codes
        eventPrice -= result.amountOff;
    }

    if (isVip) {
        const vipPrice = await getVipPrice({
            eventPrice: eventPrice,
        });
        eventPrice += vipPrice;
    }

    return eventPrice;
}

function checkIfRequestIsValid(request: CreateTicketPaymentSheetRequest) {
    if (!request.eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
