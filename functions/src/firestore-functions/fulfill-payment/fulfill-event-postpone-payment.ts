import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { tasksClient } from '../../modules/cloud-tasks-module';
import { getEventDataOrReturnNotFound } from '../get-data/get-event-data';
import {
    getPostponeEventPaymentSessionDataOrUndefined,
    getPostponeEventPaymentSessionDocRef,
} from '../get-data/get-postpone-event-payment-session';
import { getEventCostsOrReturnNotFound } from '../get-data/get-event-costs-data';
import { PostponeEventPaymentSession } from '../../models/postpone-event-payment-session';
import { updateTicketsOnEventPostpone } from '../update-tickets/update-tickets-on-event-postpone';
import { updateEventOnEventPostpone } from '../update-event/update-event-on-event-postpone';
import { extendPayoutTaskOnFulfillEventPostponePayment } from '../../cloud-tasks/payout-to-partner-task/extend-payout-task-on-fulfill-event-postpone-payment';

export async function fulfillEventPostponePayment(
    paymentSessionId: string,
    response: functions.Response
): Promise<void> {
    const postponeEventPaymentSession = await getPostponeEventPaymentSessionDataOrUndefined(
        paymentSessionId
    );

    if (!postponeEventPaymentSession) return;

    await tasksClient.deleteTask({
        name: postponeEventPaymentSession.cancelEventPostponeTaskId,
    });

    const event = await getEventDataOrReturnNotFound(postponeEventPaymentSession.eventId, response);

    if (!event) return;

    const postponeEventSessionDocRef = getPostponeEventPaymentSessionDocRef(
        postponeEventPaymentSession.id
    );

    await postponeEventSessionDocRef.update({
        status: 'succeeded',
        paymentDateTime: Timestamp.now(),
    } as PostponeEventPaymentSession);

    const eventCosts = await getEventCostsOrReturnNotFound(event.clubId, event.id, response);

    if (!eventCosts) return;

    await updateEventOnEventPostpone({
        event,
        newEventStartTimestamp: postponeEventPaymentSession.newEventStartDateTime.toMillis(),
        newEventEndTimestamp: postponeEventPaymentSession.newEventEndDateTime.toMillis(),
        hasPartnerPaid: true,
        response,
    });

    await updateTicketsOnEventPostpone({
        eventId: event.id,
        newEventStartDateTime: postponeEventPaymentSession.newEventStartDateTime,
        newEventEndDateTime: postponeEventPaymentSession.newEventEndDateTime,
    });

    await extendPayoutTaskOnFulfillEventPostponePayment({
        event,
        newEventEndDateTime: postponeEventPaymentSession.newEventEndDateTime,
        response,
    });
}
