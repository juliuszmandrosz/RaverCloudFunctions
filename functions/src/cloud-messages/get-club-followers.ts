import { firestoreDatabase } from '../modules/firebase-admin-module';
import { users } from '../constants/collections';

export async function getClubFollowers(clubId: string) {
    return firestoreDatabase()
        .collection(users)
        .where('favoriteClubIds', 'array-contains', clubId)
        .get();
}
