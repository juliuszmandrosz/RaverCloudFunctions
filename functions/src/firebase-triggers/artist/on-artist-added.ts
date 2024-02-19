import * as functions from 'firebase-functions';
import {firestore} from "firebase-admin";
import {artistsIndex} from "../../modules/algolia-module";
import {mapDataToAlgolia} from "../../utils/map-data-to-algolia";
import DocumentData = firestore.DocumentData;

export async function onArtistAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await addArtistToAlgolia(snapshot.data()!, snapshot.id);
}

async function addArtistToAlgolia(data: DocumentData, id: string) {
    const object = mapDataToAlgolia(data, id);
    await artistsIndex.saveObject(object);
}
