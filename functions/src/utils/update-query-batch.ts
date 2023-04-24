import {firestoreDatabase} from '../modules/firebase-admin-module';
import {QueryDocumentSnapshot} from 'firebase-functions/lib/providers/firestore';
import {firestore} from 'firebase-admin';
import {toJson} from "./json-utils";
import DocumentData = firestore.DocumentData;
import UpdateData = firestore.UpdateData;

export async function updateQueryBatch<T>(query: DocumentData, data: UpdateData<T>) {
    const snapshot: DocumentData = await query.get();

    const batchSize = snapshot.size;

    if (batchSize === 0) return;

    const batch = firestoreDatabase().batch();

    snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
        batch.update(doc.ref, toJson(data));
    });

    await batch.commit();

    process.nextTick(() => {
        updateQueryBatch(query, data);
    });
}
