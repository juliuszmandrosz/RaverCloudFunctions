import * as functions from "firebase-functions";
import {TransferTicketPriceToAccountRequest} from "./transfer-ticket-price-to-account-request";
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {promotionCodes, stripeCustomers, ticketPayments, users} from "../../constants/collections";
import {TicketPayment} from "../../models/ticket-payment";
import {stripe} from "../../modules/stripe-module";
import {PromotionCode} from "../../models/promotion-code";
import {getParameterFromRemoteConfig} from "../../utils/remote-config-utils";
import {feeAmount} from "../../constants/remote-config-params";
import {throwInvalidPromotionCodeError} from "../../errors/throw-invalid-promotion-code-error";

export async function transferTicketPriceToAccount(
    data: TransferTicketPriceToAccountRequest
): Promise<void> {
    const ticketPaymentId = data?.ticketPaymentId;
    const userId = data?.userId;

    if (!ticketPaymentId) {
        const message = 'The function must be called with ticket paymentId id.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!userId) {
        const message = 'The function must be called with user id.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const ticketPaymentDoc = await firestoreDatabase()
        .collection(stripeCustomers)
        .doc(userId)
        .collection(ticketPayments)
        .doc(ticketPaymentId)
        .get();

    if (!ticketPaymentDoc.exists) {
        const message = 'Ticket payment with given id doest not exists';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const ticketPayment = ticketPaymentDoc.data() as TicketPayment;
    ticketPayment.id = ticketPaymentDoc.id;


    const amount = await getAmount(ticketPayment.price, userId, ticketPayment.promotionCode);

    await stripe.transfers.create({
        amount,
        currency: ticketPayment.currency,
        // TODO - change
        destination: 'acct_1KhdCYRidFmpr8Rx',
        transfer_group: ticketPayment.id,
        description: ticketPayment.eventName,
    });
}

async function getAmount(price: number, userId: string, promotionCode?: string) {
    if (promotionCode) {
        const amountOff = await getPromotionCodeAmountOff(promotionCode, userId);
        // TODO - add currency support for codes
        price += amountOff;
    }

    const fee = await getFee(price);

    price -= fee;

    return price * 100;
}


async function getPromotionCodeAmountOff(promotionCode: string, userId: string) {
    const doc = await firestoreDatabase()
        .collection(users)
        .doc(userId)
        .collection(promotionCodes)
        .doc(promotionCode)
        .get();

    if (!doc.exists) {
        throwInvalidPromotionCodeError();
    }

    const code = doc.data() as PromotionCode;

    return code.amountOff;
}

async function getFee(price: number) {
    const fee = await getParameterFromRemoteConfig(feeAmount);
    return price * parseFloat(fee);
}
