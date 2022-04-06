import * as functions from 'firebase-functions'
import {stripe} from '../modules/stripe-module';
import {stripeCustomers} from "../constants/collections";
import {firestoreDatabase} from "../modules/firebase-admin-module";

export async function onUserCreated(
    event: functions.auth.UserRecord,
    _: functions.EventContext
) {
    const customer = await stripe.customers.create({email: event.email});
    const intent = await stripe.setupIntents.create({
        customer: customer.id,
    });
    await firestoreDatabase().collection(stripeCustomers).doc(event.uid).set({
        customerId: customer.id,
        setupSecret: intent.client_secret,
    });
}