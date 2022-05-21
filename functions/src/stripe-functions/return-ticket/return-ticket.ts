import * as functions from 'firebase-functions';
import { ReturnTicketRequest } from './return-ticket-request';
import * as moment from 'moment';
import { FunctionsErrorDetails } from '../../errors/functions-error-details';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import {
    getTicketDocRef,
    tryGetTicketData,
} from '../../firestore-functions/get-data/get-ticket-data';
import {
    getTicketPaymentSessionDocRef,
    tryGetTicketPaymentSessionData,
} from '../../firestore-functions/get-data/get-ticket-payment-session-data';
import {
    getVipPaymentSessionDocRef,
    tryGetVipPaymentSession,
} from '../../firestore-functions/get-data/get-vip-payment-session.data';
import { updateEventOnTicketReturn } from '../../firestore-functions/update-event/update-event-on-ticket-return';
import { refundPayment } from '../refund-payment/refund-payment';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { VipPaymentSession } from '../../models/vip-payment-session';
import { Ticket } from '../../models/ticket';

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

    if (ticket.isReturned) {
        const message = 'Ticket is already returned';
        throw new functions.https.HttpsError('permission-denied', message);
    }

    if (!ticket.isReturnable) {
        const message = 'Ticket is not returnable';
        throw new functions.https.HttpsError('permission-denied', message);
    }

    const eventStartDateTime = moment(ticket.eventStartDateTime.toMillis());

    if (eventStartDateTime.isBefore(moment().add(1, 'day'))) {
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

    await getTicketPaymentSessionDocRef(ticketPayment.id).update({
        isRefunded: true,
    } as TicketPaymentSession);

    if (vipPayment) {
        await refundPayment({
            paymentIntentId: vipPayment.id,
            transferId: vipPayment.transferId!,
        });

        await getVipPaymentSessionDocRef(vipPayment.id).update({
            isRefunded: true,
        } as VipPaymentSession);
    }

    await getTicketDocRef(userId, ticketId).update({ isReturned: true } as Ticket);

    await updateEventOnTicketReturn({
        eventId: ticket.eventId,
        isVip: ticket.isVip,
        vipPaymentSessionId: vipPayment?.id,
        ticketPaymentSessionId: ticketPayment.id,
    });
}
