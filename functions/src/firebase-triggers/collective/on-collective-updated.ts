import * as functions from 'firebase-functions';
import {DocumentSnapshot} from 'firebase-functions/lib/providers/firestore';
import {firestore} from "firebase-admin";
import {mapDataToAlgolia} from "../../utils/map-data-to-algolia";
import {collectivesIndex} from "../../modules/algolia-module";
import DocumentData = firestore.DocumentData;

export async function onCollectiveUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    await updateCollectiveInAlgolia(change.after.data()!, change.after.id);
}


async function updateCollectiveInAlgolia(data: DocumentData, id: string) {
    const object = mapDataToAlgolia(data, id);
    await collectivesIndex.saveObject(object);
}
