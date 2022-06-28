import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { users } from '../../constants/collections';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { User } from '../../models/user';
import * as functions from 'firebase-functions';

const errorMessage = 'User with given id does not exists';

export async function tryGetUserData(userId: string, transaction?: Transaction) {
    const userDoc = await getUserDoc(userId, transaction);

    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return getUserData(userDoc, userId);
}

export function getUserDocRef(userId: string) {
    return firestoreDatabase().collection(users).doc(userId);
}

async function getUserDoc(eventId: string, transaction?: Transaction) {
    const userDocRef = getUserDocRef(eventId);
    return transaction ? transaction.get(userDocRef) : userDocRef.get();
}

function getUserData(userDoc: DocumentSnapshot, userId: string) {
    const user = userDoc.data() as User;
    user.id = userId;
    return user;
}
