import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {events} from "../../constants/collections";
import {throwInvalidEventError} from "../../errors/throw-invalid-event-error";
import {Event} from "../../models/event";

export async function getEventData(eventId: string) {
    const eventDoc = await firestoreDatabase()
        .collection(events).doc(eventId)
        .get();

    if (!eventDoc.exists) {
        throwInvalidEventError();
    }

    const event = eventDoc.data() as Event;
    event.id = eventId;

    return event;
}

