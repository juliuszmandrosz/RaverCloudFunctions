import * as functions from 'firebase-functions';
import { PayOutToPartnerOnEventEndRequest } from './pay-out-to-partner-on-event-end-request';
import { stripe } from '../../modules/stripe-module';
import { getEventTicketsOrReturnNotFound } from '../../firestore-functions/get-data/get-event-tickets-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { partners, payouts } from '../../constants/collections';
import { Payout } from '../../models/payout';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { getConnectedAccountDataOrReturnNotFound } from '../../firestore-functions/get-data/get-connected-account-data';
import { getEventCostsOrReturnNotFound } from '../../firestore-functions/get-data/get-event-costs-data';

export async function payOutToPartnerOnEventEnd(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const payoutToConnectedAccountRequest = request.body as PayOutToPartnerOnEventEndRequest;

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
            amount: clubIncome,
            currency: eventTickets.ticketSales.currency,
            payoutDateTime: Timestamp.now(),
        } as Payout);

    response.send();
}

function getPayoutAmount(clubIncome: number, eventPostponementBalance: number) {
    // TODO - add currency support
    return (clubIncome + eventPostponementBalance) * 100;
}
