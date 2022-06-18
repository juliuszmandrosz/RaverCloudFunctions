import { Event } from '../../models/event';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { cancelUpdateClubSalesTask } from './cancel-update-club-sales-task';
import { createUpdateClubSalesOnEventEndTask } from './create-update-club-sales-on-event-end-task';

interface ExtendUpdateClubSalesTaskOnEventPostponeParams {
    event: Event;
    newEventEndDateTime: Timestamp;
}

export async function extendUpdateClubSalesTaskOnEventPostpone({
    event,
    newEventEndDateTime,
}: ExtendUpdateClubSalesTaskOnEventPostponeParams): Promise<void> {
    await cancelUpdateClubSalesTask(event.id);

    await createUpdateClubSalesOnEventEndTask({
        eventId: event.id,
        executesAt: newEventEndDateTime,
        clubId: event.clubId,
    });
}
