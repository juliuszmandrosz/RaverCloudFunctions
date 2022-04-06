import * as functions from 'firebase-functions'
import {getVipPrice} from '../../firestore-functions/get-vip-price/get-vip-price';
import {getPromotionCode} from "../../firestore-functions/get-promotion-code/get-promotion-code";
import {CreateVipPaymentSheetRequest} from "./create-vip-payment-sheet-request";
import {createPaymentSheetForUser} from "../create-payment-sheet-for-user/create-payment-sheet-for-user";
import {
    CreatePaymentSheetForUserResponse
} from "../create-payment-sheet-for-user/create-payment-sheet-for-user-response";
import {throwUnauthenticatedError} from "../../errors/throw-unauthenticated-error";
import {Ticket} from "../../models/ticket";
import {FunctionsErrorDetails} from "../../errors/functions-error-details";
import {getTicketData} from "../../firestore-functions/get-data/get-ticket-data";


export async function createVipPaymentSheet(
    data: CreateVipPaymentSheetRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForUserResponse> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const vipPaymentId = data?.vipPaymentId;
    const ticketId = data?.ticketId;
    const promotionCode = data?.promotionCode;
    const userId = context.auth!.uid;

    if (!vipPaymentId) {
        const message = 'The function must be called with payment id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!ticketId) {
        const message = 'The function must be called with ticket id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const ticket = await getTicketData(userId, ticketId);

    if (ticket.isVip) {
        const message = 'Given ticket already has the vip status';
        const details: FunctionsErrorDetails = 'ticket-already-has-vip';
        throw new functions.https.HttpsError('resource-exhausted', message, details);
    }

    const amount = await getAmount(ticket, context, promotionCode);

    return createPaymentSheetForUser({
        paymentId: vipPaymentId,
        amount,
        currency: ticket.currency,
        description: ticket.eventName,
        partnerId: ticket.clubId,
    }, context);
}


async function getAmount(
    ticket: Ticket,
    context: functions.https.CallableContext,
    promotionCode?: string,
) {
    let amount = await getVipPrice({
        eventId: ticket.eventId
    });

    if (promotionCode) {
        const result = await getPromotionCode({
                promotionCode: promotionCode
            },
            context
        );
        // TODO - add currency support for codes
        amount -= result.amountOff;
    }

    // TODO - add currency support
    return amount * 100;
}