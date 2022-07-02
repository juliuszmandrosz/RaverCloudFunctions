import * as functions from 'firebase-functions';
import { firebaseMessaging, firestoreDatabase } from '../modules/firebase-admin-module';
import { tickets } from '../constants/collections';
import { Event } from '../models/event';
import { tryGetUserData } from '../firestore-functions/get-data/get-user-data';
import { firestore } from 'firebase-admin';
import DocumentSnapshot = firestore.DocumentSnapshot;
import { eventCollection } from '../modules/typesense-module';

export async function onEventUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    const beforeUpdate = change.before.data() as Event;
    const afterUpdate = change.after.data() as Event;
    afterUpdate.id = change.after.id;

    await updateEventInTypesense(afterUpdate);

    if (!beforeUpdate.isCanceled && afterUpdate.isCanceled) {
        await sendCloudMessageWithCanceledEventInfoToTicketHolders(afterUpdate);
        return;
    }

    if (beforeUpdate.eventStartDateTime !== afterUpdate.eventStartDateTime) {
        await sendCloudMessageWithPostponedEventInfoToTicketHolders(afterUpdate);
    }
}

async function updateEventInTypesense(event: Event) {
    await eventCollection.documents(event.id).update(event);
}

async function sendCloudMessageWithCanceledEventInfoToTicketHolders(event: Event) {
    const ticketHolders = await getTicketHolders(event.id);
    for (const user of ticketHolders) {
        const userTokens = user.pushNotificationTokens;
        if (!userTokens || userTokens?.length === 0) continue;
        const title = getCanceledEventCloudMessageTitle(user.locale);
        await firebaseMessaging().sendToDevice(
            userTokens,
            {
                notification: {
                    title,
                    body: event.eventName,
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

async function sendCloudMessageWithPostponedEventInfoToTicketHolders(event: Event) {
    const ticketHolders = await getTicketHolders(event.id);
    for (const user of ticketHolders) {
        const userTokens = user.pushNotificationTokens;
        if (!userTokens || userTokens?.length === 0) continue;
        const title = getPostponedEventCloudMessageTitle(user.locale);
        await firebaseMessaging().sendToDevice(
            userTokens,
            {
                notification: {
                    title,
                    body: event.eventName,
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

async function getTicketHolders(eventId: string) {
    // TODO - add case when user already returned the ticket
    const userTickets = await firestoreDatabase()
        .collectionGroup(tickets)
        .where('eventId', '==', eventId)
        .get();

    return Promise.all(
        userTickets.docs.map(async (ticket) => tryGetUserData(ticket.ref.parent.parent!.id))
    );
}

function getCanceledEventCloudMessageTitle(locale: string) {
    return locale === 'pl'
        ? 'Wydarzenie zostało odwołane, Twój bilet został zwrócony'
        : 'The event has been canceled, your ticket has been refunded';
}

function getPostponedEventCloudMessageTitle(locale: string) {
    return locale === 'pl' ? 'Wydarzenie zostało przełożone' : 'The event has been postponed';
}
