import * as functions from 'firebase-functions';
import {wallPhotoCollection} from '../modules/typesense-module';
import {DocumentSnapshot} from 'firebase-functions/lib/providers/firestore';

export async function onWallPhotoUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    const updatedWallPhoto = change.after.data() as WallPhoto;
    updatedWallPhoto.id = change.after.id;

    await updateWallPhotoInTypesense(updatedWallPhoto);
}

async function updateWallPhotoInTypesense(wallPhoto: WallPhoto) {
    await wallPhotoCollection.documents(wallPhoto.id).update(wallPhoto);
}
