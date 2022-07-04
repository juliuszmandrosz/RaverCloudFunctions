import { firestoreDatabase } from '../modules/firebase-admin-module';
import { firestore } from 'firebase-admin';
import DocumentReference = firestore.DocumentReference;
import UpdateData = firestore.UpdateData;
import { toJson } from './json-utils';

export async function updateDocRefsBatch<T>(docRefs: DocumentReference[], data: UpdateData<T>) {
    const docRefsToUpdate = docRefs.slice(0, 500);
    const batchSize = docRefsToUpdate.length;

    if (batchSize === 0) return;

    const batch = firestoreDatabase().batch();

    docRefs.forEach((ref) => {
        batch.update(ref, toJson(data));
    });

    await batch.commit();

    docRefs.splice(0, 500);

    process.nextTick(() => {
        updateDocRefsBatch(docRefs, data);
    });
}
