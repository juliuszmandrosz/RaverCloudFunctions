import * as functions from 'firebase-functions';
import { firebaseMessaging, firestoreDatabase } from '../modules/firebase-admin-module';
import { tickets, users } from '../constants/collections';
import { User } from '../models/user';
import { EventTickets } from '../models/event-tickets';
import { Event } from '../models/event';
import { tryGetEventData } from '../firestore-functions/get-data/get-event-data';
import { firestore } from 'firebase-admin';
import DocumentSnapshot = firestore.DocumentSnapshot;

export async function onEventTicketsUpdated(
    change: functions.Change<DocumentSnapshot>,
    context: functions.EventContext
) {
    const beforeUpdate = change.before.data() as EventTickets;
    const afterUpdate = change.after.data() as EventTickets;

    if (beforeUpdate.isSoldOut && !afterUpdate.isSoldOut) {
        const eventId = context.params.eventId;
        const event = await tryGetEventData(eventId);
        await sendPushNotificationsToEventFollowers(event);
    }
}

async function sendPushNotificationsToEventFollowers(event: Event) {
    const eventFollowers = await getEventFollowers(event.id);

    for (const follower of eventFollowers.docs) {
        if (await checkIfUserAlreadyHasTicket(follower.id, event.id)) continue;
        const user = follower.data() as User;
        const userTokens = user.pushNotificationTokens;
        if (!userTokens || userTokens?.length === 0) continue;
        const title =
            user.locale === 'pl'
                ? 'Pojawiły się nowe bilety na wydarzenie!'
                : 'New event tickets are out!';

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

async function getEventFollowers(eventId: string) {
    return firestoreDatabase()
        .collection(users)
        .where('favoriteEventIds', 'array-contains', eventId)
        .get();
}
