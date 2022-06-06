import * as functions from 'firebase-functions';
import { firestoreDatabase } from '../../../modules/firebase-admin-module';
import { users } from '../../../constants/collections';
import { setUserClaim } from '../../../auth-functions/set-claim/set-user-claim';
import { addStripeCustomer } from '../../../stripe-functions/add-stripe-customer/add-stripe-customer';
import { AddUserRequest } from './add-user-request';
import { User } from '../../../models/user';

export async function addUser(
    data: AddUserRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        const message = 'The function must be called while authenticated.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }

    const userId = context.auth.token.uid;
    const email = context.auth.token.email!;
    const locale = data?.locale;

    const userDocRef = firestoreDatabase().collection(users).doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
        const message = 'User with given id already exists';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await setUserClaim({ email });

    await addStripeCustomer({ userId: userId, userEmail: email, locale });

    await userDocRef.set({
        email,
        favoriteEventIds: [],
        favoriteClubIds: [],
        attendance: {},
        username: '',
    } as User);
}
