import { VipPaymentSession } from '../models/vip-payment-session';
import * as functions from 'firebase-functions';
import { applyPromotionCode } from './apply-promotion-code/apply-promotion-code';
import { getConnectedAccountDataOrReturnNotFound } from './get-data/get-connected-account-data';
import { stripe } from '../modules/stripe-module';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { vipPaymentSessions } from '../constants/collections';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { Ticket } from '../models/ticket';
import { updateTicketSalesOnVipPayment } from './update-ticket-sales-on-vip-payment';
import { getTicketDataOrReturnNotFound, getTicketDocRef } from './get-data/get-ticket-data';
import { updateEventCostsOnUserPayment } from './update-event-costs/update-event-costs-on-user-payment';
import { getVipPaymentSessionDataOrUndefined } from './get-data/get-vip-payment-session.data';
import { getTransferAmount } from '../utils/stripe-utils/get-transfer-amount';

export async function fulfillVipPayment(
    paymentSessionId: string,
    response: functions.Response
): Promise<Ticket | undefined> {
    const vipPaymentSession = await getVipPaymentSessionDataOrUndefined(paymentSessionId);

    if (!vipPaymentSession) return;

    const ticket = await firestoreDatabase().runTransaction(async (transaction) => {
        const ticketDocRef = getTicketDocRef(vipPaymentSession.userId, vipPaymentSession.ticketId);

        const ticketData = await getTicketDataOrReturnNotFound(
            vipPaymentSession.userId,
            vipPaymentSession.ticketId,
            response,
            transaction
        );

        if (!ticketData) return;

        transaction.update(ticketDocRef, {
            isVip: true,
            price: ticketData.price + vipPaymentSession.amount,
            vipPaymentId: vipPaymentSession.id,
        } as Ticket);

        return ticketData;
    });

    if (!ticket) return;

    const promotionCodeAmountOff = vipPaymentSession.promotionCode
        ? await applyPromotionCode({
              promotionCode: vipPaymentSession.promotionCode,
              userId: vipPaymentSession.userId,
          }).then((code) => code.amountOff)
        : 0;

    const transferAmount = await getTransferAmount(
        vipPaymentSession.amount,
        promotionCodeAmountOff
    );

    const connectedAccount = await getConnectedAccountDataOrReturnNotFound(ticket.clubId, response);

    if (!connectedAccount) return;

    const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: ticket.currency,
        description: ticket.eventName,
        destination: connectedAccount.connectedAccountId,
        transfer_group: vipPaymentSession.transferGroupId,
    });

    await firestoreDatabase()
        .collection(vipPaymentSessions)
        .doc(vipPaymentSession.id)
        .update({
            transferId: transfer.id,
            paymentDateTime: Timestamp.now(),
            status: 'succeeded',
        } as VipPaymentSession);

    await updateTicketSalesOnVipPayment(ticket, vipPaymentSession.amount, response);

    await updateEventCostsOnUserPayment({
        paymentSessionId: vipPaymentSession.id,
        eventId: ticket.eventId,
        clubId: ticket.clubId,
        response,
    });

    return ticket;
}
