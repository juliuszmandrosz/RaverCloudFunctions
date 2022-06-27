import * as functions from 'firebase-functions';
import { eventIndex } from '../modules/algolia-module';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { createUpdateClubSalesOnEventEndTask } from '../cloud-tasks/update-club-sales-on-event-end-task/create-update-club-sales-on-event-end-task';
import { Event } from '../models/event';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { firebaseMessaging, firestoreDatabase } from '../modules/firebase-admin-module';
import { users } from '../constants/collections';
import { User } from '../models/user';

export async function onEventAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await addEventToAlgolia(snapshot);
    const event = snapshot.data() as Event;
    event.id = snapshot.id;
    await createUpdateClubSalesTask(event);
    await sendPushNotificationsToClubFollowers(event);
}

async function addEventToAlgolia(snapshot: DocumentSnapshot) {
    const data = snapshot.data()!;
    data.objectID = snapshot.id;
    await eventIndex.saveObject(data);
}

async function createUpdateClubSalesTask(event: Event) {
    await createUpdateClubSalesOnEventEndTask({
        eventId: event.id,
        clubId: event.clubId,
        executesAt: Timestamp.fromMillis(event.eventEndDateTime),
    });
}

async function sendPushNotificationsToClubFollowers(event: Event) {
    const clubFollowers = await firestoreDatabase()
        .collection(users)
        .where('favoriteClubIds', 'array-contains', event.clubId)
        .get();

    for (const follower of clubFollowers.docs) {
        const user = follower.data() as User;
        const userTokens = user.pushNotificationTokens;
        if (!userTokens || userTokens?.length === 0) continue;
        const title =
            user.locale === 'pl'
                ? `Nowe wydarzenie w klubie ${event.clubName}!`
                : `New event at the ${event.clubName} club!`;

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
