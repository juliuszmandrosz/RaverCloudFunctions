import { tasksClient } from '../modules/cloud-tasks-module';
import { stripe } from '../modules/stripe-module';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { ticketPaymentSessions, tickets, users } from '../constants/collections';
import { Ticket } from '../models/ticket';
import { TicketPaymentSession } from '../models/ticket-payment-session';
import { applyPromotionCode } from './apply-promotion-code/apply-promotion-code';
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { v1 } from 'uuid';
import { getTransferAmount } from '../utils/get-transfer-amount';
import { getEventDataOrReturnNotFound } from './get-data/get-event-data';
import { getConnectedAccountDataOrReturnNotFound } from './get-data/get-connected-account-data';

export async function fulfillTicketPayment(
    ticketPaymentSession: TicketPaymentSession,
    response: functions.Response
): Promise<Ticket | undefined> {
    await tasksClient.deleteTask({ name: ticketPaymentSession.cancelTicketReservationTaskId });

    const event = await getEventDataOrReturnNotFound(ticketPaymentSession.eventId, response);

    if (!event) return;

    const connectedAccount = await getConnectedAccountDataOrReturnNotFound(event.clubId, response);

    if (!connectedAccount) return;

    const promotionCodeAmountOff = ticketPaymentSession.promotionCode
        ? await applyPromotionCode({
              promotionCode: ticketPaymentSession.promotionCode,
              userId: ticketPaymentSession.userId,
          }).then((code) => code.amountOff)
        : 0;

    const transferAmount = await getTransferAmount(
        ticketPaymentSession.amount,
        promotionCodeAmountOff
    );

    const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: event.currency,
        destination: connectedAccount.connectedAccountId,
        transfer_group: ticketPaymentSession.transferGroupId,
        description: event.eventName,
    });

    await firestoreDatabase()
        .collection(ticketPaymentSessions)
        .doc(ticketPaymentSession.id)
        .update({
            transferId: transfer.id,
            status: 'succeeded',
            paymentDateTime: Timestamp.now(),
        } as TicketPaymentSession);

    const ticket: Ticket = {
        id: v1(),
        eventId: event.id,
        ticketPaymentId: ticketPaymentSession.id,
        isVip: ticketPaymentSession.isVip,
        currency: event.currency,
        price: ticketPaymentSession.amount,
        eventDateTime: Timestamp.fromMillis(event.eventStartDateTime),
        clubName: event.clubName,
        clubId: event.clubId,
        eventName: event.eventName,
        isExpired: false,
    };

    await firestoreDatabase()
        .collection(users)
        .doc(ticketPaymentSession.userId)
        .collection(tickets)
        .doc(ticket.id)
        .set({
            eventId: ticket.eventId,
            ticketPaymentId: ticket.ticketPaymentId,
            isVip: ticket.isVip,
            currency: ticket.currency,
            price: ticket.price,
            eventDateTime: ticket.eventDateTime,
            clubName: ticket.clubName,
            clubId: ticket.clubId,
            eventName: ticket.eventName,
            isExpired: ticket.isExpired,
        } as Ticket);

    return ticket;
}
