import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventDocRef, tryGetEventData } from '../get-data/get-event-data';
import { updateEventTicketsOnCreateEventCancelationPaymentSheet } from '../update-event-tickets/update-event-tickets-on-create-event-cancelation-payment-sheet';
import { Event } from '../../models/event';
import { getCurrentOrLastPool } from '../../utils/event-tickets-utils/get-current-or-last-pool';

interface UpdateEventOnCreateEventCancelationPaymentSheetParams {
    eventId: string;
    ticketsSold: number;
    vipsSold: number;
    totalRevenue: number;
}

/// Returns event before update
export async function updateEventOnCreateEventCancelationPaymentSheet({
    eventId,
    ticketsSold,
    vipsSold,
    totalRevenue,
}: UpdateEventOnCreateEventCancelationPaymentSheetParams): Promise<Event> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventDocRef = getEventDocRef(eventId);

        const event = await tryGetEventData(eventId, transaction);

        const eventTickets = await updateEventTicketsOnCreateEventCancelationPaymentSheet({
            ticketsSold,
            vipsSold,
            totalRevenue,
            event,
        });

        const currentPoolPrice = getCurrentOrLastPool(eventTickets.ticketPools).ticketPrice;

        transaction.update(eventDocRef, {
            attending: event.attending - ticketsSold,
            price: currentPoolPrice,
        } as Event);

        return event;
    });
}
