import { Event } from '../../models/event';
import { getEventDocRef } from '../get-data/get-event-data';
import { updateEventTicketsOnEventCancelation } from '../update-event-tickets/update-event-tickets-on-event-cancelation';
import { updateEventCostsOnEventCancelation } from '../update-event-costs/update-event-costs-on-event-cancelation';

export async function updateEventOnEventCancelation(event: Event): Promise<void> {
    const eventDocRef = getEventDocRef(event.id);

    await updateEventTicketsOnEventCancelation(event);

    await updateEventCostsOnEventCancelation({
        eventId: event.id,
        clubId: event.clubId,
    });

    await eventDocRef.update({
        attending: 0,
    } as Event);
}
