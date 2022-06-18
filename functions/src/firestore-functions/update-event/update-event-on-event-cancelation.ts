import { Event } from '../../models/event';
import { getEventDocRef } from '../get-data/get-event-data';
import { updateEventTicketsOnEventCancelation } from '../update-event-tickets/update-event-tickets-on-event-cancelation';

interface UpdateEventOnEventCancelationParams {
    event: Event;
}

export async function updateEventOnEventCancelation({
    event,
}: UpdateEventOnEventCancelationParams): Promise<void> {
    const eventDocRef = getEventDocRef(event.id);

    await updateEventTicketsOnEventCancelation(event);

    await eventDocRef.update({
        attending: 0,
    } as Event);
}
