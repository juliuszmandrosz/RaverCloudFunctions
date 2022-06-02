import * as functions from 'firebase-functions';
import { CreateTicketPaymentSheetRequest } from './create-ticket-payment-sheet-request';
import { createPaymentSheetForUser } from '../create-payment-sheet-for-user/create-payment-sheet-for-user';
import { CreatePaymentSheetForUserResponse } from '../create-payment-sheet-for-user/create-payment-sheet-for-user-response';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { ticketPaymentSessions } from '../../constants/collections';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { createCancelTicketReservationTask } from '../../cloud-tasks/create-cancel-ticket-reservation-task/create-cancel-ticket-reservation-task';
import { updateEventOnTicketPayment } from '../../firestore-functions/update-event/update-event-on-ticket-payment';
import { getTicketPaymentSheetAmount } from './get-ticket-payment-sheet-amount';
import { tryGetEventData } from '../../firestore-functions/get-data/get-event-data';
import { throwEventCanceledError } from '../../errors/throw-event-canceled-error';
import { throwEventPostponedError } from '../../errors/throw-event-postponed-errors';
import { getVipPrice } from '../../firestore-functions/get-vip-price/get-vip-price';
import { getUserFee } from '../../utils/stripe-utils/get-user-fee';
import { getPromotionCode } from '../../firestore-functions/get-promotion-code/get-promotion-code';

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

    const event = await tryGetEventData(eventId);

    if (event.isCanceled) {
        throwEventCanceledError();
    }

    if (event.isBeingPostponed) {
        throwEventPostponedError();
    }

    await updateEventOnTicketPayment(eventId, isVip);

    const vipPrice = isVip ? await getVipPrice({ clubId: event.clubId, eventId }) : 0;

    const clubIncome = event.price + vipPrice;

    const promotionCodeAmountOff = promotionCode
        ? await getPromotionCode({ promotionCode }, context).then((code) => code.amountOff)
        : 0;

    const userFeeAmount = await getUserFee(clubIncome - promotionCodeAmountOff, event.currency);

    const paymentSheetAmount = getTicketPaymentSheetAmount({
        clubIncome,
        userFeeAmount,
        promotionCodeAmountOff,
    });

    const paymentSheet = await createPaymentSheetForUser(
        {
            amount: paymentSheetAmount,
            description: event.eventName,
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
            cancelTicketReservationTaskId,
            eventId: event.id,
            userId,
            promotionCode,
            isVip,
            clubIncome,
            userFeeAmount,
            promotionCodeAmountOff,
            status: 'requires_payment_method',
            isRefunded: false,
        } as TicketPaymentSession);

    return paymentSheet;
}

function checkIfRequestIsValid(request: CreateTicketPaymentSheetRequest) {
    if (!request.eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
