import * as functions from 'firebase-functions';

import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { stripe } from '../../modules/stripe-module';
import { getConnectedAccountDataOrReturnNotFound } from '../get-data/get-connected-account-data';
import { getTransferAmount } from '../../utils/stripe-utils/get-transfer-amount';
import { applyPromotionCode } from '../apply-promotion-code/apply-promotion-code';
import { Ticket } from '../../models/ticket';
import { getTicketDataOrReturnNotFound, getTicketDocRef } from '../get-data/get-ticket-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getVipPaymentSessionDataOrUndefined } from '../get-data/get-vip-payment-session.data';
import { vipPaymentSessions } from '../../constants/collections';
import { VipPaymentSession } from '../../models/vip-payment-session';
import { updateEventCostsOnUserPayment } from '../update-event-costs/update-event-costs-on-user-payment';
import { updateTicketSalesOnVipPayment } from '../update-ticket-sales/update-ticket-sales-on-vip-payment';

export async function fulfillVipPayment(
    paymentSessionId: string,
    response: functions.Response
): Promise<void> {
    const vipPaymentSession = await getVipPaymentSessionDataOrUndefined(paymentSessionId);

    if (!vipPaymentSession) return;

    const ticket = await getTicketDataOrReturnNotFound(
        vipPaymentSession.userId,
        vipPaymentSession.ticketId,
        response
    );

    if (!ticket) return;

    const ticketDocRef = getTicketDocRef(vipPaymentSession.userId, vipPaymentSession.ticketId);

    await ticketDocRef.update({
        isVip: true,
        price: ticket.price + vipPaymentSession.amount,
        vipPaymentId: vipPaymentSession.id,
    } as Ticket);

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
}
