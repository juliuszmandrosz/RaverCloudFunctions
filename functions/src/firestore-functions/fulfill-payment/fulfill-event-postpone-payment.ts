import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { tasksClient } from '../../modules/cloud-tasks-module';
import { getEventDataOrReturnNotFound, getEventDocRef } from '../get-data/get-event-data';
import {
    getPostponeEventPaymentSessionDataOrUndefined,
    getPostponeEventPaymentSessionDocRef,
} from '../get-data/get-postpone-event-payment-session';
import { Event } from '../../models/event';
import { updateEventCostsOnEventPostpone } from '../update-event-costs/update-event-costs-on-event-postpone';
import { getEventCostsOrReturnNotFound } from '../get-data/get-event-costs-data';
import { PostponeEventPaymentSession } from '../../models/postpone-event-payment-session';
import { markTicketsAsReturnable } from '../update-tickets/mark-tickets-as-returnable';

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

    const eventDocRef = getEventDocRef(event.id);

    const postponeEventSessionDocRef = getPostponeEventPaymentSessionDocRef(
        postponeEventPaymentSession.id
    );

    await eventDocRef.update({
        isCurrentlyPostponing: false,
        eventStartDateTime: postponeEventPaymentSession.newEventStartDateTime.toMillis(),
        eventEndDateTime: postponeEventPaymentSession.newEventEndDateTime.toMillis(),
    } as Event);

    await postponeEventSessionDocRef.update({
        status: 'succeeded',
        paymentDateTime: Timestamp.now(),
    } as PostponeEventPaymentSession);

    const eventCosts = await getEventCostsOrReturnNotFound(event.clubId, event.id, response);

    if (!eventCosts) return;

    await updateEventCostsOnEventPostpone({
        eventId: event.id,
        clubId: event.clubId,
        response,
    });

    await markTicketsAsReturnable(event.id);
}
