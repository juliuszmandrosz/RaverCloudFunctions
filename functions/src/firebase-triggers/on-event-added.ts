import * as functions from 'firebase-functions';
import { createUpdateClubSalesOnEventEndTask } from '../cloud-tasks/update-club-sales-on-event-end-task/create-update-club-sales-on-event-end-task';
import { Event } from '../models/event';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { firebaseMessaging } from '../modules/firebase-admin-module';
import { User } from '../models/user';
import { getClubFollowers } from '../cloud-messages/get-club-followers';
import { eventCollection } from '../modules/typesense-module';

export async function onEventAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const event = snapshot.data() as Event;
    event.id = snapshot.id;

    await addEventToTypesense(event);
    await createUpdateClubSalesTask(event);
    await sendCloudMessageToClubFollowers(event);
}

async function addEventToTypesense(event: Event) {
    await eventCollection.documents().create(event);
}

async function createUpdateClubSalesTask(event: Event) {
    await createUpdateClubSalesOnEventEndTask({
        eventId: event.id,
        clubId: event.clubId,
        executesAt: Timestamp.fromMillis(event.eventEndDateTime),
    });
}

async function sendCloudMessageToClubFollowers(event: Event) {
    const clubFollowers = await getClubFollowers(event.clubId);

    for (const follower of clubFollowers.docs) {
        const user = follower.data() as User;
        const userTokens = user.pushNotificationTokens;
        if (!userTokens || userTokens?.length === 0) continue;
        const title = getCloudMessageTitle(user.locale, event.clubName);
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

function getCloudMessageTitle(locale: string, clubName: string) {
    return locale === 'pl'
        ? `Nowe wydarzenie w klubie ${clubName}!`
        : `New event at the ${clubName} club!`;
}
