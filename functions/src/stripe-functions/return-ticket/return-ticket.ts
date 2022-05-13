import * as functions from 'firebase-functions';
import { ReturnTicketRequest } from './return-ticket-request';
import * as moment from 'moment';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { tryGetTicketData } from '../../firestore-functions/get-data/get-ticket-data';
import { tryGetTicketPaymentSessionData } from '../../firestore-functions/get-data/get-ticket-payment-session-data';
import { tryGetVipPaymentSession } from '../../firestore-functions/get-data/get-vip-payment-session.data';
import { updateEventOnTicketReturn } from '../../firestore-functions/update-event/update-event-on-ticket-return';
import { refundPayment } from '../refund-payment/refund-payment';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { tickets, users } from '../../constants/collections';

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

    if (!ticket.isReturnable) {
        const message = 'Ticket is not returnable';
        throw new functions.https.HttpsError('permission-denied', message);
    }

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

    await refundPayment({
        paymentIntentId: ticketPayment.id,
        transferId: ticketPayment.transferId!,
    });

    if (vipPayment) {
        await refundPayment({
            paymentIntentId: vipPayment.id,
            transferId: vipPayment.transferId!,
        });
    }

    await deleteTicket(userId, ticketId);

    await updateEventOnTicketReturn({
        eventId: ticket.eventId,
        isVip: ticket.isVip,
        vipPaymentSessionId: vipPayment?.id,
        ticketPaymentSessionId: ticketPayment.id,
    });
}

async function deleteTicket(userId: string, ticketId: string) {
    await firestoreDatabase()
        .collection(users)
        .doc(userId)
        .collection(tickets)
        .doc(ticketId)
        .delete();
}
