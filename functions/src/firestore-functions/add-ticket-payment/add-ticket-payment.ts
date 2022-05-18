import * as functions from 'firebase-functions';
import { AddTicketPaymentRequest } from './add-ticket-payment-request';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { applyPromotionCode } from '../apply-promotion-code/apply-promotion-code';
import { stripe } from '../../modules/stripe-module';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { stripeCustomers, ticketPayments } from '../../constants/collections';
import { TicketPayment } from '../../models/ticket-payment';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import * as moment from 'moment';
import { getVipPrice } from '../get-vip-price/get-vip-price';
import { getConnectedAccountData } from '../get-data/get-connected-account-data';
import { getEventData } from '../get-data/get-event-data';
import { getFee } from '../../utils/get-fee';

export async function addTicketPayment(
    data: AddTicketPaymentRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const ticketPaymentId = data?.ticketPaymentId;
    const paymentIntentId = data?.paymentIntentId;
    const eventId = data?.eventId;
    const isVip = data?.isVip;
    const promotionCode = data?.promotionCode;
    const userId = context.auth!.uid;

    const event = await getEventData(eventId);
    const connectedAccount = await getConnectedAccountData(event.clubId);

    const promotionCodeAmountOff = promotionCode ? await applyCode(promotionCode, userId) : 0;
    const vipPrice = isVip ? await getVipPrice({ eventPrice: event.price }) : 0;

    const transferAmount = await getTransferAmount(event.price, vipPrice);
    const paymentAmount = getPaymentAmount(event.price, vipPrice, promotionCodeAmountOff);

    const eventDateTime = Timestamp.fromDate(moment(event.eventStartDateTime).toDate());

    const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: event.currency,
        destination: connectedAccount.connectedAccountId,
        transfer_group: ticketPaymentId,
        description: event.eventName,
    });

    await firestoreDatabase()
        .collection(stripeCustomers)
        .doc(userId)
        .collection(ticketPayments)
        .doc(ticketPaymentId)
        .set({
            paymentIntentId,
            promotionCode,
            eventId,
            eventName: event.eventName,
            isVip,
            eventDateTime,
            transferId: transfer.id,
            currency: event.currency,
            price: paymentAmount,
            paymentDateTime: Timestamp.now(),
        } as TicketPayment);
}

async function getTransferAmount(eventPrice: number, vipPrice: number) {
    eventPrice += vipPrice;

    const fee = await getFee(eventPrice);

    eventPrice -= fee;

    // TODO - add support for different currencies
    return eventPrice * 100;
}

function getPaymentAmount(eventPrice: number, vipPrice: number, promotionCodeAmountOff: number) {
    eventPrice += vipPrice;

    eventPrice -= promotionCodeAmountOff;

    return eventPrice;
}

async function applyCode(promotionCode: string, userId: string): Promise<number> {
    const code = await applyPromotionCode({
        promotionCode,
        userId,
    });

    return code.amountOff;
}

function checkIfRequestIsValid(request: AddTicketPaymentRequest) {
    if (!request.ticketPaymentId) {
        const message = 'The function must be called with ticket payment id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.paymentIntentId) {
        const message = 'The function must be called with payment intent id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (request.isVip == null) {
        const message = 'The function must be called with is vip';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
