import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { clubs } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { Club } from '../../models/club';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

const message = 'Club with given id does not exists';

export async function tryGetClubData(clubId: string) {
    const clubDoc = await getClubDocRef(clubId).get();

    if (!clubDoc.exists) {
        throw new functions.https.HttpsError('not-found', message);
    }

    return getClubResult(clubDoc, clubId);
}

export async function getClubDataOrUndefined(clubId: string, response: functions.Response) {
    const clubDoc = await getClubDocRef(clubId).get();

    if (!clubDoc.exists) {
        response.status(404).send(message);
        return;
    }

    return getClubResult(clubDoc, clubId);
}

export function getClubDocRef(clubId: string) {
    return firestoreDatabase().collection(clubs).doc(clubId);
}

function getClubResult(clubDoc: DocumentSnapshot, clubId: string) {
    const result = clubDoc.data() as Club;
    result.id = clubId;

    return result;
}
