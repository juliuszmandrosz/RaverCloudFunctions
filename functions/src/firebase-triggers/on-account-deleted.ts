import * as functions from 'firebase-functions';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { stripe } from '../modules/stripe-module';
import { StripeCustomer } from '../models/stripe-customer';
import {
    partners,
    promotionCodes,
    rewards,
    selectors,
    stripeConnectedAccounts,
    stripeCustomers,
    tickets,
    users,
} from '../constants/collections';
import { StripeConnectedAccount } from '../models/stripe-connected-account';
import { Selector } from '../models/selector';
import { deleteQueryBatch } from '../utils/delete-query-batch';

export async function onAccountDeleted(
    event: functions.auth.UserRecord,
    _?: functions.EventContext
) {
    const accountId = event.uid;

    await removeUser(accountId);
    await removeStripeCustomer(accountId);
    await removePartner(accountId);
    await removeStripeConnectedAccount(accountId);
    await removeSelector(accountId);
}

async function removeUser(userId: string) {
    const userRef = firestoreDatabase().collection(users).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return;

    const ticketsQuery = userRef.collection(tickets).limit(500);

    const promotionCodesQuery = userRef.collection(promotionCodes).limit(500);

    const rewardsQuery = userRef.collection(rewards).limit(500);

    await deleteQueryBatch(ticketsQuery);
    await deleteQueryBatch(promotionCodesQuery);
    await deleteQueryBatch(rewardsQuery);

    await userRef.delete();
}

async function removeStripeConnectedAccount(partnerId: string) {
    const stripeConnectedAccountRef = firestoreDatabase()
        .collection(stripeConnectedAccounts)
        .doc(partnerId);

    const stripeConnectedAccountDoc = await stripeConnectedAccountRef.get();

    if (!stripeConnectedAccountDoc.exists) return;

    const connectedAccount = stripeConnectedAccountDoc.data() as StripeConnectedAccount;
    await stripe.accounts.del(connectedAccount.connectedAccountId);

    await stripeConnectedAccountRef.delete();
}

async function removePartner(partnerId: string) {
    const partnerRef = firestoreDatabase().collection(partners).doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) return;

    const partnerSelectorsQuery = partnerRef.collection(selectors).limit(500);

    // TODO - change
    const selectorsQuery = firestoreDatabase()
        .collection(selectors)
        .where('partnerId', '==', partnerDoc.id)
        .limit(500);

    await deleteQueryBatch(partnerSelectorsQuery);

    await deleteQueryBatch(selectorsQuery);

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
    const partnerSelectorRef = firestoreDatabase()
        .collection(partners)
        .doc(clubId!)
        .collection(selectors)
        .doc(selectorId);

    await selectorRef.delete();
    await partnerSelectorRef.delete();
}
