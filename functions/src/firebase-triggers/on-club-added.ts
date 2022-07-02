import * as functions from 'firebase-functions';
import { Club } from '../models/club';
import { clubCollection } from '../modules/typesense-module';

export async function onClubAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const club = snapshot.data() as Club;
    club.id = snapshot.id;

    await addClubToTypesense(club);
}

async function addClubToTypesense(club: Club) {
    await clubCollection.documents().create(club);
}
