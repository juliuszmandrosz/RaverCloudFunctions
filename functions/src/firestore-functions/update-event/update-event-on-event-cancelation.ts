import { Event } from '../../models/event';
import { getEventDocRef } from '../get-data/get-event-data';
import { updateEventTicketsOnEventCancelation } from '../update-event-tickets/update-event-tickets-on-event-cancelation';
import { updateEventCostsOnPartnerPayment } from '../update-event-costs/update-event-costs-on-partner-payment';

export async function updateEventOnEventCancelation(event: Event): Promise<void> {
    const eventDocRef = getEventDocRef(event.id);

    await updateEventTicketsOnEventCancelation(event);

    await updateEventCostsOnPartnerPayment({
        eventId: event.id,
        clubId: event.clubId,
    });

    await eventDocRef.update({
        attending: 0,
    } as Event);
}
