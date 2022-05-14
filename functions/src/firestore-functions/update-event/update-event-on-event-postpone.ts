import { Event } from '../../models/event';
import { getEventDocRef } from '../get-data/get-event-data';
import { updateEventCostsOnPartnerPayment } from '../update-event-costs/update-event-costs-on-partner-payment';
import * as functions from 'firebase-functions';

interface UpdateEventOnEventPostponeParams {
    event: Event;
    newEventStartTimestamp: number;
    newEventEndTimestamp: number;
    response?: functions.Response;
}

export async function updateEventOnEventPostpone({
    event,
    newEventStartTimestamp,
    newEventEndTimestamp,
    response,
}: UpdateEventOnEventPostponeParams): Promise<void> {
    await getEventDocRef(event.id).update({
        isBeingPostponed: false,
        eventStartDateTime: newEventStartTimestamp,
        eventEndDateTime: newEventEndTimestamp,
    } as Event);

    await updateEventCostsOnPartnerPayment({
        eventId: event.id,
        clubId: event.clubId,
        response,
    });
}
