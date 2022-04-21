import * as functions from "firebase-functions";
import {events, tickets} from "../../constants/collections";
import {vipMaxPrice, vipPriceMultiplier} from "../../constants/remote-config-params";
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {getParameterFromRemoteConfig} from "../../utils/remote-config-utils";
import {GetVipPriceRequest} from "./get-vip-price-request";
import {Event} from "../../models/event";
import {Ticket} from "../../models/ticket";
import {throwInvalidEventError} from "../../errors/throw-invalid-event-error";


export async function getVipPrice(
    data: GetVipPriceRequest,
    _?: functions.https.CallableContext
): Promise<number> {
    const eventId = data?.eventId;
    const ticketId = data?.ticketId;

    if (!eventId && !ticketId) {
        const message = 'The function must be called with event id or ticket id.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const price = await getOriginalPrice(eventId, ticketId);
    const multiplier = await getVipPriceMultiplier();
    const maxPrice = await getVipMaxPrice();
    return price <= maxPrice ? price * (multiplier - 1) : maxPrice;
}

async function getOriginalPrice(eventId?: string, ticketId?: string) {
    return eventId ? getEventPrice(eventId) : getTicketPrice(ticketId!);
}

async function getEventPrice(eventId: string) {
    const eventDoc = await firestoreDatabase().collection(events).doc(eventId).get();
    if (!eventDoc.exists) {
        throwInvalidEventError();
    }
    const event = eventDoc.data() as Event;
    return event.price;
}

async function getTicketPrice(ticketId: string) {
    const doc = await firestoreDatabase().collection(tickets).doc(ticketId).get();
    if (!doc.exists) {
        const message = 'Ticket with given id does not exists.';
        throw new functions.https.HttpsError('not-found', message);
    }
    const ticket = doc.data() as Ticket;
    return ticket.price;
}

async function getVipPriceMultiplier() {
    const multiplier = await getParameterFromRemoteConfig(vipPriceMultiplier);
    return parseInt(multiplier);
}

async function getVipMaxPrice() {
    const maxPrice = await getParameterFromRemoteConfig(vipMaxPrice);
    return parseInt(maxPrice);
}