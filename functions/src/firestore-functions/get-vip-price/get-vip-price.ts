import * as functions from "firebase-functions";
import {events} from "../../constants/collections";
import {vipMaxPrice, vipPriceMultiplier} from "../../constants/remote-config-params";
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {getParameterFromRemoteConfig} from "../../utils/remote-config-utils";
import {GetVipPriceRequest} from "./get-vip-price-request";
import {Event} from "../../models/event";
import {throwInvalidEventError} from "../../errors/throw-invalid-event-error";


export async function getVipPrice(
    data: GetVipPriceRequest,
    _?: functions.https.CallableContext
): Promise<number> {
    const eventId = data?.eventId;
    const eventPrice = data?.eventPrice;

    if (!eventId && !eventPrice) {
        const message = 'The function must be called with event id or event price';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const price = eventPrice ?? await getEventPrice(eventId!)
    const multiplier = await getVipPriceMultiplier();
    const maxPrice = await getVipMaxPrice();
    return price <= maxPrice ? price * (multiplier - 1) : maxPrice;
}


async function getEventPrice(eventId: string) {
    const eventDoc = await firestoreDatabase()
        .collection(events).doc(eventId)
        .get();

    if (!eventDoc.exists) {
        throwInvalidEventError();
    }
    const event = eventDoc.data() as Event;
    return event.price;
}


async function getVipPriceMultiplier() {
    const multiplier = await getParameterFromRemoteConfig(vipPriceMultiplier);
    return parseInt(multiplier);
}

async function getVipMaxPrice() {
    const maxPrice = await getParameterFromRemoteConfig(vipMaxPrice);
    return parseInt(maxPrice);
}