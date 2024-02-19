import * as functions from 'firebase-functions';
import {firebaseMessaging, firestoreDatabase} from '../modules/firebase-admin-module';
import {tickets} from '../constants/collections';
import {Event} from '../models/event';
import {tryGetUserData} from '../firestore-functions/get-data/get-user-data';
import {firestore} from 'firebase-admin';
import {eventCollection} from '../modules/typesense-module';
import {updateDocRefsBatch} from '../utils/update-doc-refs-batch';
import {Ticket} from '../models/ticket';
import {eventsIndex} from "../modules/algolia-module";
import {mapDataToAlgolia} from "../utils/map-data-to-algolia";
import DocumentSnapshot = firestore.DocumentSnapshot;
import DocumentData = firestore.DocumentData;

export async function onEventUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    const beforeUpdate = change.before.data() as Event;
    const afterUpdate = change.after.data() as Event;
    afterUpdate.id = change.after.id;

    await updateEventInTypesense(afterUpdate);
    await updateEventInAlgolia(change.after.data()!, change.after.id);

    if (!beforeUpdate.isCanceled && afterUpdate.isCanceled) {
        await sendCloudMessageWithCanceledEventInfoToTicketHolders(afterUpdate);
        return;
    }

    if (beforeUpdate.eventStartDateTime !== afterUpdate.eventStartDateTime) {
        await sendCloudMessageWithPostponedEventInfoToTicketHolders(afterUpdate);
    }

    if (beforeUpdate.eventName !== afterUpdate.eventName) {
        await updateEventNameOnTickets(afterUpdate);
    }
}

async function updateEventInTypesense(event: Event) {
    await eventCollection.documents(event.id).update(event);
}

async function updateEventInAlgolia(data: DocumentData, id: string) {
    const object = mapDataToAlgolia(data, id);
    await eventsIndex.saveObject(object);
}

async function sendCloudMessageWithCanceledEventInfoToTicketHolders(event: Event) {
    const ticketHolders = await getTicketHoldersToSendCancelEventInfo(event.id);
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
    const ticketHolders = await getTicketHoldersToSendPostponeEventInfo(event.id);
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

async function updateEventNameOnTickets(event: Event) {
    const ticketsFromEvent = await firestoreDatabase()
        .collectionGroup(tickets)
        .where('eventId', '==', event.id)
        .get();

    const ticketDocRefs = ticketsFromEvent.docs.map((doc) => doc.ref);

    await updateDocRefsBatch(ticketDocRefs, {eventName: event.eventName} as Ticket);
}

async function getTicketHoldersToSendPostponeEventInfo(eventId: string) {
    const userTickets = await firestoreDatabase()
        .collectionGroup(tickets)
        .where('eventId', '==', eventId)
        .where('isReturned', '==', false)
        .get();

    return Promise.all(
        userTickets.docs.map(async (ticket) => tryGetUserData(ticket.ref.parent.parent!.id))
    );
}

async function getTicketHoldersToSendCancelEventInfo(eventId: string) {
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
