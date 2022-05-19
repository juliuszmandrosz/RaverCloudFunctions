import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { clubs } from '../../constants/collections';

export function getClubDocRef(clubId: string) {
    return firestoreDatabase().collection(clubs).doc(clubId);
}
