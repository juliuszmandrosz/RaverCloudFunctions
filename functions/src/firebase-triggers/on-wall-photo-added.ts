import * as functions from 'firebase-functions';
import {wallPhotoCollection} from '../modules/typesense-module';


export async function onWallPhotoAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const wallPhoto = snapshot.data() as WallPhoto;
    wallPhoto.id = snapshot.id;

    await addWallPhotoToTypesense(wallPhoto);
}

async function addWallPhotoToTypesense(wallPhoto: WallPhoto) {
    await wallPhotoCollection.documents().create(wallPhoto);
}


