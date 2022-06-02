import * as functions from 'firebase-functions';
import { CreateVipPaymentSheetRequest } from './create-vip-payment-sheet-request';
import { createPaymentSheetForUser } from '../create-payment-sheet-for-user/create-payment-sheet-for-user';
import { CreatePaymentSheetForUserResponse } from '../create-payment-sheet-for-user/create-payment-sheet-for-user-response';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { tryGetTicketData } from '../../firestore-functions/get-data/get-ticket-data';
import { VipPaymentSession } from '../../models/vip-payment-session';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { vipPaymentSessions } from '../../constants/collections';
import { getVipPrice } from '../../firestore-functions/get-vip-price/get-vip-price';
import { tryGetEventData } from '../../firestore-functions/get-data/get-event-data';
import { throwEventCanceledError } from '../../errors/throw-event-canceled-error';
import { throwEventPostponedError } from '../../errors/throw-event-postponed-errors';
import { getUserFee } from '../../utils/stripe-utils/get-user-fee';
import { getVipPaymentSheetAmount } from './get-vip-payment-sheet-amount';
import { getPromotionCode } from '../../firestore-functions/get-promotion-code/get-promotion-code';

export async function createVipPaymentSheet(
    data: CreateVipPaymentSheetRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForUserResponse> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const ticketId = data?.ticketId;
    const promotionCode = data?.promotionCode;
    const userId = context.auth!.uid;

    if (!ticketId) {
        const message = 'The function must be called with ticket id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const ticket = await tryGetTicketData(userId, ticketId);

    if (ticket.isVip) {
        const message = 'Given ticket already has the vip status';
        const details: FunctionsErrorDetails = 'ticket-already-has-vip';
        throw new functions.https.HttpsError('resource-exhausted', message, details);
    }

    const event = await tryGetEventData(ticket.eventId);

    if (event.isCanceled) {
        throwEventCanceledError();
    }

    if (event.isBeingPostponed) {
        throwEventPostponedError();
    }

    const vipPrice = await getVipPrice({
        eventId: ticket.eventId,
        clubId: ticket.clubId,
    });

    const promotionCodeAmountOff = promotionCode
        ? await getPromotionCode({ promotionCode }, context).then((code) => code.amountOff)
        : 0;

    const userFeeAmount = await getUserFee(vipPrice - promotionCodeAmountOff, event.currency);

    const paymentSheetAmount = await getVipPaymentSheetAmount({
        vipPrice,
        promotionCodeAmountOff,
        userFeeAmount,
    });

    const paymentSheet = await createPaymentSheetForUser(
        {
            amount: paymentSheetAmount,
            currency: ticket.currency,
            description: ticket.eventName,
        },
        context
    );

    await firestoreDatabase()
        .collection(vipPaymentSessions)
        .doc(paymentSheet.paymentIntentId)
        .set({
            userId,
            ticketId,
            promotionCode,
            clubIncome: vipPrice,
            promotionCodeAmountOff,
            userFeeAmount,
            status: 'requires_payment_method',
            eventId: ticket.eventId,
            isRefunded: false,
        } as VipPaymentSession);

    return paymentSheet;
}
