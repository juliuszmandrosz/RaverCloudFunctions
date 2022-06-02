import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
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

    await firestoreDatabase()
        .collection(vipPaymentSessions)
        .doc(vipPaymentSession.id)
        .update({
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
