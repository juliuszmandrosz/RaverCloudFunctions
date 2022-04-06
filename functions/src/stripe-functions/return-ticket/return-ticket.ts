import * as functions from 'firebase-functions'
import {ReturnTicketRequest} from "./return-ticket-request";
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {stripeCustomers, ticketPayments, tickets, users} from "../../constants/collections";
import {TicketPayment} from "../../models/ticket-payment";
import * as moment from "moment";
import {FunctionsErrorDetails} from "../../errors/functions-error-details";
import {stripe} from "../../modules/stripe-module";
import {throwUnauthenticatedError} from "../../errors/throw-unauthenticated-error";


export async function returnTicket(
    data: ReturnTicketRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const ticketPaymentId = data?.ticketPaymentId;
    const ticketId = data?.ticketId;

    if (!ticketPaymentId) {
        const message = 'The function must be called with ticket payment id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!ticketId) {
        const message = 'The function must be called with ticket id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const userId = context.auth!.uid;

    await checkIfTicketExists(userId, ticketId);

    const ticketPayment = await getTicketPaymentData(userId, ticketPaymentId);

    const eventDateTime = moment(ticketPayment.eventDateTime.toMillis());

    if (eventDateTime.isBefore(moment().add(1, 'day'))) {
        const message = 'Time to return the ticket has expired';
        const details: FunctionsErrorDetails = 'return-time-expired';
        throw new functions.https.HttpsError('deadline-exceeded', message, details);
    }

    await stripe.transfers.createReversal(ticketPayment.transferId);
    await stripe.refunds.create({payment_intent: ticketPayment.paymentIntentId});

    await deleteTicket(userId, ticketId);
}

async function getTicketPaymentData(userId: string, ticketPaymentId: string) {
    const ticketPaymentDoc = await firestoreDatabase()
        .collection(stripeCustomers).doc(userId)
        .collection(ticketPayments).doc(ticketPaymentId)
        .get();

    if (!ticketPaymentDoc.exists) {
        const message = 'Ticket payment with given id does not exists';
        throw new functions.https.HttpsError('not-found', message);
    }

    return ticketPaymentDoc.data() as TicketPayment;
}

async function checkIfTicketExists(userId: string, ticketId: string) {
    const ticketDoc = await firestoreDatabase()
        .collection(users).doc(userId)
        .collection(tickets).doc(ticketId)
        .get();

    if (!ticketDoc.exists) {
        const message = 'Ticket with given id does not exists';
        throw new functions.https.HttpsError('not-found', message);
    }
}

async function deleteTicket(userId: string, ticketId: string) {
    await firestoreDatabase()
        .collection(users).doc(userId)
        .collection(tickets).doc(ticketId)
        .delete();
}


