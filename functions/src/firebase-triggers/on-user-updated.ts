import * as functions from 'firebase-functions';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { reviews } from '../constants/collections';
import { firestore } from 'firebase-admin';
import DocumentSnapshot = firestore.DocumentSnapshot;
import { updateDocRefsBatch } from '../utils/update-doc-refs-batch';
import { User } from '../models/user';
import { Review } from '../models/review';

export async function onUserUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    const beforeUpdate = change.before.data() as User;
    const afterUpdate = change.after.data() as User;
    afterUpdate.id = change.after.id;

    if (beforeUpdate.username !== afterUpdate.username) {
        await updateUsernameInReviews(afterUpdate);
    }
}

async function updateUsernameInReviews(user: User) {
    const userReviews = await firestoreDatabase()
        .collectionGroup(reviews)
        .where('userId', '==', user.id)
        .get();

    const reviewDocRefs = userReviews.docs.map((doc) => doc.ref);

    await updateDocRefsBatch(reviewDocRefs, { username: user.username } as Review);
}
