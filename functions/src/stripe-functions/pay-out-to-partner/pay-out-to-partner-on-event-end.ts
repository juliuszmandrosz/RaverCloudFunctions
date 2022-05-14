import * as functions from 'firebase-functions';
import { PayOutToPartnerRequest } from './pay-out-to-partner-request';
import { stripe } from '../../modules/stripe-module';
import { getEventTicketsOrReturnNotFound } from '../../firestore-functions/get-data/get-event-tickets-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { partners, payouts } from '../../constants/collections';
import { Payout } from '../../models/payout';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { getConnectedAccountDataOrReturnNotFound } from '../../firestore-functions/get-data/get-connected-account-data';
import { getEventCostsOrReturnNotFound } from '../../firestore-functions/get-data/get-event-costs-data';
import { EventPayoutTask } from '../../models/event-payout-task';
import { getEventPayoutTaskDocRef } from '../../firestore-functions/get-data/get-event-payout-task-data';

export async function payOutToPartnerOnEventEnd(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const payoutToConnectedAccountRequest = request.body as PayOutToPartnerRequest;

    const event = payoutToConnectedAccountRequest.event;

    const eventTickets = await getEventTicketsOrReturnNotFound(event.clubId, event.id, response);

    if (!eventTickets) return;

    const clubIncome = eventTickets.ticketSales.clubIncome;

    if (!clubIncome) {
        response.send(200);
        return;
    }

    const connectedAccount = await getConnectedAccountDataOrReturnNotFound(event.clubId, response);

    if (!connectedAccount) return;

    const eventCosts = await getEventCostsOrReturnNotFound(event.clubId, event.id, response);

    if (!eventCosts) return;

    const payout = await stripe.payouts.create(
        {
            amount: getPayoutAmount(clubIncome, eventCosts.eventPostponeBalance),
            currency: eventTickets.ticketSales.currency,
        },
        { stripeAccount: connectedAccount.connectedAccountId }
    );

    await firestoreDatabase()
        .collection(partners)
        .doc(event.clubId)
        .collection(payouts)
        .doc(payout.id)
        .set({
            amount: clubIncome + eventCosts.eventPostponeBalance,
            currency: eventTickets.ticketSales.currency,
            payoutDateTime: Timestamp.now(),
        } as Payout);

    await getEventPayoutTaskDocRef(event.id).update({ isCompleted: true } as EventPayoutTask);

    response.send();
}

function getPayoutAmount(clubIncome: number, eventPostponementBalance: number) {
    // TODO - add currency support
    return (clubIncome + eventPostponementBalance) * 100;
}
