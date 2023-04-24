import * as functions from 'firebase-functions';
import {firestoreDatabase} from '../modules/firebase-admin-module';
import {stripe} from '../modules/stripe-module';
import {StripeCustomer} from '../models/stripe-customer';
import {
    clubs,
    promotionCodes,
    reviews,
    selectors,
    stripeCustomers,
    ticketPaymentSessions,
    tickets,
    users,
    vipPaymentSessions,
    wallPhotos,
} from '../constants/collections';
import {Selector} from '../models/selector';
import {deleteQueryBatch} from '../utils/delete-query-batch';
import {getPartnerDocRef} from '../firestore-functions/get-data/get-partner-data';
import {Review} from "../models/review";
import {updateQueryBatch} from "../utils/update-query-batch";

export async function onAccountDeleted(
    event: functions.auth.UserRecord,
    _?: functions.EventContext
) {
    const accountId = event.uid;

    await removeUser(accountId);
    await removeStripeCustomer(accountId);
    await removePartner(accountId);
    await removeSelector(accountId);
}

async function removeUser(userId: string) {
    const userRef = firestoreDatabase().collection(users).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return;

    const ticketsQuery = userRef.collection(tickets).limit(500);

    const promotionCodesQuery = userRef.collection(promotionCodes).limit(500);

    const ticketPaymentSessionsQuery = firestoreDatabase()
        .collection(ticketPaymentSessions)
        .where('userId', '==', userId)
        .where('status', '==', 'succeeded')
        .limit(500);

    const vipPaymentSessionsQuery = firestoreDatabase()
        .collection(vipPaymentSessions)
        .where('userId', '==', userId)
        .where('status', '==', 'succeeded')
        .limit(500);

    const wallPhotosQuery = firestoreDatabase()
        .collection(wallPhotos)
        .where('userId', '==', userId)
        .limit(500);

    const userReviewsDocRefs = firestoreDatabase()
        .collectionGroup(reviews)
        .where('userId', '==', userId)
        .limit(500);

    await deleteQueryBatch(ticketsQuery);
    await deleteQueryBatch(promotionCodesQuery);
    await deleteQueryBatch(ticketPaymentSessionsQuery);
    await deleteQueryBatch(vipPaymentSessionsQuery);
    await deleteQueryBatch(wallPhotosQuery);
    await updateQueryBatch(userReviewsDocRefs, {isUserDeleted: true} as Review);

    await userRef.delete();
}

async function removePartner(partnerId: string) {
    const partnerRef = getPartnerDocRef(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) return;

    await partnerRef.delete();
}

async function removeStripeCustomer(userId: string) {
    const stripeCustomerRef = firestoreDatabase().collection(stripeCustomers).doc(userId);
    const stripeCustomerDoc = await stripeCustomerRef.get();

    if (!stripeCustomerDoc.exists) return;

    const customer = stripeCustomerDoc.data() as StripeCustomer;
    await stripe.customers.del(customer.customerId);

    await stripeCustomerRef.delete();
}

async function removeSelector(selectorId: string) {
    const selectorRef = firestoreDatabase().collection(selectors).doc(selectorId);
    const selectorDoc = await selectorRef.get();

    if (!selectorDoc.exists) return;

    const clubId = (selectorDoc.data() as Selector).clubId;

    const clubSelectorRef = firestoreDatabase()
        .collection(clubs)
        .doc(clubId!)
        .collection(selectors)
        .doc(selectorId);

    await selectorRef.delete();
    await clubSelectorRef.delete();
}
