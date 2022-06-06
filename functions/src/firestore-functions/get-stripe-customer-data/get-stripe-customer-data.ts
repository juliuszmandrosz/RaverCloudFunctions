import { stripeCustomers } from '../../constants/collections';
import { firestoreDatabase } from '../../modules/firebase-admin-module';

export function getStripeCustomerDocRef(accountId: string) {
    return firestoreDatabase().collection(stripeCustomers).doc(accountId);
}
