import * as functions from 'firebase-functions';
import {firestore} from 'firebase-admin';
import {v1} from 'uuid';
import {getTicketPaymentSessionDataOrUndefined} from '../get-data/get-ticket-payment-session-data';
import {getEventDataOrReturnNotFound} from '../get-data/get-event-data';
import {firestoreDatabase} from '../../modules/firebase-admin-module';
import {ticketPaymentSessions, tickets, users} from '../../constants/collections';
import {TicketPaymentSession} from '../../models/ticket-payment-session';
import {Ticket} from '../../models/ticket';
import {toJson} from '../../utils/json-utils';
import Timestamp = firestore.Timestamp;

export async function fulfillTicketPayment(
    paymentSessionId: string,
    response: functions.Response
): Promise<void> {
    const ticketPaymentSession = await getTicketPaymentSessionDataOrUndefined(paymentSessionId);

    if (!ticketPaymentSession) return;

    // await tasksClient.deleteTask({ name: ticketPaymentSession.cancelTicketReservationTaskId });

    const event = await getEventDataOrReturnNotFound(ticketPaymentSession.eventId, response);

    if (!event) return;

    const ticketId = v1();

    await firestoreDatabase()
        .collection(ticketPaymentSessions)
        .doc(ticketPaymentSession.id)
        .update(
            toJson({
                status: 'succeeded',
                paymentDateTime: Timestamp.now(),
                ticketId: ticketId,
            } as TicketPaymentSession)
        );

    await firestoreDatabase()
        .collection(users)
        .doc(ticketPaymentSession.userId)
        .collection(tickets)
        .doc(ticketId)
        .set({
            eventId: event.id,
            ticketPaymentId: ticketPaymentSession.id,
            currency: event.currency,
            price: ticketPaymentSession.revenue - ticketPaymentSession.promotionCodeAmountOff,
            eventStartDateTime: Timestamp.fromMillis(event.eventStartDateTime),
            eventEndDateTime: Timestamp.fromMillis(event.eventEndDateTime),
            clubName: event.clubName,
            clubId: event.clubId,
            eventName: event.eventName,
            isExpired: false,
            isEventCanceled: false,
            isReturnable: false,
            isReturned: false,
            quantity: ticketPaymentSession.ticketQuantity,
            createdAt: Timestamp.now(),
        } as Ticket);

    // await updateEventCostsOnUserPayment({
    //     eventId: event.id,
    //     clubId: event.clubId,
    //     amount: ticketPaymentSession.serviceFeeAmount,
    //     response,
    // });

    // const user = await getUserDataOrReturnNotFound(ticketPaymentSession.userId, response);
    //
    // if (!user) return;

    // await sendQrCodeToEmail({
    //     ticketId,
    //     eventName: event.eventName,
    //     user,
    // });

    // if (ticketPaymentSession.sendInvoice) {
    //     const eventStartDate = Timestamp.fromMillis(event.eventStartDateTime);
    //
    //     const description = `${event.eventName}\n${eventStartDate.toDate().toLocaleDateString()}`;
    //
    //     await sendInvoiceForCustomer({
    //         customerId: ticketPaymentSession.stripeCustomerId,
    //         description,
    //         revenue: ticketPaymentSession.revenue,
    //         serviceFee: ticketPaymentSession.serviceFeeAmount,
    //         locale: user.locale,
    //         currency: event.currency,
    //     });
    // }

    // if (ticketPaymentSession.promotionCode) {
    //     await applyPromotionCode({
    //         promotionCode: ticketPaymentSession.promotionCode,
    //         userId: ticketPaymentSession.userId,
    //     });
    // }
}
