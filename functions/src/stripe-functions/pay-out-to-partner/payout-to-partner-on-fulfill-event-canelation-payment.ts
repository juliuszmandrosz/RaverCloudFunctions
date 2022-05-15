import { getConnectedAccountDataOrReturnNotFound } from '../../firestore-functions/get-data/get-connected-account-data';
import { getEventCostsOrReturnNotFound } from '../../firestore-functions/get-data/get-event-costs-data';
import { Event } from '../../models/event';
import { getEventPayoutTaskDataOrReturnNotFound } from '../../firestore-functions/get-data/get-event-payout-task-data';
import * as functions from 'firebase-functions';
import { createPayout } from './create-payout';
import { getPayoutAmount } from './get-payout-amount';
import { cancelPayoutTask } from '../../cloud-tasks/payout-to-partner-task/cancel-payout-task';

export async function payoutToPartnerOnFulfillEventCancelationPayment(
    event: Event,
    response: functions.Response
): Promise<void> {
    const connectedAccount = await getConnectedAccountDataOrReturnNotFound(event.clubId, response);

    if (!connectedAccount) return;

    const eventCosts = await getEventCostsOrReturnNotFound(event.clubId, event.id, response);

    if (!eventCosts) return;

    const eventPayoutTask = await getEventPayoutTaskDataOrReturnNotFound(event.id, response);

    if (!eventPayoutTask) return;

    await cancelPayoutTask({ payoutTaskId: eventPayoutTask.payoutTaskId, eventId: event.id });

    const payoutAmount = getPayoutAmount({
        eventPostponeBalance: eventCosts.eventPostponeBalance,
    });

    await createPayout({
        amount: payoutAmount,
        partnerId: event.clubId,
        currency: eventCosts.currency,
        connectedAccountId: connectedAccount.connectedAccountId,
    });
}
