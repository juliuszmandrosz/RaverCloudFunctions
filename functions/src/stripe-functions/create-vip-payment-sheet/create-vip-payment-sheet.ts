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
import { getServiceFeeAmount } from '../../utils/stripe-utils/get-service-fee-amount';
import { getVipPaymentSheetAmount } from './get-vip-payment-sheet-amount';
import { getPromotionCode } from '../../firestore-functions/get-promotion-code/get-promotion-code';
import { getStripeCustomerIdFromContext } from '../../utils/stripe-utils/get-stripe-customer-id-from-context';

export async function createVipPaymentSheet(
    data: CreateVipPaymentSheetRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForUserResponse> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const ticketId = data?.ticketId;
    const promotionCode = data?.promotionCode;
    const sendInvoice = data?.sendInvoice ?? false;
    const userId = context.auth!.uid;
    const stripeCustomerId = await getStripeCustomerIdFromContext(context);

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

    const serviceFeeAmount = await getServiceFeeAmount(
        vipPrice - promotionCodeAmountOff,
        event.currency
    );

    const paymentSheetAmount = await getVipPaymentSheetAmount({
        vipPrice,
        promotionCodeAmountOff,
        serviceFeeAmount,
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
            revenue: vipPrice,
            promotionCodeAmountOff,
            serviceFeeAmount,
            status: 'requires_payment_method',
            eventId: ticket.eventId,
            isRefunded: false,
            stripeCustomerId,
            sendInvoice,
        } as VipPaymentSession);

    return paymentSheet;
}
