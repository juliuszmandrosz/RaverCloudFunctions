import * as functions from 'firebase-functions'
import {TicketPayment} from "../models/ticket-payment";
import {applyPromotionCode} from "../firestore-functions/apply-promotion-code/apply-promotion-code";
import {
    transferTicketPriceToAccount
} from "../stripe-functions/transfer-ticket-price-to-account/transfer-ticket-price-to-account";

export async function onTicketPaymentAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const data = snapshot.data()! as TicketPayment;
    data.id = snapshot.id;

    const userId = snapshot.ref.parent.parent!.id;

    if (data.promotionCode) {
        await applyPromotionCode({
            promotionCode: data.promotionCode,
            userId: userId,
        });
    }


    await transferTicketPriceToAccount({
        ticketPaymentId: data.id,
        userId: userId,
    });
}

