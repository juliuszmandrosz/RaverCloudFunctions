import * as functions from 'firebase-functions';
import { getVipPrice } from '../../firestore-functions/get-vip-price/get-vip-price';
import { getPromotionCode } from '../../firestore-functions/get-promotion-code/get-promotion-code';
import { CreateVipPaymentSheetRequest } from './create-vip-payment-sheet-request';
import { createPaymentSheetForUser } from '../create-payment-sheet-for-user/create-payment-sheet-for-user';
import { CreatePaymentSheetForUserResponse } from '../create-payment-sheet-for-user/create-payment-sheet-for-user-response';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { Ticket } from '../../models/ticket';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { tryGetTicketData } from '../../firestore-functions/get-data/get-ticket-data';
import { v1 } from 'uuid';
import { VipPaymentSession } from '../../models/vip-payment-session';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { vipPaymentSessions } from '../../constants/collections';

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

    const amount = await getAmount(ticket, context, promotionCode);

    const transferGroupId = v1();

    const paymentSheet = await createPaymentSheetForUser(
        {
            transferGroupId,
            amount,
            currency: ticket.currency,
            description: ticket.eventName,
            partnerId: ticket.clubId,
        },
        context
    );

    await firestoreDatabase()
        .collection(vipPaymentSessions)
        .doc(paymentSheet.paymentIntentId)
        .set({
            transferGroupId,
            userId,
            ticketId,
            promotionCode,
            amount,
            status: 'requires_payment_method',
        } as VipPaymentSession);

    return paymentSheet;
}

async function getAmount(
    ticket: Ticket,
    context: functions.https.CallableContext,
    promotionCode?: string
) {
    let amount = await getVipPrice({
        eventId: ticket.eventId,
    });

    if (promotionCode) {
        const result = await getPromotionCode(
            {
                promotionCode: promotionCode,
            },
            context
        );
        // TODO - add currency support for codes
        amount -= result.amountOff;
    }

    return amount;
}
