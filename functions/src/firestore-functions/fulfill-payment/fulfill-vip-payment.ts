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
import { updateEventTicketsOnVipPayment } from '../update-event-tickets/update-event-tickets-on-vip-payment';
import { sendInvoiceForCustomer } from '../../stripe-functions/send-invoice-for-customer/send-invoice-for-customer';

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

    const newTicketPrice =
        ticket.price + vipPaymentSession.revenue - vipPaymentSession.promotionCodeAmountOff;

    await ticketDocRef.update({
        isVip: true,
        price: newTicketPrice,
        vipPaymentId: vipPaymentSession.id,
    } as Ticket);

    await firestoreDatabase()
        .collection(vipPaymentSessions)
        .doc(vipPaymentSession.id)
        .update({
            paymentDateTime: Timestamp.now(),
            status: 'succeeded',
        } as VipPaymentSession);

    await updateEventTicketsOnVipPayment({
        ticket,
        vipPrice: vipPaymentSession.revenue,
        response,
    });

    await updateEventCostsOnUserPayment({
        amount: vipPaymentSession.serviceFeeAmount,
        eventId: ticket.eventId,
        clubId: ticket.clubId,
        response,
    });

    if (vipPaymentSession.sendInvoice) {
        const eventStartDate = ticket.eventStartDateTime;

        const description = `VIP ${ticket.eventName}\n${eventStartDate
            .toDate()
            .toLocaleDateString()}`;

        await sendInvoiceForCustomer({
            customerId: vipPaymentSession.stripeCustomerId,
            description,
            amount:
                vipPaymentSession.revenue +
                vipPaymentSession.serviceFeeAmount -
                vipPaymentSession.promotionCodeAmountOff,
            currency: ticket.currency,
        });
    }
}
