import { tryGetConnectedAccountData } from '../../firestore-functions/get-data/get-connected-account-data';
import { tryGetEventCostsData } from '../../firestore-functions/get-data/get-event-costs-data';
import { Event } from '../../models/event';
import { tryGetEventPayoutTaskData } from '../../firestore-functions/get-data/get-event-payout-task-data';
import { createPayout } from './create-payout';
import { getPayoutAmount } from './get-payout-amount';
import { cancelPayoutTask } from './cancel-payout-task';

export async function payoutToPartnerInstantlyOnEventCancelation(event: Event): Promise<void> {
    const connectedAccount = await tryGetConnectedAccountData(event.clubId);

    const eventCosts = await tryGetEventCostsData(event.clubId, event.id);

    const eventPayoutTask = await tryGetEventPayoutTaskData(event.id);

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
