import * as functions from 'firebase-functions';
import { Club } from '../models/club';
import { clubCollection } from '../modules/typesense-module';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

export async function onClubUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    const updatedClub = change.after.data() as Club;
    updatedClub.id = change.after.id;

    await updateClubInTypesense(updatedClub);
}

async function updateClubInTypesense(club: Club) {
    await clubCollection.documents(club.id).update(club);
}
