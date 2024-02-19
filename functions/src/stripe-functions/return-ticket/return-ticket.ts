import * as functions from 'firebase-functions';
import {ReturnTicketRequest} from './return-ticket-request';
import {FunctionsErrorDetails} from '../../errors/functions-error-details';
import {throwUnauthenticatedError} from '../../errors/throw-unauthenticated-error';
import {getTicketDocRef, tryGetTicketData,} from '../../firestore-functions/get-data/get-ticket-data';
import {
    getTicketPaymentSessionDocRef,
    tryGetTicketPaymentSessionData,
} from '../../firestore-functions/get-data/get-ticket-payment-session-data';
import {refundPayment} from '../refund-payment/refund-payment';
import {TicketPaymentSession} from '../../models/ticket-payment-session';
import {Ticket} from '../../models/ticket';
import {firestore} from 'firebase-admin';
import {toJson} from '../../utils/json-utils';
import Timestamp = firestore.Timestamp;

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

    if (ticket.eventStartDateTime < Timestamp.now()) {
        const message = 'Time to return ticket has expired';
        const details: FunctionsErrorDetails = 'return-time-expired';
        throw new functions.https.HttpsError('deadline-exceeded', message, details);
    }

    const ticketPayment = await tryGetTicketPaymentSessionData(ticket.ticketPaymentId);

    await refundPayment({
        paymentIntentId: ticketPayment.id,
    });

    await getTicketPaymentSessionDocRef(ticketPayment.id).update(
        toJson({
            isRefunded: true,
        } as TicketPaymentSession)
    );

    await getTicketDocRef(userId, ticketId).update(toJson({isReturned: true} as Ticket));

    // let returnedRevenue = ticketPayment.revenue;

    // await updateEventOnTicketReturn({
    //     eventId: ticket.eventId,
    //     isVip: ticket.isVip,
    //     vipPaymentSessionId: vipPayment?.id,
    //     ticketPaymentSessionId: ticketPayment.id,
    //     returnedRevenue,
    // });
}
