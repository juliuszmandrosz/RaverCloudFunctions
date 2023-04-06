import * as functions from 'firebase-functions';
import {wallPhotoCollection} from '../modules/typesense-module';

export async function onWallPhotoDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await deleteWallPhotoFromTypesense(snapshot.id);
}

async function deleteWallPhotoFromTypesense(wallPhotoId: string) {
    await wallPhotoCollection.documents(wallPhotoId).delete();
}
