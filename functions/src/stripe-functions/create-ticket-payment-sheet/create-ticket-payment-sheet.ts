import * as functions from 'firebase-functions'
import {CreateTicketPaymentSheetRequest} from './create-ticket-payment-sheet-request';
import {getVipPrice} from '../../firestore-functions/get-vip-price/get-vip-price';
import {Event} from "../../models/event";
import {getPromotionCode} from "../../firestore-functions/get-promotion-code/get-promotion-code";
import {getEventData} from "../../firestore-functions/get-data/get-event-data";
import {createPaymentSheetForUser} from "../create-payment-sheet-for-user/create-payment-sheet-for-user";
import {
    CreatePaymentSheetForUserResponse
} from "../create-payment-sheet-for-user/create-payment-sheet-for-user-response";
import {throwUnauthenticatedError} from "../../errors/throw-unauthenticated-error";


export async function createTicketPaymentSheet(
    data: CreateTicketPaymentSheetRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForUserResponse> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const ticketPaymentId = data?.ticketPaymentId;
    const eventId = data?.eventId;

    if (!ticketPaymentId) {
        const message = 'The function must be called with ticket payment id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const event = await getEventData(eventId);
    const isVip = data?.isVip ?? false;
    const promotionCode = data?.promotionCode;

    const amount = await getAmount(event, isVip, context, promotionCode);

    return createPaymentSheetForUser({
        amount,
        paymentId: ticketPaymentId,
        description: event.eventName,
        partnerId: event.clubId,
        currency: event.currency,
    }, context);
}

async function getAmount(
    event: Event,
    isVip: boolean,
    context: functions.https.CallableContext,
    promotionCode?: string,
) {
    let amount = event.price;

    if (promotionCode) {
        const result = await getPromotionCode({
                promotionCode: promotionCode
            },
            context
        );
        // TODO - add currency support for codes
        amount -= result.amountOff;
    }

    if (isVip) {
        const vipPrice = await getVipPrice({
            eventId: event.id,
        });
        amount += vipPrice;
    }

    // TODO - add currency support
    return amount * 100;
}




