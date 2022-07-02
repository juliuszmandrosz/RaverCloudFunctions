import * as functions from 'firebase-functions';
import { clubCollection } from '../modules/typesense-module';

export async function onClubDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await deleteClubFromTypesense(snapshot.id);
}

async function deleteClubFromTypesense(clubId: string) {
    await clubCollection.documents(clubId).delete();
}
