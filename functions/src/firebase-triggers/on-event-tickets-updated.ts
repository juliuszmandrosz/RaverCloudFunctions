import * as functions from 'firebase-functions';
import { firebaseMessaging, firestoreDatabase } from '../modules/firebase-admin-module';
import { tickets, users } from '../constants/collections';
import { User } from '../models/user';
import { EventTickets } from '../models/event-tickets';
import { Event } from '../models/event';
import { getEventDocRef, tryGetEventData } from '../firestore-functions/get-data/get-event-data';
import { firestore } from 'firebase-admin';
import DocumentSnapshot = firestore.DocumentSnapshot;
import { getEventFollowers } from '../cloud-messages/get-event-followers';
import { toJson } from '../utils/json-utils';
import { getCurrentTicketPrice } from '../utils/get-current-ticket-price';

export async function onEventTicketsUpdated(
    change: functions.Change<DocumentSnapshot>,
    context: functions.EventContext
) {
    const beforeUpdate = change.before.data() as EventTickets;
    const afterUpdate = change.after.data() as EventTickets;

    if (beforeUpdate.isSoldOut && !afterUpdate.isSoldOut) {
        const eventId = context.params.eventId;
        const event = await tryGetEventData(eventId);
        await sendCloudMessageToEventFollowers(event);
    }

    if (getCurrentTicketPrice(beforeUpdate) !== getCurrentTicketPrice(afterUpdate)) {
        const eventId = context.params.eventId;
        await getEventDocRef(eventId).update(
            toJson({ price: getCurrentTicketPrice(afterUpdate) } as Event)
        );
    }
}

async function sendCloudMessageToEventFollowers(event: Event) {
    const eventFollowers = await getEventFollowers(event.id);
    for (const follower of eventFollowers.docs) {
        if (await checkIfUserAlreadyHasTicket(follower.id, event.id)) continue;
        const user = follower.data() as User;
        const userTokens = user.pushNotificationTokens;
        if (!userTokens || userTokens?.length === 0) continue;
        const title = getCloudMessageTitle(user.locale);
        await firebaseMessaging().sendToDevice(
            userTokens,
            {
                notification: {
                    title,
                    body: event.eventName,
                    imageUrl: event.eventPhotoUrl,
                },
                data: {
                    eventId: event.id,
                },
            },
            {
                priority: 'high',
                contentAvailable: true,
            }
        );
    }
}

async function checkIfUserAlreadyHasTicket(userId: string, eventId: string) {
    const userTicket = await firestoreDatabase()
        .collection(users)
        .doc(userId)
        .collection(tickets)
        .where('eventId', '==', eventId)
        .get();

    return userTicket.docs.length > 0;
}

function getCloudMessageTitle(locale: string) {
    return locale === 'pl'
        ? 'Pojawiły się nowe bilety na wydarzenie!'
        : 'New event tickets are out!';
}
