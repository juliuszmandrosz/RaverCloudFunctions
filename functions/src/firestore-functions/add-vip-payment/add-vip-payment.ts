import * as functions from 'firebase-functions'
import {throwUnauthenticatedError} from "../../errors/throw-unauthenticated-error";
import {applyPromotionCode} from "../apply-promotion-code/apply-promotion-code";
import {stripe} from "../../modules/stripe-module";
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;
import {getVipPrice} from "../get-vip-price/get-vip-price";
import {AddVipPaymentRequest} from "./add-vip-payment-request";
import {stripeCustomers, vipPayments} from "../../constants/collections";
import {VipPayment} from "../../models/vip-payment";
import {getConnectedAccountData} from "../get-data/get-connected-account-data";
import {getFee} from "../../utils/get-fee";
import {getTicketData} from "../get-data/get-ticket-data";


export async function addVipPayment(
    data: AddVipPaymentRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const vipPaymentId = data?.vipPaymentId;
    const paymentIntentId = data?.paymentIntentId;
    const ticketId = data?.ticketId;
    const promotionCode = data?.promotionCode;
    const userId = context.auth!.uid;

    const ticket = await getTicketData(userId, ticketId);
    const promotionCodeAmountOff = promotionCode ? await applyCode(promotionCode, userId) : 0;
    const vipPrice = await getVipPrice({eventId: ticket.eventId});
    const transferAmount = await getTransferAmount(vipPrice);
    const paymentAmount = getPaymentAmount(vipPrice, promotionCodeAmountOff);
    const connectedAccount = await getConnectedAccountData(ticket.clubId);

    const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: ticket.currency,
        description: ticket.eventName,
        destination: connectedAccount.connectedAccountId,
        transfer_group: vipPaymentId,
    });

    await firestoreDatabase()
        .collection(stripeCustomers).doc(userId)
        .collection(vipPayments).doc(vipPaymentId).set({
            paymentIntentId,
            promotionCode,
            eventId: ticket.eventId,
            transferId: transfer.id,
            currency: ticket.currency,
            price: paymentAmount,
            paymentDateTime: Timestamp.now(),
        } as VipPayment);
}

async function getTransferAmount(vipPrice: number) {
    const fee = await getFee(vipPrice);

    vipPrice -= fee;

    // TODO - add support for different currencies
    return vipPrice * 100;
}

function getPaymentAmount(vipPrice: number, promotionCodeAmountOff: number) {
    vipPrice -= promotionCodeAmountOff;

    return vipPrice;
}


async function applyCode(promotionCode: string, userId: string): Promise<number> {
    const code = await applyPromotionCode({
        promotionCode,
        userId
    });

    return code.amountOff;
}

function checkIfRequestIsValid(request: AddVipPaymentRequest) {
    if (!request.vipPaymentId) {
        const message = 'The function must be called with vip payment id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.paymentIntentId) {
        const message = 'The function must be called with payment intent id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.ticketId) {
        const message = 'The function must be called with ticket id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}