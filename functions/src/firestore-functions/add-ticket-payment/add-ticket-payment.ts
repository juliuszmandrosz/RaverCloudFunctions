import * as functions from 'firebase-functions'
import {AddTicketPaymentRequest} from "./add-ticket-payment-request";
import {throwUnauthenticatedError} from "../../errors/throw-unauthenticated-error";
import {applyPromotionCode} from "../apply-promotion-code/apply-promotion-code";
import {stripe} from "../../modules/stripe-module";
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {events, stripeConnectedAccounts, stripeCustomers, ticketPayments} from "../../constants/collections";
import {getParameterFromRemoteConfig} from "../../utils/remote-config-utils";
import {feeAmount} from "../../constants/remote-config-params";
import {throwInvalidEventError} from "../../errors/throw-invalid-event-error";
import {Event} from "../../models/event";
import {TicketPayment} from "../../models/ticket-payment";
import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;
import {StripeConnectedAccount} from "../../models/stripe-connected-account";
import * as moment from "moment";
import {getVipPrice} from "../get-vip-price/get-vip-price";


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
    const vipPrice = isVip ? await getVipPrice({eventPrice: event.price}) : 0;

    const transferAmount = await getTransferAmount(event.price, vipPrice);
    const paymentAmount = getPaymentAmount(event.price, vipPrice, promotionCodeAmountOff);

    const eventTimestamp = Timestamp.fromDate(moment(event.eventStartDateTime).toDate());

    const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: event.currency,
        destination: connectedAccount.connectedAccountId,
        transfer_group: ticketPaymentId,
        description: event.eventName,
    });

    await firestoreDatabase()
        .collection(stripeCustomers).doc(userId)
        .collection(ticketPayments).doc(ticketPaymentId).set({
            paymentIntentId,
            promotionCode,
            eventId,
            isVip,
            transferId: transfer.id,
            currency: event.currency,
            price: paymentAmount,
            paymentDateTime: Timestamp.now(),
            eventDateTime: eventTimestamp,
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


async function getFee(price: number) {
    const fee = await getParameterFromRemoteConfig(feeAmount);
    return price * parseFloat(fee);
}

async function applyCode(promotionCode: string, userId: string): Promise<number> {
    const code = await applyPromotionCode({
        promotionCode,
        userId
    });

    return code.amountOff;
}


async function getEventData(eventId: string) {
    const eventDoc = await firestoreDatabase().collection(events).doc(eventId).get();

    if (!eventDoc.exists) {
        throwInvalidEventError();
    }

    return eventDoc.data() as Event;
}

async function getConnectedAccountData(clubId: string) {
    const connectedAccountDoc = await firestoreDatabase()
        .collection(stripeConnectedAccounts).doc(clubId)
        .get();

    if (!connectedAccountDoc.exists) {
        const message = 'Connected account with given id does not exists';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    return connectedAccountDoc.data() as StripeConnectedAccount;
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








