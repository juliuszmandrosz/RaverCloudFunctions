import * as functions from 'firebase-functions';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { stripeCustomers } from '../constants/collections';
import { StripeCustomer } from '../models/stripe-customer';

export async function getStripeCustomerIdFromContext(
    context: functions.https.CallableContext
): Promise<string> {
    const customer = await firestoreDatabase()
        .collection(stripeCustomers)
        .doc(context.auth!.uid)
        .get();

    return (customer.data() as StripeCustomer).customerId;
}
