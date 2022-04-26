import * as functions from 'firebase-functions';
import { ReturnTicketRequest } from './return-ticket-request';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { tickets, users } from '../../constants/collections';
import * as moment from 'moment';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { stripe } from '../../modules/stripe-module';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { tryGetTicketData } from '../../firestore-functions/get-data/get-ticket-data';
import { VipPaymentSession } from '../../models/vip-payment-session';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { tryGetTicketPaymentSessionData } from '../../firestore-functions/get-data/get-ticket-payment-session-data';
import { tryGetVipPaymentSession } from '../../firestore-functions/get-data/get-vip-payment-session.data';
import { updateEventOnTicketReturn } from '../../firestore-functions/update-event/update-event-on-ticket-return';

export async function returnTicket(
    data: ReturnTicketRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const ticketId = data?.ticketId;

    if (!ticketId) {
        const message = 'The function must be called with ticket id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const userId = context.auth!.uid;
    const ticket = await tryGetTicketData(userId, ticketId);
    const eventDateTime = moment(ticket.eventDateTime.toMillis());

    if (eventDateTime.isBefore(moment().add(1, 'day'))) {
        const message = 'Time to return ticket has expired';
        const details: FunctionsErrorDetails = 'return-time-expired';
        throw new functions.https.HttpsError('deadline-exceeded', message, details);
    }

    const ticketPayment = await tryGetTicketPaymentSessionData(ticket.ticketPaymentId);
    const vipPayment = ticket.vipPaymentId
        ? await tryGetVipPaymentSession(ticket.vipPaymentId)
        : null;

    await refundTicketPayment(ticketPayment);

    if (vipPayment) {
        await refundVipPayment(vipPayment);
    }

    await deleteTicket(userId, ticketId);

    await updateEventOnTicketReturn(ticket.eventId, ticket.isVip);
}

async function deleteTicket(userId: string, ticketId: string) {
    await firestoreDatabase()
        .collection(users)
        .doc(userId)
        .collection(tickets)
        .doc(ticketId)
        .delete();
}

async function refundTicketPayment(ticketPaymentSession: TicketPaymentSession) {
    await stripe.transfers.createReversal(ticketPaymentSession.transferId!);
    await stripe.refunds.create({ payment_intent: ticketPaymentSession.id });
}

async function refundVipPayment(vipPaymentSession: VipPaymentSession) {
    await stripe.transfers.createReversal(vipPaymentSession.transferId!);
    await stripe.refunds.create({ payment_intent: vipPaymentSession.id });
}
