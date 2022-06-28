import { firestoreDatabase } from '../modules/firebase-admin-module';
import { users } from '../constants/collections';

export async function getEventFollowers(eventId: string) {
    return firestoreDatabase()
        .collection(users)
        .where('favoriteEventIds', 'array-contains', eventId)
        .get();
}
