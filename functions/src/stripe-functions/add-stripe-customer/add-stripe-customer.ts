import * as functions from 'firebase-functions';
import { AddStripeCustomerRequest } from './add-stripe-customer-request';
import { stripe } from '../../modules/stripe-module';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { stripeCustomers } from '../../constants/collections';

export async function addStripeCustomer(data: AddStripeCustomerRequest): Promise<void> {
    const userId = data?.userId;
    const userEmail = data?.userEmail;
    const locale = data?.locale ?? 'en';

    if (!userId) {
        const message = 'The function must be called with user id.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!userEmail) {
        const message = 'The function must be called with user email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const customer = await stripe.customers.create({
        email: userEmail,
        preferred_locales: [locale],
    });
    const intent = await stripe.setupIntents.create({
        customer: customer.id,
    });

    await firestoreDatabase().collection(stripeCustomers).doc(userId).set({
        customerId: customer.id,
        setupSecret: intent.client_secret,
    });
}
