import { Event } from '../../models/event';
import { getEventDocRef } from '../get-data/get-event-data';
import { updateEventTicketsOnEventCancelation } from '../update-event-tickets/update-event-tickets-on-event-cancelation';
import { updateEventCostsOnEventCancelation } from '../update-event-costs/update-event-costs-on-event-cancelation';
import * as functions from 'firebase-functions';

interface UpdateEventOnEventCancelationParams {
    event: Event;
    response?: functions.Response;
}

export async function updateEventOnEventCancelation({
    event,
    response,
}: UpdateEventOnEventCancelationParams): Promise<void> {
    const eventDocRef = getEventDocRef(event.id);

    await updateEventTicketsOnEventCancelation(event);

    await updateEventCostsOnEventCancelation({ eventId: event.id, clubId: event.clubId, response });

    await eventDocRef.update({
        attending: 0,
    } as Event);
}
