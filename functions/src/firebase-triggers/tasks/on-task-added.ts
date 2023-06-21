import * as functions from 'firebase-functions';
import {firebaseMessaging, firestoreDatabase} from "../../modules/firebase-admin-module";
import {participants, rooms, users} from "../../constants/collections";
import {User} from "../../models/user";
import {TimeTask} from "../../models/time-task";

export async function onTaskAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const task = snapshot.data() as TimeTask;
    task.id = snapshot.id;

    await sendCloudMessageToEventParticipants(task);
}


async function sendCloudMessageToEventParticipants(task: TimeTask) {
    const participants = await getEventParticipants(task.eventId);
    for (const participant of participants.docs) {
        const userDoc = await firestoreDatabase().collection(users).doc(participant.id).get();
        if (!userDoc.exists) continue;
        const user = userDoc.data() as User;
        user.id = userDoc.id;
        const userTokens = user.pushNotificationTokens;
        if (!userTokens || userTokens?.length === 0) continue;
        const title = getCloudMessageTitle(user.locale, task.eventName);
        const body = user.locale === 'pl' ? task.descriptionPl : task.descriptionEn;
        await firebaseMessaging().sendToDevice(
            userTokens,
            {
                notification: {
                    title,
                    body: body,
                },
                data: {
                    taskId: task.id,
                },
            },
            {
                priority: 'high',
                contentAvailable: true,
            }
        );
    }
}


async function getEventParticipants(eventId: string) {
    return firestoreDatabase().collection(rooms).doc(eventId).collection(participants).get();
}

function getCloudMessageTitle(locale: string, eventName: string) {
    return locale === 'pl'
        ? `Nowe zadanie na wydarzeniu - ${eventName}!`
        : `New task at the event - ${eventName}!`;
}

